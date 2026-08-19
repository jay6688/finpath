import asyncio
import os

import pytest

from app.cache.sqlite_cache import SqliteJsonCache
from app.core.settings import Settings
from app.domain.company_service import CompanyOverviewService
from app.services.sec.client import SecClient


@pytest.mark.live
def test_live_aapl_sec_pipeline_when_explicitly_enabled(tmp_path) -> None:
    if os.getenv("FINPATH_RUN_LIVE_SEC_TEST") != "1":
        pytest.skip("Set FINPATH_RUN_LIVE_SEC_TEST=1 to enable real SEC requests.")

    settings = Settings.from_environment()
    if not settings.sec_user_agent:
        pytest.skip("SEC_USER_AGENT is required for the optional live smoke test.")

    live_settings = Settings(
        sec_user_agent=settings.sec_user_agent,
        sec_requests_per_second=settings.sec_requests_per_second,
        sec_company_facts_ttl_seconds=settings.sec_company_facts_ttl_seconds,
        sec_ticker_map_ttl_seconds=settings.sec_ticker_map_ttl_seconds,
        sec_stale_if_error_seconds=settings.sec_stale_if_error_seconds,
        sec_cache_path=tmp_path / "live-sec-cache.sqlite3",
    )
    service = CompanyOverviewService(
        SecClient(live_settings, SqliteJsonCache(live_settings.sec_cache_path))
    )

    response = asyncio.run(service.get_overview("AAPL"))

    assert response.company.cik == "0000320193"
    assert response.series[-1].value == 416_161_000_000
