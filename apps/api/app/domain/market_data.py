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
class MarketSecurityProfile:
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
        provider_exchange="XNAS",
        currency="USD",
    ),
    "MSFT": MarketSecurityProfile(
        ticker="MSFT",
        provider="marketstack",
        provider_symbol="MSFT",
        provider_exchange="XNAS",
        currency="USD",
    ),
    "WMT": MarketSecurityProfile(
        ticker="WMT",
        provider="marketstack",
        provider_symbol="WMT",
        provider_exchange="XNYS",
        currency="USD",
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
