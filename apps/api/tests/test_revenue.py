from app.domain.revenue import extract_annual_revenue
from tests.fixture_loader import load_sec_fixture


def test_extracts_five_years_and_preserves_aapl_golden_provenance() -> None:
    series = extract_annual_revenue(
        load_sec_fixture("aapl_companyfacts.json"),
        cik="0000320193",
    )

    assert series.taxonomy_tag == (
        "RevenueFromContractWithCustomerExcludingAssessedTax"
    )
    assert len(series.facts) == 5

    latest = series.facts[-1].model_dump(mode="json", by_alias=True)
    assert latest == {
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


def test_deduplicates_comparatives_and_ignores_non_annual_facts() -> None:
    series = extract_annual_revenue(
        load_sec_fixture("aapl_companyfacts.json"),
        cik="320193",
    )

    assert [fact.fiscal_year for fact in series.facts] == [
        2021,
        2022,
        2023,
        2024,
        2025,
    ]
    assert [fact.value for fact in series.facts] == [
        365_817_000_000,
        394_328_000_000,
        383_285_000_000,
        391_035_000_000,
        416_161_000_000,
    ]
    assert series.facts[2].filed_at.isoformat() == "2025-10-31"
    assert series.facts[2].accession == "0000320193-25-000079"
