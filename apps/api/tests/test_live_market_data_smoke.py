import asyncio
from datetime import date
from decimal import Decimal
import os

import pytest

from app.core.settings import Settings
from app.domain.market_data import resolve_market_security_profile
from app.services.market_data.marketstack import MarketstackProvider


@pytest.mark.live
def test_live_marketstack_exact_date_when_explicitly_enabled() -> None:
    if os.getenv("FINPATH_RUN_LIVE_MARKET_DATA_TEST") != "1":
        pytest.skip(
            "Set FINPATH_RUN_LIVE_MARKET_DATA_TEST=1 to enable Marketstack."
        )
    settings = Settings.from_project_environment()
    if not settings.marketstack_access_key:
        pytest.skip("MARKETSTACK_ACCESS_KEY is required for the optional live test.")

    requested_date = date(2025, 9, 26)
    result = asyncio.run(
        MarketstackProvider(settings.marketstack_access_key).get_eod_close(
            resolve_market_security_profile("AAPL", requested_date), requested_date
        )
    )

    assert result.price_date == requested_date
    assert result.provider_symbol == "AAPL"
    assert result.provider_exchange == "XNAS"
    assert result.currency == "USD"
    assert result.price_type == "close"
    assert result.adjustment == "raw"
    assert isinstance(result.price, Decimal)
    assert result.price.is_finite()
    assert result.price > 0
    assert settings.marketstack_access_key not in repr(result)
