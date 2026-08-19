import asyncio
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock

import httpx

from app.cache.sqlite_cache import SqliteJsonCache
from app.core.settings import Settings
from app.schemas.company import DataState
from app.services.sec.client import SecClient


NOW = datetime(2026, 8, 19, tzinfo=timezone.utc)


def make_settings(cache_path) -> Settings:
    return Settings(
        sec_user_agent="FinPath tests test@example.invalid",
        sec_requests_per_second=2.0,
        sec_company_facts_ttl_seconds=6 * 60 * 60,
        sec_ticker_map_ttl_seconds=24 * 60 * 60,
        sec_stale_if_error_seconds=7 * 24 * 60 * 60,
        sec_cache_path=cache_path,
    )


def test_fresh_cache_avoids_network(tmp_path) -> None:
    cache_path = tmp_path / "cache.sqlite3"
    cache = SqliteJsonCache(cache_path)
    cache.set("ticker-map", "company_tickers", {"cached": True}, NOW)
    client = SecClient(make_settings(cache_path), cache, clock=lambda: NOW)
    client._request_json = AsyncMock()  # type: ignore[method-assign]

    result = asyncio.run(client.get_ticker_map())

    assert result.state == DataState.CACHED
    assert result.payload == {"cached": True}
    client._request_json.assert_not_awaited()


def test_successful_request_is_cached(tmp_path) -> None:
    cache_path = tmp_path / "cache.sqlite3"
    cache = SqliteJsonCache(cache_path)
    client = SecClient(make_settings(cache_path), cache, clock=lambda: NOW)
    client._request_json = AsyncMock(  # type: ignore[method-assign]
        return_value={"live": True}
    )

    result = asyncio.run(client.get_ticker_map())
    cached = cache.get("ticker-map", "company_tickers")

    assert result.state == DataState.LIVE
    assert cached is not None
    assert cached.payload == {"live": True}


def test_stale_cache_is_used_only_when_refresh_fails(tmp_path) -> None:
    cache_path = tmp_path / "cache.sqlite3"
    cache = SqliteJsonCache(cache_path)
    fetched_at = NOW - timedelta(days=2)
    cache.set("ticker-map", "company_tickers", {"lastKnown": True}, fetched_at)
    client = SecClient(make_settings(cache_path), cache, clock=lambda: NOW)
    client._request_json = AsyncMock(  # type: ignore[method-assign]
        side_effect=httpx.ConnectError("SEC unavailable")
    )

    result = asyncio.run(client.get_ticker_map())

    assert result.state == DataState.STALE
    assert result.retrieved_at == fetched_at
    assert result.payload == {"lastKnown": True}
