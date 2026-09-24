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


def test_supported_company_list_is_a_stable_non_financial_contract() -> None:
    response = asyncio.run(_request("/v1/companies"))

    assert response.status_code == 200
    payload = response.json()
    assert [company["ticker"] for company in payload["companies"]] == [
        "AAPL",
        "MSFT",
        "WMT",
    ]
    assert payload["companies"][1]["capabilities"] == {
        "revenue": True,
        "revenueGrowth": True,
        "incomeStatement": True,
        "cashFlow": False,
        "balanceSheet": True,
        "cashDebt": True,
        "threeStatements": False,
        "earningsPerShare": True,
        "sharesOutstanding": True,
    }
    assert "value" not in str(payload)


def test_microsoft_and_walmart_overview_contracts_preserve_exact_provenance() -> None:
    app.dependency_overrides[get_company_service] = lambda: CompanyOverviewService(
        FixtureSecDataSource()
    )
    try:
        microsoft = asyncio.run(_request("/v1/companies/MSFT/overview"))
        walmart = asyncio.run(_request("/v1/companies/WMT/overview"))
    finally:
        app.dependency_overrides.clear()

    assert microsoft.status_code == 200
    assert microsoft.json()["series"][-1]["sourceUrl"].endswith(
        "/000119312526323660/0001193125-26-323660-index.htm"
    )
    assert walmart.status_code == 200
    assert walmart.json()["metric"]["taxonomyTag"] == "Revenues"
    assert walmart.json()["series"][-1]["value"] == 713_163_000_000
    assert walmart.json()["series"][-1]["sourceUrl"].endswith(
        "/000010416926000055/0000104169-26-000055-index.htm"
    )


def test_unreviewed_company_is_not_exposed_as_arbitrary_search() -> None:
    app.dependency_overrides[get_company_service] = lambda: CompanyOverviewService(
        FixtureSecDataSource()
    )
    try:
        response = asyncio.run(_request("/v1/companies/NVDA/overview"))
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 404
    assert "not a reviewed FinPath company" in response.json()["detail"]


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


def test_balance_sheet_http_contract_preserves_instant_context_and_evidence_kind() -> None:
    app.dependency_overrides[get_company_service] = lambda: CompanyOverviewService(
        FixtureSecDataSource()
    )
    try:
        apple = asyncio.run(_request("/v1/companies/AAPL/balance-sheets/2025"))
        walmart = asyncio.run(_request("/v1/companies/WMT/balance-sheets/2026"))
    finally:
        app.dependency_overrides.clear()

    assert apple.status_code == 200
    apple_statement = apple.json()["statement"]
    assert apple_statement["asOfDate"] == "2025-09-27"
    assert "startDate" not in apple_statement
    assert "endDate" not in apple_statement
    assert apple_statement["liabilities"]["evidenceKind"] == "reported"
    assert apple_statement["simpleBorrowings"]["evidenceKind"] == "derived"
    assert apple_statement["simpleBorrowings"]["value"] == 98_657_000_000
    assert [line["value"] for line in apple_statement["simpleBorrowings"]["inputs"]] == [
        7_979_000_000,
        12_350_000_000,
        78_328_000_000,
    ]
    assert [line["value"] for line in apple_statement["supplementalFinancialAssets"]] == [
        18_763_000_000,
        77_723_000_000,
    ]
    assert apple_statement["sourceUrl"].endswith(
        "/000032019325000079/0000320193-25-000079-index.htm"
    )

    assert walmart.status_code == 200
    walmart_statement = walmart.json()["statement"]
    assert walmart_statement["liabilities"]["evidenceKind"] == "derived"
    assert walmart_statement["liabilities"]["value"] == 178_488_000_000
    assert len(walmart_statement["liabilities"]["inputs"]) == 5
    assert walmart_statement["otherClaims"][0]["value"] == 293_000_000
    assert walmart_statement["simpleBorrowings"]["value"] == 44_762_000_000
    assert walmart_statement["supplementalFinancialAssets"] == []


