from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class MarketDataConfigurationError(RuntimeError):
    pass


class MarketDataUnavailableError(RuntimeError):
    pass


class MarketDataValidationError(RuntimeError):
    pass


class MarketDataState(StrEnum):
    LIVE = "live"
    CACHED = "cached"
    STALE = "stale"


@dataclass(frozen=True)
class MarketVenuePeriod:
    provider_exchange: str
    valid_from: date
    valid_through: date | None

    def __post_init__(self) -> None:
        if not self.provider_exchange.strip():
            raise MarketDataValidationError("Provider exchange must not be empty.")
        if self.valid_through is not None and self.valid_through < self.valid_from:
            raise MarketDataValidationError(
                "A market venue period cannot end before it starts."
            )

    def includes(self, price_date: date) -> bool:
        return self.valid_from <= price_date and (
            self.valid_through is None or price_date <= self.valid_through
        )


@dataclass(frozen=True)
class MarketSecurityProfile:
    ticker: str
    provider: str
    provider_symbol: str
    currency: str
    venue_periods: tuple[MarketVenuePeriod, ...]

    def __post_init__(self) -> None:
        if not self.venue_periods:
            raise MarketDataValidationError(
                "A reviewed market security requires venue history."
            )
        ordered = sorted(self.venue_periods, key=lambda period: period.valid_from)
        if tuple(ordered) != self.venue_periods:
            raise MarketDataValidationError(
                "Market venue periods must be ordered by valid-from date."
            )
        for previous, current in zip(ordered, ordered[1:]):
            if previous.valid_through is None or previous.valid_through >= current.valid_from:
                raise MarketDataValidationError(
                    "Market venue periods must not overlap."
                )

    def resolve(self, price_date: date) -> "ResolvedMarketSecurityProfile":
        matches = [period for period in self.venue_periods if period.includes(price_date)]
        if len(matches) != 1:
            raise MarketDataValidationError(
                f"{self.ticker} has no single reviewed venue history entry for "
                f"{price_date.isoformat()}."
            )
        return ResolvedMarketSecurityProfile(
            ticker=self.ticker,
            provider=self.provider,
            provider_symbol=self.provider_symbol,
            provider_exchange=matches[0].provider_exchange,
            currency=self.currency,
        )


@dataclass(frozen=True)
class ResolvedMarketSecurityProfile:
    ticker: str
    provider: str
    provider_symbol: str
    provider_exchange: str
    currency: str


@dataclass(frozen=True)
class ProviderMarketPrice:
    price_date: date
    price: Decimal
    currency: str
    price_type: Literal["close"]
    adjustment: Literal["raw"]
    provider: str
    provider_symbol: str
    provider_exchange: str


class MarketPriceSnapshot(BaseModel):
    """Provider-neutral exact-date price with market-data provenance."""

    model_config = ConfigDict(populate_by_name=True)

    ticker: str
    price_date: date = Field(alias="priceDate")
    price: Decimal
    currency: str
    price_type: Literal["close"] = Field(alias="priceType")
    adjustment: Literal["raw"]
    provider: str
    provider_symbol: str = Field(alias="providerSymbol")
    provider_exchange: str = Field(alias="providerExchange")
    retrieved_at: datetime = Field(alias="retrievedAt")
    data_state: MarketDataState = Field(alias="dataState")


_MARKETSTACK_PROFILES = {
    "AAPL": MarketSecurityProfile(
        ticker="AAPL",
        provider="marketstack",
        provider_symbol="AAPL",
        currency="USD",
        venue_periods=(
            MarketVenuePeriod("XNAS", date(2025, 9, 26), None),
        ),
    ),
    "MSFT": MarketSecurityProfile(
        ticker="MSFT",
        provider="marketstack",
        provider_symbol="MSFT",
        currency="USD",
        venue_periods=(
            MarketVenuePeriod("XNAS", date(2026, 6, 30), None),
        ),
    ),
    "WMT": MarketSecurityProfile(
        ticker="WMT",
        provider="marketstack",
        provider_symbol="WMT",
        currency="USD",
        venue_periods=(
            MarketVenuePeriod("XNYS", date(2025, 12, 8), date(2025, 12, 8)),
            MarketVenuePeriod("XNAS", date(2025, 12, 9), None),
        ),
    ),
}


def get_market_security_profile(ticker: str) -> MarketSecurityProfile:
    normalized = ticker.strip().upper()
    try:
        return _MARKETSTACK_PROFILES[normalized]
    except KeyError as error:
        raise MarketDataValidationError(
            f"{normalized or 'Empty ticker'} is not a reviewed market-data security."
        ) from error


def resolve_market_security_profile(
    ticker: str, price_date: date
) -> ResolvedMarketSecurityProfile:
    return get_market_security_profile(ticker).resolve(price_date)
