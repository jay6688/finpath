import asyncio

from app.domain.company_service import CompanyOverviewService, find_company
from app.domain.income_statement import IncomeStatementUnavailableError
from tests.fixture_loader import FixtureSecDataSource, load_sec_fixture


def test_general_ticker_lookup_is_not_hardcoded_to_apple() -> None:
    ticker_map = load_sec_fixture("company_tickers.json")

    microsoft = find_company(ticker_map, "MSFT")

    assert microsoft.cik == "0000789019"
    assert microsoft.name == "Microsoft Corporation"


def test_fixture_pipeline_produces_serializable_aapl_api_response() -> None:
    service = CompanyOverviewService(FixtureSecDataSource())

    response = asyncio.run(service.get_overview("aapl"))
    payload = response.model_dump(mode="json", by_alias=True)

    assert payload["company"] == {
        "ticker": "AAPL",
        "name": "Apple Inc.",
        "cik": "0000320193",
    }
    assert payload["series"][-1]["value"] == 416_161_000_000
    assert payload["dataStatus"] == {
        "state": "cached",
        "retrievedAt": "2026-08-19T00:00:00Z",
    }


def test_fixture_pipeline_produces_serializable_aapl_income_statement() -> None:
    service = CompanyOverviewService(FixtureSecDataSource())

    response = asyncio.run(service.get_income_statement("aapl", 2025))
    payload = response.model_dump(mode="json", by_alias=True)

    assert payload["statement"]["lines"][5] == {
        "id": "other-income-expense-net",
        "taxonomyTag": "NonoperatingIncomeExpense",
        "taxonomyLabel": "Nonoperating Income (Expense)",
        "value": -321_000_000,
        "role": "signed-adjustment",
    }
    assert payload["statement"]["lines"][-1]["value"] == 112_010_000_000


def test_fixture_pipeline_produces_serializable_aapl_cash_flow_statement() -> None:
    service = CompanyOverviewService(FixtureSecDataSource())

    response = asyncio.run(service.get_cash_flow_statement("aapl", 2025))
    payload = response.model_dump(mode="json", by_alias=True)

    operating_lines = payload["statement"]["sections"][0]["lines"]
    assert operating_lines[0]["id"] == "net-income"
    assert operating_lines[0]["value"] == 112_010_000_000
    assert operating_lines[-1] == {
        "id": "cash-generated-by-operating-activities",
        "taxonomyTag": "NetCashProvidedByUsedInOperatingActivities",
        "taxonomyLabel": "Net Cash Provided by (Used in) Operating Activities",
        "value": 111_482_000_000,
        "role": "final-total",
    }


def test_fixture_pipeline_returns_reviewed_microsoft_and_walmart_revenue() -> None:
    service = CompanyOverviewService(FixtureSecDataSource())

    microsoft = asyncio.run(service.get_overview("msft"))
    walmart = asyncio.run(service.get_overview("wmt"))

    assert microsoft.company.name == "Microsoft Corporation"
    assert microsoft.series[-1].value == 331_839_000_000
    assert microsoft.series[-1].accession == "0001193125-26-323660"
    assert walmart.company.name == "Walmart Inc."
    assert walmart.metric.taxonomy_tag == "Revenues"
    assert walmart.series[-1].value == 713_163_000_000


def test_microsoft_income_statement_uses_an_explicit_reviewed_profile() -> None:
    service = CompanyOverviewService(FixtureSecDataSource())

    response = asyncio.run(service.get_income_statement("MSFT", 2026))

    assert response.statement.accession == "0001193125-26-323660"
    assert response.statement.lines[0].value == 331_839_000_000
    assert response.statement.lines[-1].value == 133_749_000_000


def test_walmart_income_statement_fails_as_unreviewed() -> None:
    service = CompanyOverviewService(FixtureSecDataSource())

    try:
        asyncio.run(service.get_income_statement("WMT", 2026))
    except IncomeStatementUnavailableError as error:
        assert "profile" in str(error).lower()
    else:
        raise AssertionError("Walmart must not inherit Apple income-statement rules")
