import asyncio
from dataclasses import dataclass
from datetime import datetime, timezone
import time
from typing import Any, Callable

import httpx

from app.cache.sqlite_cache import CacheEntry, SqliteJsonCache
from app.core.settings import Settings
from app.schemas.company import DataState


SEC_TICKER_MAP_URL = "https://www.sec.gov/files/company_tickers.json"
SEC_COMPANY_FACTS_URL = "https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json"


class SecConfigurationError(RuntimeError):
    pass


class SecUpstreamError(RuntimeError):
    pass


@dataclass(frozen=True)
class SecPayload:
    payload: dict[str, Any]
    state: DataState
    retrieved_at: datetime


class SecClient:
    def __init__(
        self,
        settings: Settings,
        cache: SqliteJsonCache,
        *,
        clock: Callable[[], datetime] | None = None,
        monotonic: Callable[[], float] | None = None,
    ) -> None:
        self.settings = settings
        self.cache = cache
        self.clock = clock or (lambda: datetime.now(timezone.utc))
        self.monotonic = monotonic or time.monotonic
        self._rate_lock = asyncio.Lock()
        self._last_request_started: float | None = None

    async def get_ticker_map(self) -> SecPayload:
        return await self._get_cached_json(
            namespace="ticker-map",
            cache_key="company_tickers",
            url=SEC_TICKER_MAP_URL,
            ttl_seconds=self.settings.sec_ticker_map_ttl_seconds,
        )

    async def get_company_facts(self, cik: str) -> SecPayload:
        normalized_cik = cik.strip().zfill(10)
        return await self._get_cached_json(
            namespace="company-facts",
            cache_key=normalized_cik,
            url=SEC_COMPANY_FACTS_URL.format(cik=normalized_cik),
            ttl_seconds=self.settings.sec_company_facts_ttl_seconds,
        )

    async def _get_cached_json(
        self,
        *,
        namespace: str,
        cache_key: str,
        url: str,
        ttl_seconds: int,
    ) -> SecPayload:
        now = self.clock()
        cached = self.cache.get(namespace, cache_key)
        if cached and cached.is_fresh(now, ttl_seconds):
            return self._from_cache(cached, DataState.CACHED)

        try:
            payload = await self._request_json(url)
        except (httpx.HTTPError, SecConfigurationError, SecUpstreamError) as error:
            if cached and cached.can_serve_stale(
                now, self.settings.sec_stale_if_error_seconds
            ):
                return self._from_cache(cached, DataState.STALE)
            if isinstance(error, SecConfigurationError):
                raise
            raise SecUpstreamError(f"SEC request failed for {url}") from error

        retrieved_at = self.clock()
        self.cache.set(namespace, cache_key, payload, retrieved_at)
        return SecPayload(
            payload=payload,
            state=DataState.LIVE,
            retrieved_at=retrieved_at,
        )

    async def _request_json(self, url: str) -> dict[str, Any]:
        try:
            user_agent = self.settings.require_sec_user_agent()
        except RuntimeError as error:
            raise SecConfigurationError(str(error)) from error

        await self._wait_for_rate_slot()
        headers = {
            "User-Agent": user_agent,
            "Accept-Encoding": "gzip, deflate",
            "Accept": "application/json",
        }
        timeout = httpx.Timeout(15.0, connect=10.0)
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            try:
                payload = response.json()
            except ValueError as error:
                raise SecUpstreamError("SEC returned invalid JSON") from error

        if not isinstance(payload, dict):
            raise SecUpstreamError("SEC returned a non-object JSON payload")
        return payload

    async def _wait_for_rate_slot(self) -> None:
        minimum_interval = 1 / self.settings.sec_requests_per_second
        async with self._rate_lock:
            now = self.monotonic()
            if self._last_request_started is not None:
                wait_seconds = minimum_interval - (now - self._last_request_started)
                if wait_seconds > 0:
                    await asyncio.sleep(wait_seconds)
            self._last_request_started = self.monotonic()

    @staticmethod
    def _from_cache(entry: CacheEntry, state: DataState) -> SecPayload:
        return SecPayload(
            payload=entry.payload,
            state=state,
            retrieved_at=entry.fetched_at,
        )
