import asyncio

from app.domain.company_service import CompanyOverviewService, find_company
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
