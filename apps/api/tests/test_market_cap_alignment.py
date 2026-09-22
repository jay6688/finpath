from dataclasses import replace
from datetime import date, datetime, timezone
from decimal import Decimal

import pytest

from app.domain.market_cap import (
    MarketCapAlignmentError,
    calculate_exact_market_cap,
    derive_market_cap_snapshot,
    get_market_cap_profile,
)
from app.domain.market_data import MarketDataState, MarketPriceSnapshot
from app.domain.shares_outstanding import extract_shares_outstanding
from tests.fixture_loader import load_sec_fixture


RETRIEVED_AT = datetime(2026, 9, 22, tzinfo=timezone.utc)


def aapl_inputs():
    shares = extract_shares_outstanding(
        load_sec_fixture("aapl_companyfacts.json"),
        cik="0000320193",
        fiscal_year=2025,
    )
    price = MarketPriceSnapshot(
        ticker="AAPL",
        priceDate=date(2025, 10, 17),
        price=Decimal("12.34"),
        currency="USD",
        priceType="close",
        adjustment="raw",
        provider="marketstack",
        providerSymbol="AAPL",
        providerExchange="XNAS",
        retrievedAt=RETRIEVED_AT,
        dataState=MarketDataState.CACHED,
    )
    return shares, price


def test_decimal_market_cap_arithmetic_is_exact_and_never_display_rounded() -> None:
    assert calculate_exact_market_cap(100, Decimal("12.34")) == Decimal("1234.00")

    shares, price = aapl_inputs()
    result = derive_market_cap_snapshot(
        get_market_cap_profile("AAPL", 2025), shares, price
    )

    assert result.exact_value == Decimal("182340196020.00")
    assert result.as_of_date == date(2025, 10, 17)
    assert result.currency == "USD"
    assert result.evidence_kind == "derived"
    assert result.market_price.data_state == MarketDataState.CACHED
    assert result.shares_outstanding.evidence_kind == "reported"


@pytest.mark.parametrize(
    ("fixture", "ticker", "cik", "fiscal_year", "price_date", "exchange"),
    [
        (
            "aapl_companyfacts.json",
            "AAPL",
            "0000320193",
            2025,
            date(2025, 10, 17),
            "XNAS",
        ),
        (
            "msft_companyfacts.json",
            "MSFT",
            "0000789019",
            2026,
            date(2026, 7, 23),
            "XNAS",
        ),
        (
            "wmt_companyfacts.json",
            "WMT",
            "0000104169",
            2026,
            date(2026, 3, 11),
            "XNAS",
        ),
    ],
)
def test_all_reviewed_profiles_compose_two_distinct_trust_domains(
    fixture, ticker, cik, fiscal_year, price_date, exchange
) -> None:
    shares = extract_shares_outstanding(
        load_sec_fixture(fixture), cik=cik, fiscal_year=fiscal_year
    )
    synthetic_price = MarketPriceSnapshot(
        ticker=ticker,
        priceDate=price_date,
        price=Decimal("12.34"),
        currency="USD",
        priceType="close",
        adjustment="raw",
        provider="marketstack",
        providerSymbol=ticker,
        providerExchange=exchange,
        retrievedAt=RETRIEVED_AT,
        dataState=MarketDataState.LIVE,
    )

    result = derive_market_cap_snapshot(
        get_market_cap_profile(ticker, fiscal_year), shares, synthetic_price
    )

    assert result.shares_outstanding.accession == shares.accession
    assert result.market_price.provider == "marketstack"
    assert result.exact_value == Decimal(shares.value) * Decimal("12.34")


@pytest.mark.parametrize("offset_date", [date(2025, 10, 16), date(2025, 10, 18)])
def test_rejects_even_one_day_of_share_price_misalignment(offset_date: date) -> None:
    shares, price = aapl_inputs()
    wrong_date = price.model_copy(update={"price_date": offset_date})

    with pytest.raises(MarketCapAlignmentError, match="same exact date"):
        derive_market_cap_snapshot(
            get_market_cap_profile("AAPL", 2025), shares, wrong_date
        )


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("ticker", "MSFT"),
        ("provider_symbol", "MSFT"),
        ("provider_exchange", "XNYS"),
        ("currency", "EUR"),
        ("price_type", "open"),
        ("adjustment", "adjusted"),
        ("price", Decimal("0")),
    ],
)
def test_rejects_wrong_market_identity_or_price_semantics(
    field: str, value: object
) -> None:
    shares, price = aapl_inputs()
    invalid = price.model_copy(update={field: value})

    with pytest.raises(MarketCapAlignmentError):
        derive_market_cap_snapshot(
            get_market_cap_profile("AAPL", 2025), shares, invalid
        )


def test_stale_state_is_visible_but_cannot_bypass_identity_validation() -> None:
    shares, price = aapl_inputs()
    stale = price.model_copy(update={"data_state": MarketDataState.STALE})
    result = derive_market_cap_snapshot(
        get_market_cap_profile("AAPL", 2025), shares, stale
    )
    assert result.market_price.data_state == MarketDataState.STALE

    wrong_identity = stale.model_copy(update={"provider_exchange": "XNYS"})
    with pytest.raises(MarketCapAlignmentError, match="identity"):
        derive_market_cap_snapshot(
            get_market_cap_profile("AAPL", 2025), shares, wrong_identity
        )


def test_profile_and_reported_share_identity_must_match() -> None:
    shares, price = aapl_inputs()
    wrong_shares = replace(shares, cik="0000789019")

    with pytest.raises(MarketCapAlignmentError, match="SEC share-count identity"):
        derive_market_cap_snapshot(
            get_market_cap_profile("AAPL", 2025), wrong_shares, price
        )


def test_only_three_reviewed_market_cap_profiles_exist() -> None:
    assert get_market_cap_profile("AAPL", 2025).expected_shares_date == date(
        2025, 10, 17
    )
    assert get_market_cap_profile("MSFT", 2026).expected_shares_date == date(
        2026, 7, 23
    )
    assert get_market_cap_profile("WMT", 2026).expected_shares_date == date(
        2026, 3, 11
    )
    with pytest.raises(MarketCapAlignmentError, match="unavailable"):
        get_market_cap_profile("TSLA", 2025)


@pytest.mark.parametrize("price", [Decimal("0"), Decimal("-1"), Decimal("NaN")])
def test_market_cap_rejects_invalid_decimal_prices(price: Decimal) -> None:
    with pytest.raises(MarketCapAlignmentError, match="finite positive"):
        calculate_exact_market_cap(100, price)


def test_market_cap_rejects_binary_float_input() -> None:
    with pytest.raises(MarketCapAlignmentError, match="Decimal"):
        calculate_exact_market_cap(100, 12.34)  # type: ignore[arg-type]
