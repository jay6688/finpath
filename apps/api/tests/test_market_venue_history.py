from datetime import date

import pytest

from app.domain.market_data import (
    MarketDataValidationError,
    MarketSecurityProfile,
    MarketVenuePeriod,
    resolve_market_security_profile,
)


@pytest.mark.parametrize(
    ("ticker", "price_date", "exchange"),
    [
        ("AAPL", date(2025, 10, 17), "XNAS"),
        ("MSFT", date(2026, 7, 23), "XNAS"),
        ("WMT", date(2025, 12, 8), "XNYS"),
        ("WMT", date(2026, 3, 11), "XNAS"),
    ],
)
def test_resolves_reviewed_exchange_for_requested_date(
    ticker: str, price_date: date, exchange: str
) -> None:
    resolved = resolve_market_security_profile(ticker, price_date)

    assert resolved.ticker == ticker
    assert resolved.provider_exchange == exchange
    assert resolved.currency == "USD"


def test_walmart_post_transfer_date_cannot_resolve_to_old_nyse_identity() -> None:
    assert (
        resolve_market_security_profile("WMT", date(2026, 1, 30)).provider_exchange
        == "XNAS"
    )


def test_overlapping_venue_periods_are_rejected() -> None:
    with pytest.raises(MarketDataValidationError, match="overlap"):
        MarketSecurityProfile(
            ticker="TEST",
            provider="marketstack",
            provider_symbol="TEST",
            currency="USD",
            venue_periods=(
                MarketVenuePeriod(
                    provider_exchange="XNYS",
                    valid_from=date(2025, 1, 1),
                    valid_through=date(2025, 6, 30),
                ),
                MarketVenuePeriod(
                    provider_exchange="XNAS",
                    valid_from=date(2025, 6, 30),
                    valid_through=None,
                ),
            ),
        )


def test_date_outside_reviewed_venue_history_fails_closed() -> None:
    with pytest.raises(MarketDataValidationError, match="venue history"):
        resolve_market_security_profile("WMT", date(2025, 12, 7))