def test_balance_sheet_route_rejects_an_unreviewed_fiscal_year() -> None:
    app.dependency_overrides[get_company_service] = lambda: CompanyOverviewService(
        FixtureSecDataSource()
    )
    try:
        response = asyncio.run(_request("/v1/companies/AAPL/balance-sheets/2024"))
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 422
    assert "profile" in response.json()["detail"]


def test_eps_http_contract_preserves_reported_and_verification_boundaries() -> None:
    app.dependency_overrides[get_company_service] = lambda: CompanyOverviewService(
        FixtureSecDataSource()
    )
    try:
        response = asyncio.run(
            _request("/v1/companies/WMT/earnings-per-share/2026")
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    statement = payload["statement"]
    assert statement["earningsNumerator"] == {
        "evidenceKind": "reported",
        "id": "earnings-numerator",
        "taxonomyTag": "NetIncomeLoss",
        "taxonomyLabel": "Net Income (Loss) Attributable to Parent",
        "reportedLabel": "Consolidated net income attributable to Walmart",
        "value": 21_893_000_000,
        "unit": "USD",
    }
    assert statement["basicEps"]["value"] == "2.74"
    assert statement["basicEps"]["evidenceKind"] == "reported"
    assert statement["basicVerification"]["evidenceKind"] == "verification"
    assert statement["basicVerification"]["matchesReported"] is True
    assert statement["sourceUrl"].endswith(
        "/000010416926000055/0000104169-26-000055-index.htm"
    )
    assert payload["dataStatus"] == {
        "state": "cached",
        "retrievedAt": "2026-08-19T00:00:00Z",
    }


def test_shares_outstanding_http_contract_preserves_reviewed_instant_evidence() -> None:
    app.dependency_overrides[get_company_service] = lambda: CompanyOverviewService(
        FixtureSecDataSource()
    )
    expected = {
        "AAPL": (2025, "2025-10-17", 14_776_353_000, "0000320193-25-000079"),
        "MSFT": (2026, "2026-07-23", 7_425_545_491, "0001193125-26-323660"),
        "WMT": (2026, "2026-03-11", 7_972_402_501, "0000104169-26-000055"),
    }
    try:
        responses = {
            ticker: asyncio.run(
                _request(f"/v1/companies/{ticker}/shares-outstanding/{values[0]}")
            )
            for ticker, values in expected.items()
        }
    finally:
        app.dependency_overrides.clear()

    for ticker, response in responses.items():
        fiscal_year, as_of_date, shares, accession = expected[ticker]
        assert response.status_code == 200
        payload = response.json()
        assert payload["company"]["ticker"] == ticker
        assert payload["fact"] == {
            "evidenceKind": "reported",
            "id": "common-shares-outstanding",
            "fiscalYear": fiscal_year,
            "asOfDate": as_of_date,
            "form": "10-K",
            "filedAt": payload["fact"]["filedAt"],
            "accession": accession,
            "sourceUrl": payload["fact"]["sourceUrl"],
            "taxonomyNamespace": "dei",
            "taxonomyTag": "EntityCommonStockSharesOutstanding",
            "taxonomyLabel": payload["fact"]["taxonomyLabel"],
            "reportedLabel": "Shares of common stock outstanding",
            "value": shares,
            "unit": "shares",
        }
        assert payload["fact"]["sourceUrl"].endswith(
            f"/{accession.replace('-', '')}/{accession}-index.htm"
        )
        assert payload["dataStatus"] == {
            "state": "cached",
            "retrievedAt": "2026-08-19T00:00:00Z",
        }


def test_shares_outstanding_route_rejects_unreviewed_contexts() -> None:
    app.dependency_overrides[get_company_service] = lambda: CompanyOverviewService(
        FixtureSecDataSource()
    )
    try:
        wrong_year = asyncio.run(
            _request("/v1/companies/AAPL/shares-outstanding/2024")
        )
        wrong_company = asyncio.run(
            _request("/v1/companies/NVDA/shares-outstanding/2025")
        )
    finally:
        app.dependency_overrides.clear()

    assert wrong_year.status_code == 422
    assert wrong_company.status_code == 404


async def _request_aapl_overview() -> httpx.Response:
    return await _request("/v1/companies/AAPL/overview")


async def _request(path: str) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport,
        base_url="http://finpath.test",
    ) as client:
        return await client.get(path)


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
