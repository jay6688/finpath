from pathlib import Path

import pytest

from app.core.settings import Settings
from app.main import create_app
from app.services.market_data.factory import build_market_price_service
from app.domain.market_data import MarketDataConfigurationError


def test_market_data_is_disabled_and_public_display_unapproved_by_default(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    for name in (
        "MARKET_DATA_PROVIDER",
        "MARKETSTACK_ACCESS_KEY",
        "MARKET_DATA_PUBLIC_DISPLAY_APPROVED",
    ):
        monkeypatch.delenv(name, raising=False)

    settings = Settings.from_environment()

    assert settings.market_data_provider == "disabled"
    assert settings.marketstack_access_key is None
    assert settings.market_data_public_display_approved is False
    assert create_app().title == "FinPath API"


def test_enabled_provider_requires_key_only_when_service_is_built(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("MARKET_DATA_PROVIDER", "marketstack")
    monkeypatch.delenv("MARKETSTACK_ACCESS_KEY", raising=False)

    settings = Settings.from_environment()

    with pytest.raises(MarketDataConfigurationError, match="MARKETSTACK_ACCESS_KEY"):
        build_market_price_service(settings)


def test_whitespace_only_marketstack_key_is_treated_as_missing(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("MARKET_DATA_PROVIDER", "marketstack")
    monkeypatch.setenv("MARKETSTACK_ACCESS_KEY", "   ")

    settings = Settings.from_environment()

    assert settings.marketstack_access_key is None


def test_market_data_settings_parse_safe_explicit_values(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("MARKET_DATA_PROVIDER", "marketstack")
    monkeypatch.setenv("MARKETSTACK_ACCESS_KEY", "test-only")
    monkeypatch.setenv("MARKET_DATA_CACHE_PATH", "var/custom-market.sqlite3")
    monkeypatch.setenv("MARKET_DATA_REFRESH_SECONDS", "3600")
    monkeypatch.setenv("MARKET_DATA_STALE_IF_ERROR_SECONDS", "7200")
    monkeypatch.setenv("MARKET_DATA_PUBLIC_DISPLAY_APPROVED", "false")

    settings = Settings.from_environment()

    assert settings.market_data_provider == "marketstack"
    assert settings.marketstack_access_key == "test-only"
    assert settings.market_data_cache_path == Path("var/custom-market.sqlite3")
    assert settings.market_data_refresh_seconds == 3600
    assert settings.market_data_stale_if_error_seconds == 7200
    assert settings.market_data_public_display_approved is False
    assert "test-only" not in repr(settings)


@pytest.mark.parametrize("value", ["yes please", "2", "licensed"])
def test_public_display_gate_rejects_ambiguous_values(
    monkeypatch: pytest.MonkeyPatch, value: str
) -> None:
    monkeypatch.setenv("MARKET_DATA_PUBLIC_DISPLAY_APPROVED", value)

    with pytest.raises(ValueError, match="MARKET_DATA_PUBLIC_DISPLAY_APPROVED"):
        Settings.from_environment()


def test_no_public_market_price_route_exists() -> None:
    paths = {
        route.path
        for route in create_app().routes
        if isinstance(getattr(route, "path", None), str)
    }

    assert not any("market" in path or "price" in path for path in paths)
