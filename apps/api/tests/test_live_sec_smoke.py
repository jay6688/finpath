import asyncio
from datetime import datetime, timezone
import os

import pytest

from app.cache.sqlite_cache import SqliteJsonCache
from app.core.settings import Settings
from app.domain.company_service import CompanyOverviewService
from app.schemas.company import DataState
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

    request_started_at = datetime.now(timezone.utc)
    response = asyncio.run(service.get_overview("AAPL"))
    request_finished_at = datetime.now(timezone.utc)
    latest = response.series[-1]

    assert response.company.cik == "0000320193"
    assert latest.fiscal_year == 2025
    assert latest.start_date.isoformat() == "2024-09-29"
    assert latest.end_date.isoformat() == "2025-09-27"
    assert latest.value == 416_161_000_000
    assert latest.form == "10-K"
    assert latest.filed_at.isoformat() == "2025-10-31"
    assert latest.accession == "0000320193-25-000079"
    assert str(latest.source_url) == (
        "https://www.sec.gov/Archives/edgar/data/320193/"
        "000032019325000079/0000320193-25-000079-index.htm"
    )
    assert response.data_status.state == DataState.LIVE
    assert (
        request_started_at
        <= response.data_status.retrieved_at
        <= request_finished_at
    )
