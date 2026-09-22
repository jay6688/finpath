from datetime import date, datetime, timezone
from typing import Callable, Protocol

from app.cache.market_data_cache import MarketDataCache, MarketDataCacheEntry
from app.domain.market_data import (
    MarketDataState,
    MarketDataUnavailableError,
    MarketDataValidationError,
    MarketPriceSnapshot,
    ResolvedMarketSecurityProfile,
    ProviderMarketPrice,
    resolve_market_security_profile,
)


class MarketDataProvider(Protocol):
    name: str

    async def get_eod_close(
        self,
        profile: ResolvedMarketSecurityProfile,
        price_date: date,
    ) -> ProviderMarketPrice: ...


class MarketPriceService:
    def __init__(
        self,
        *,
        provider: MarketDataProvider,
        cache: MarketDataCache,
        refresh_seconds: int,
        stale_if_error_seconds: int,
        clock: Callable[[], datetime] | None = None,
    ) -> None:
        self.provider = provider
        self.cache = cache
        self.refresh_seconds = refresh_seconds
        self.stale_if_error_seconds = stale_if_error_seconds
        self.clock = clock or (lambda: datetime.now(timezone.utc))

    async def get_eod_close(
        self, ticker: str, price_date: date
    ) -> MarketPriceSnapshot:
        profile = resolve_market_security_profile(ticker, price_date)
        if profile.provider != self.provider.name:
            raise MarketDataValidationError(
                "The reviewed security profile does not match the configured provider."
            )
        now = self.clock()
        cached = self.cache.get(
            provider=profile.provider,
            provider_symbol=profile.provider_symbol,
            price_date=price_date,
            price_type="close",
            adjustment="raw",
        )
        if cached and cached.is_fresh(now, self.refresh_seconds):
            return _snapshot(profile, price_date, cached, MarketDataState.CACHED)

        try:
            observation = await self.provider.get_eod_close(profile, price_date)
            _validate_observation(observation, profile, price_date)
        except MarketDataUnavailableError:
            if cached and cached.can_serve_stale(now, self.stale_if_error_seconds):
                return _snapshot(profile, price_date, cached, MarketDataState.STALE)
            raise

        retrieved_at = self.clock()
        self.cache.set(
            provider=observation.provider,
            provider_symbol=observation.provider_symbol,
            price_date=observation.price_date,
            price_type=observation.price_type,
            adjustment=observation.adjustment,
            price=observation.price,
            currency=observation.currency,
            provider_exchange=observation.provider_exchange,
            fetched_at=retrieved_at,
        )
        return MarketPriceSnapshot(
            ticker=profile.ticker,
            priceDate=observation.price_date,
            price=observation.price,
            currency=observation.currency,
            priceType=observation.price_type,
            adjustment=observation.adjustment,
            provider=observation.provider,
            providerSymbol=observation.provider_symbol,
            providerExchange=observation.provider_exchange,
            retrievedAt=retrieved_at,
            dataState=MarketDataState.LIVE,
        )


def _validate_observation(
    observation: ProviderMarketPrice,
    profile: ResolvedMarketSecurityProfile,
    price_date: date,
) -> None:
    if (
        observation.provider != profile.provider
        or observation.provider_symbol != profile.provider_symbol
        or observation.provider_exchange != profile.provider_exchange
        or observation.currency != profile.currency
        or observation.price_date != price_date
        or observation.price_type != "close"
        or observation.adjustment != "raw"
        or not observation.price.is_finite()
        or observation.price <= 0
    ):
        raise MarketDataValidationError(
            "The provider observation does not match the reviewed market identity."
        )


def _snapshot(
    profile: ResolvedMarketSecurityProfile,
    price_date: date,
    cached: MarketDataCacheEntry,
    state: MarketDataState,
) -> MarketPriceSnapshot:
    if (
        cached.currency != profile.currency
        or cached.provider_exchange != profile.provider_exchange
        or not cached.price.is_finite()
        or cached.price <= 0
    ):
        raise MarketDataValidationError(
            "The cached market observation does not match the reviewed identity."
        )
    return MarketPriceSnapshot(
        ticker=profile.ticker,
        priceDate=price_date,
        price=cached.price,
        currency=cached.currency,
        priceType="close",
        adjustment="raw",
        provider=profile.provider,
        providerSymbol=profile.provider_symbol,
        providerExchange=cached.provider_exchange,
        retrievedAt=cached.fetched_at,
        dataState=state,
    )
