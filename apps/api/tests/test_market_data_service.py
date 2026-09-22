import asyncio
from dataclasses import replace
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
import json

import httpx
import pytest

from app.cache.market_data_cache import MarketDataCache
from app.domain.market_data import (
    MarketPriceSnapshot,
    MarketDataState,
    MarketDataUnavailableError,
    MarketDataValidationError,
    ProviderMarketPrice,
)
from app.services.market_data.service import MarketPriceService
from app.services.market_data.marketstack import MarketstackProvider


NOW = datetime(2026, 9, 22, tzinfo=timezone.utc)
PRICE_DATE = date(2025, 9, 26)


class FakeProvider:
    name = "marketstack"

    def __init__(self, result=None, error=None) -> None:
        self.result = result or ProviderMarketPrice(
            price_date=PRICE_DATE,
            price=Decimal("123.45"),
            currency="USD",
            price_type="close",
            adjustment="raw",
            provider="marketstack",
            provider_symbol="AAPL",
            provider_exchange="XNAS",
        )
        self.error = error
        self.calls = 0

    async def get_eod_close(self, profile, price_date):
        self.calls += 1
        if self.error:
            raise self.error
        return replace(self.result, price_date=price_date)


def make_service(tmp_path, provider, *, clock=lambda: NOW):
    return MarketPriceService(
        provider=provider,
        cache=MarketDataCache(tmp_path / "market-data.sqlite3"),
        refresh_seconds=24 * 60 * 60,
        stale_if_error_seconds=7 * 24 * 60 * 60,
        clock=clock,
    )


def test_first_request_fetches_and_second_request_is_explicitly_cached(tmp_path) -> None:
    provider = FakeProvider()
    service = make_service(tmp_path, provider)

    live = asyncio.run(service.get_eod_close("AAPL", PRICE_DATE))
    cached = asyncio.run(service.get_eod_close("AAPL", PRICE_DATE))

    assert live.data_state == MarketDataState.LIVE
    assert cached.data_state == MarketDataState.CACHED
    assert live.price == cached.price == Decimal("123.45")
    assert provider.calls == 1
    assert '"price":"123.45"' in live.model_dump_json(by_alias=True)


def test_stale_cache_is_visible_only_after_refresh_failure(tmp_path) -> None:
    provider = FakeProvider()
    service = make_service(tmp_path, provider)
    asyncio.run(service.get_eod_close("AAPL", PRICE_DATE))
    later = NOW + timedelta(days=2)
    failing = make_service(
        tmp_path,
        FakeProvider(error=MarketDataUnavailableError("provider unavailable")),
        clock=lambda: later,
    )

    result = asyncio.run(failing.get_eod_close("AAPL", PRICE_DATE))

    assert result.data_state == MarketDataState.STALE
    assert result.retrieved_at == NOW


def test_cache_expired_beyond_stale_window_fails(tmp_path) -> None:
    provider = FakeProvider()
    asyncio.run(make_service(tmp_path, provider).get_eod_close("AAPL", PRICE_DATE))
    expired = make_service(
        tmp_path,
        FakeProvider(error=MarketDataUnavailableError("provider unavailable")),
        clock=lambda: NOW + timedelta(days=8),
    )

    with pytest.raises(MarketDataUnavailableError):
        asyncio.run(expired.get_eod_close("AAPL", PRICE_DATE))


def test_unsupported_ticker_and_cross_security_result_fail_closed(tmp_path) -> None:
    with pytest.raises(MarketDataValidationError, match="reviewed"):
        asyncio.run(make_service(tmp_path, FakeProvider()).get_eod_close("TSLA", PRICE_DATE))

    wrong_security = ProviderMarketPrice(
        price_date=PRICE_DATE,
        price=Decimal("123.45"),
        currency="USD",
        price_type="close",
        adjustment="raw",
        provider="marketstack",
        provider_symbol="MSFT",
        provider_exchange="XNAS",
    )
    with pytest.raises(MarketDataValidationError, match="identity"):
        asyncio.run(
            make_service(tmp_path, FakeProvider(result=wrong_security)).get_eod_close(
                "AAPL", PRICE_DATE
            )
        )


def test_api_key_is_not_persisted_in_normalized_cache(tmp_path) -> None:
    cache_path = tmp_path / "market-data.sqlite3"
    secret = "marketstack-test-secret"
    payload = {
        "data": [
            {
                "symbol": "AAPL",
                "exchange": "XNAS",
                "date": "2025-09-26T00:00:00+0000",
                "close": 123.45,
            }
        ]
    }

    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, content=json.dumps(payload).encode())

    provider = MarketstackProvider(secret, transport=httpx.MockTransport(handler))
    asyncio.run(make_service(tmp_path, provider).get_eod_close("AAPL", PRICE_DATE))

    raw_cache = cache_path.read_bytes()

    assert b"access_key" not in raw_cache
    assert secret.encode() not in raw_cache
    assert b"123.45" in raw_cache


def test_weekend_has_no_previous_trading_day_fallback(tmp_path) -> None:
    sunday = date(2025, 9, 28)
    provider = FakeProvider(error=MarketDataUnavailableError("no exact date"))

    with pytest.raises(MarketDataUnavailableError):
        asyncio.run(make_service(tmp_path, provider).get_eod_close("AAPL", sunday))

    assert provider.calls == 1


def test_snapshot_contract_is_not_locked_to_marketstack() -> None:
    snapshot = MarketPriceSnapshot(
        ticker="AAPL",
        priceDate=PRICE_DATE,
        price=Decimal("123.45"),
        currency="USD",
        priceType="close",
        adjustment="raw",
        provider="replacement-provider",
        providerSymbol="AAPL:US",
        providerExchange="XNAS",
        retrievedAt=NOW,
        dataState=MarketDataState.LIVE,
    )

    assert snapshot.provider == "replacement-provider"
