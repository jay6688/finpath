from datetime import date

from app.schemas.company import AnnualFinancialFact


def test_aapl_fy2025_revenue_golden_provenance_contract() -> None:
    fact = AnnualFinancialFact(
        fiscalYear=2025,
        startDate=date(2024, 9, 29),
        endDate=date(2025, 9, 27),
        value=416_161_000_000,
        form="10-K",
        filedAt=date(2025, 10, 31),
        accession="0000320193-25-000079",
        sourceUrl=(
            "https://www.sec.gov/Archives/edgar/data/320193/"
            "000032019325000079/0000320193-25-000079-index.htm"
        ),
    )

    payload = fact.model_dump(mode="json", by_alias=True)

    assert payload == {
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

