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


def test_aapl_income_statement_http_contract_from_offline_sec_fixture() -> None:
    app.dependency_overrides[get_company_service] = lambda: CompanyOverviewService(
        FixtureSecDataSource()
    )
    try:
        response = asyncio.run(_request_aapl_income_statement())
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["company"] == {
        "ticker": "AAPL",
        "name": "Apple Inc.",
        "cik": "0000320193",
    }
    assert payload["statement"]["fiscalYear"] == 2025
    assert payload["statement"]["accession"] == "0000320193-25-000079"
    assert payload["statement"]["sourceUrl"] == (
        "https://www.sec.gov/Archives/edgar/data/320193/"
        "000032019325000079/0000320193-25-000079-index.htm"
    )
    assert [line["value"] for line in payload["statement"]["lines"]] == [
        416_161_000_000,
        220_960_000_000,
        195_201_000_000,
        62_151_000_000,
        133_050_000_000,
        -321_000_000,
        132_729_000_000,
        20_719_000_000,
        112_010_000_000,
    ]
    assert payload["dataStatus"] == {
        "state": "cached",
        "retrievedAt": "2026-08-19T00:00:00Z",
    }


def test_aapl_cash_flow_statement_http_contract_from_offline_sec_fixture() -> None:
    app.dependency_overrides[get_company_service] = lambda: CompanyOverviewService(
        FixtureSecDataSource()
    )
    try:
        response = asyncio.run(_request_aapl_cash_flow_statement())
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["statement"]["fiscalYear"] == 2025
    assert payload["statement"]["accession"] == "0000320193-25-000079"
    assert payload["statement"]["sourceUrl"] == (
        "https://www.sec.gov/Archives/edgar/data/320193/"
        "000032019325000079/0000320193-25-000079-index.htm"
    )
    assert [section["id"] for section in payload["statement"]["sections"]] == [
        "operating",
        "investing",
        "financing",
    ]
    assert [
        section["lines"][-1]["value"]
        for section in payload["statement"]["sections"]
    ] == [111_482_000_000, 15_195_000_000, -120_686_000_000]
    assert payload["statement"]["cashMovement"] == {
        "beginningCash": {
            "id": "beginning-cash",
            "taxonomyTag": "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents",
            "taxonomyLabel": "Cash, Cash Equivalents, Restricted Cash and Restricted Cash Equivalents",
            "value": 29_943_000_000,
            "asOfDate": "2024-09-28",
        },
        "netChange": {
            "id": "net-change-in-cash",
            "taxonomyTag": "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalentsPeriodIncreaseDecreaseIncludingExchangeRateEffect",
            "taxonomyLabel": "Cash, Cash Equivalents, Restricted Cash and Restricted Cash Equivalents, Period Increase (Decrease), Including Exchange Rate Effect",
            "value": 5_991_000_000,
            "role": "cash-change",
        },
        "endingCash": {
            "id": "ending-cash",
            "taxonomyTag": "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents",
            "taxonomyLabel": "Cash, Cash Equivalents, Restricted Cash and Restricted Cash Equivalents",
            "value": 35_934_000_000,
            "asOfDate": "2025-09-27",
        },
    }
    assert payload["dataStatus"] == {
        "state": "cached",
        "retrievedAt": "2026-08-19T00:00:00Z",
    }


async def _request_aapl_overview() -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport,
        base_url="http://finpath.test",
    ) as client:
        return await client.get("/v1/companies/AAPL/overview")


async def _request_aapl_income_statement() -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport,
        base_url="http://finpath.test",
    ) as client:
        return await client.get("/v1/companies/AAPL/income-statements/2025")


async def _request_aapl_cash_flow_statement() -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport,
        base_url="http://finpath.test",
    ) as client:
        return await client.get("/v1/companies/AAPL/cash-flow-statements/2025")
