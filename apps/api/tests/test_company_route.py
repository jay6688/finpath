import asyncio

import httpx

from app.api.dependencies import get_company_service
from app.domain.company_service import CompanyOverviewService
from app.main import app
from tests.fixture_loader import FixtureSecDataSource


def test_aapl_overview_http_contract_from_offline_sec_fixture() -> None:
    app.dependency_overrides[get_company_service] = lambda: CompanyOverviewService(
        FixtureSecDataSource()
    )
    try:
        response = asyncio.run(_request_aapl_overview())
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["company"]["cik"] == "0000320193"
    assert payload["series"][-1] == {
        "fiscalYear": 2025,
        "startDate": "2024-09-29",
        "endDate": "2025-09-27",
        "value": 416_161_000_000,
        "form": "10-K",
        "filedAt": "2025-10-31",
        "accession": "0000320193-25-000079",
        "sourceUrl": (
            "https://www.sec.gov/Archives/edgar/data/320193/"
            "000032019325000079/0000320193-25-000079-index.htm"
        ),
    }


async def _request_aapl_overview() -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport,
        base_url="http://finpath.test",
    ) as client:
        return await client.get("/v1/companies/AAPL/overview")
