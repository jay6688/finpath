import asyncio
from datetime import date
from decimal import Decimal
import json
from pathlib import Path

import httpx
import pytest

from app.domain.market_data import (
    MarketDataUnavailableError,
    MarketDataValidationError,
    get_market_security_profile,
)
from app.services.market_data.marketstack import (
    MARKETSTACK_EOD_URL,
    MarketstackProvider,
)


FIXTURES = Path(__file__).parent / "fixtures" / "marketstack"
TEST_KEY = "marketstack-test-secret"
PRICE_DATE = date(2025, 9, 26)


def fixture_bytes(name: str) -> bytes:
    return (FIXTURES / name).read_bytes()


def provider_for_fixture(name: str, *, status_code: int = 200):
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(status_code, content=fixture_bytes(name))

    return (
        MarketstackProvider(TEST_KEY, transport=httpx.MockTransport(handler)),
        requests,
    )


def get_aapl(provider: MarketstackProvider):
    return asyncio.run(
        provider.get_eod_close(get_market_security_profile("AAPL"), PRICE_DATE)
    )


def test_exact_raw_close_uses_https_params_and_preserves_decimal() -> None:
    provider, requests = provider_for_fixture("aapl_success.json")

    result = get_aapl(provider)

    assert result.price == Decimal("123.45")
    assert result.price_date == PRICE_DATE
    assert result.provider_symbol == "AAPL"
    assert result.provider_exchange == "XNAS"
    assert result.currency == "USD"
    assert result.price_type == "close"
    assert result.adjustment == "raw"
    assert requests[0].url.scheme == "https"
    assert str(requests[0].url.copy_with(query=None)) == MARKETSTACK_EOD_URL
    assert requests[0].url.params["access_key"] == TEST_KEY
    assert requests[0].url.params["date_from"] == PRICE_DATE.isoformat()
    assert requests[0].url.params["date_to"] == PRICE_DATE.isoformat()
    assert TEST_KEY not in repr(result)


def test_raw_close_wins_over_adjusted_close() -> None:
    provider, _ = provider_for_fixture("aapl_success.json")

    result = get_aapl(provider)

    assert result.price == Decimal("123.45")
    assert result.price != Decimal("120.00")


@pytest.mark.parametrize(
    ("ticker", "price_date", "fixture", "price", "exchange"),
    [
        ("AAPL", date(2025, 9, 26), "aapl_success.json", "123.45", "XNAS"),
        ("MSFT", date(2026, 6, 30), "msft_success.json", "234.56", "XNAS"),
        ("WMT", date(2026, 1, 30), "wmt_success.json", "345.67", "XNYS"),
    ],
)
def test_reviewed_security_profiles_normalize_provider_identity(
    ticker, price_date, fixture, price, exchange
) -> None:
    provider, _ = provider_for_fixture(fixture)

    result = asyncio.run(
        provider.get_eod_close(get_market_security_profile(ticker), price_date)
    )

    assert result.provider_symbol == ticker
    assert result.provider_exchange == exchange
    assert result.currency == "USD"
    assert result.price == Decimal(price)


@pytest.mark.parametrize(
    ("fixture", "error_type"),
    [
        ("no_result.json", MarketDataUnavailableError),
        ("wrong_date.json", MarketDataUnavailableError),
        ("wrong_ticker.json", MarketDataValidationError),
        ("wrong_exchange.json", MarketDataValidationError),
        ("missing_close.json", MarketDataValidationError),
        ("only_adjusted_close.json", MarketDataValidationError),
        ("zero_close.json", MarketDataValidationError),
        ("negative_close.json", MarketDataValidationError),
        ("malformed_price.json", MarketDataValidationError),
        ("duplicate_conflicting.json", MarketDataValidationError),
        ("provider_error.json", MarketDataUnavailableError),
    ],
)
def test_invalid_provider_responses_fail_closed(fixture, error_type) -> None:
    provider, _ = provider_for_fixture(fixture)

    with pytest.raises(error_type) as caught:
        get_aapl(provider)

    assert TEST_KEY not in str(caught.value)


def test_identical_duplicate_records_collapse_safely() -> None:
    provider, _ = provider_for_fixture("duplicate_same_value.json")

    assert get_aapl(provider).price == Decimal("123.45")


def test_non_json_and_http_failures_do_not_leak_key() -> None:
    def invalid_json(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, content=b"not json")

    def upstream_failure(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(503, content=(TEST_KEY + " provider body").encode())

    for transport in (httpx.MockTransport(invalid_json), httpx.MockTransport(upstream_failure)):
        provider = MarketstackProvider(TEST_KEY, transport=transport)
        with pytest.raises(MarketDataUnavailableError) as caught:
            get_aapl(provider)
        assert TEST_KEY not in str(caught.value)


def test_timeout_does_not_leak_key() -> None:
    def timeout(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("secret URL", request=request)

    provider = MarketstackProvider(TEST_KEY, transport=httpx.MockTransport(timeout))

    with pytest.raises(MarketDataUnavailableError) as caught:
        get_aapl(provider)

    assert TEST_KEY not in str(caught.value)


@pytest.mark.parametrize("literal", ["0", "-1", "NaN", "Infinity", "-Infinity"])
def test_non_positive_or_non_finite_decimals_are_rejected(literal: str) -> None:
    payload = {
        "data": [
            {
                "symbol": "AAPL",
                "exchange": "XNAS",
                "date": "2025-09-26T00:00:00+0000",
                "close": literal,
            }
        ]
    }

    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, content=json.dumps(payload).encode())

    provider = MarketstackProvider(TEST_KEY, transport=httpx.MockTransport(handler))
    with pytest.raises(MarketDataValidationError):
        get_aapl(provider)
