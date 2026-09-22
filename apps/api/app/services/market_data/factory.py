from app.cache.market_data_cache import MarketDataCache
from app.core.settings import Settings
from app.domain.market_data import MarketDataConfigurationError
from app.services.market_data.marketstack import MarketstackProvider
from app.services.market_data.service import MarketPriceService


def build_market_price_service(settings: Settings) -> MarketPriceService:
    if settings.market_data_provider == "disabled":
        raise MarketDataConfigurationError("Market data is disabled.")
    if settings.market_data_provider != "marketstack":
        raise MarketDataConfigurationError("Unsupported market-data provider.")
    if not settings.marketstack_access_key:
        raise MarketDataConfigurationError(
            "MARKETSTACK_ACCESS_KEY is required when Marketstack is enabled."
        )
    return MarketPriceService(
        provider=MarketstackProvider(settings.marketstack_access_key),
        cache=MarketDataCache(settings.market_data_cache_path),
        refresh_seconds=settings.market_data_refresh_seconds,
        stale_if_error_seconds=settings.market_data_stale_if_error_seconds,
    )
