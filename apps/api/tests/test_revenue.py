from app.domain.revenue import extract_annual_revenue
from app.domain.company_registry import require_supported_company
from tests.fixture_loader import load_sec_fixture


def test_extracts_five_years_and_preserves_aapl_golden_provenance() -> None:
    series = extract_annual_revenue(
        load_sec_fixture("aapl_companyfacts.json"),
        cik="0000320193",
        profile=require_supported_company("AAPL").revenue_profile,
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
        profile=require_supported_company("AAPL").revenue_profile,
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


def test_microsoft_uses_the_reviewed_fy2026_revenue_record() -> None:
    series = extract_annual_revenue(
        load_sec_fixture("msft_companyfacts.json"),
        cik="0000789019",
        profile=require_supported_company("MSFT").revenue_profile,
    )

    assert [fact.fiscal_year for fact in series.facts] == [2022, 2023, 2024, 2025, 2026]
    assert series.facts[-1].value == 331_839_000_000
    assert series.facts[-1].accession == "0001193125-26-323660"


def test_walmart_profile_selects_total_revenues_instead_of_net_sales() -> None:
    series = extract_annual_revenue(
        load_sec_fixture("wmt_companyfacts.json"),
        cik="0000104169",
        profile=require_supported_company("WMT").revenue_profile,
    )

    assert series.taxonomy_tag == "Revenues"
    assert series.facts[-1].value == 713_163_000_000
    assert series.facts[-1].accession == "0000104169-26-000055"
