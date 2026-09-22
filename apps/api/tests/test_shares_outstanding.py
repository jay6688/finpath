from copy import deepcopy

import pytest

from app.domain.earnings_per_share import extract_earnings_per_share
from app.domain.shares_outstanding import (
    SharesOutstandingUnavailableError,
    extract_shares_outstanding,
)
from tests.fixture_loader import load_sec_fixture


@pytest.mark.parametrize(
    ("fixture", "cik", "fiscal_year", "shares", "as_of_date", "accession"),
    [
        (
            "aapl_companyfacts.json",
            "0000320193",
            2025,
            14_776_353_000,
            "2025-10-17",
            "0000320193-25-000079",
        ),
        (
            "msft_companyfacts.json",
            "0000789019",
            2026,
            7_425_545_491,
            "2026-07-23",
            "0001193125-26-323660",
        ),
        (
            "wmt_companyfacts.json",
            "0000104169",
            2026,
            7_972_402_501,
            "2026-03-11",
            "0000104169-26-000055",
        ),
    ],
)
def test_extracts_reviewed_cover_page_shares_as_an_instant_fact(
    fixture, cik, fiscal_year, shares, as_of_date, accession
) -> None:
    result = extract_shares_outstanding(
        load_sec_fixture(fixture), cik=cik, fiscal_year=fiscal_year
    )

    assert result.cik == cik
    assert result.value == shares
    assert result.as_of_date.isoformat() == as_of_date
    assert result.accession == accession
    assert result.taxonomy_namespace == "dei"
    assert result.taxonomy_tag == "EntityCommonStockSharesOutstanding"
    assert result.unit == "shares"
    assert result.evidence_kind == "reported"
    assert result.form == "10-K"
    assert "/Archives/edgar/data/" in result.source_url


def test_apple_regression_rejects_a_thousand_fold_scale_error() -> None:
    payload = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    payload["facts"]["dei"]["EntityCommonStockSharesOutstanding"]["units"][
        "shares"
    ][0]["val"] = 14_776_353

    with pytest.raises(SharesOutstandingUnavailableError, match="reviewed value"):
        extract_shares_outstanding(payload, cik="0000320193", fiscal_year=2025)


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("end", "2025-10-16"),
        ("accn", "0000320193-24-000123"),
        ("form", "10-Q"),
        ("filed", "2025-10-30"),
    ],
)
def test_rejects_wrong_instant_filing_identity(field: str, value: object) -> None:
    payload = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    fact = payload["facts"]["dei"]["EntityCommonStockSharesOutstanding"][
        "units"
    ]["shares"][0]
    fact[field] = value

    with pytest.raises(SharesOutstandingUnavailableError, match="reviewed instant"):
        extract_shares_outstanding(payload, cik="0000320193", fiscal_year=2025)


def test_rejects_wrong_company_duration_unit_and_conflicting_values() -> None:
    wrong_company = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    wrong_company["cik"] = 789019
    with pytest.raises(SharesOutstandingUnavailableError, match="company CIK"):
        extract_shares_outstanding(
            wrong_company, cik="0000320193", fiscal_year=2025
        )

    duration = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    duration["facts"]["dei"]["EntityCommonStockSharesOutstanding"]["units"][
        "shares"
    ][0]["start"] = "2025-10-01"
    with pytest.raises(SharesOutstandingUnavailableError, match="reviewed instant"):
        extract_shares_outstanding(duration, cik="0000320193", fiscal_year=2025)

    wrong_unit = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    concept = wrong_unit["facts"]["dei"]["EntityCommonStockSharesOutstanding"]
    concept["units"]["thousands"] = concept["units"].pop("shares")
    with pytest.raises(SharesOutstandingUnavailableError, match="shares"):
        extract_shares_outstanding(wrong_unit, cik="0000320193", fiscal_year=2025)

    conflicting = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    facts = conflicting["facts"]["dei"]["EntityCommonStockSharesOutstanding"][
        "units"
    ]["shares"]
    duplicate = deepcopy(facts[0])
    duplicate["val"] += 1
    facts.append(duplicate)
    with pytest.raises(SharesOutstandingUnavailableError, match="conflicting"):
        extract_shares_outstanding(conflicting, cik="0000320193", fiscal_year=2025)


@pytest.mark.parametrize(
    ("fixture", "cik", "fiscal_year"),
    [
        ("aapl_companyfacts.json", "0000320193", 2025),
        ("msft_companyfacts.json", "0000789019", 2026),
        ("wmt_companyfacts.json", "0000104169", 2026),
    ],
)
def test_cover_page_shares_are_not_eps_weighted_average_denominators(
    fixture: str, cik: str, fiscal_year: int
) -> None:
    payload = load_sec_fixture(fixture)
    shares = extract_shares_outstanding(payload, cik=cik, fiscal_year=fiscal_year)
    eps = extract_earnings_per_share(payload, cik=cik, fiscal_year=fiscal_year)

    assert shares.value != eps.basic_weighted_average_shares.value
    assert shares.value != eps.diluted_weighted_average_shares.value
    assert shares.as_of_date != eps.end_date
