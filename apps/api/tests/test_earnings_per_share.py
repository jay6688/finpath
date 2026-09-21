from copy import deepcopy
from decimal import Decimal

import pytest

from app.domain.earnings_per_share import (
    EarningsPerShareUnavailableError,
    extract_earnings_per_share,
)
from tests.fixture_loader import load_sec_fixture


@pytest.mark.parametrize(
    (
        "fixture",
        "cik",
        "fiscal_year",
        "numerator",
        "basic_shares",
        "diluted_shares",
        "basic_eps",
        "diluted_eps",
        "accession",
    ),
    [
        (
            "aapl_companyfacts.json",
            "0000320193",
            2025,
            112_010_000_000,
            14_948_500_000,
            15_004_697_000,
            Decimal("7.49"),
            Decimal("7.46"),
            "0000320193-25-000079",
        ),
        (
            "msft_companyfacts.json",
            "0000789019",
            2026,
            133_749_000_000,
            7_429_000_000,
            7_453_000_000,
            Decimal("18.00"),
            Decimal("17.95"),
            "0001193125-26-323660",
        ),
        (
            "wmt_companyfacts.json",
            "0000104169",
            2026,
            21_893_000_000,
            7_983_000_000,
            8_022_000_000,
            Decimal("2.74"),
            Decimal("2.73"),
            "0000104169-26-000055",
        ),
    ],
)
def test_extracts_reviewed_reported_eps_and_decimal_verification(
    fixture: str,
    cik: str,
    fiscal_year: int,
    numerator: int,
    basic_shares: int,
    diluted_shares: int,
    basic_eps: Decimal,
    diluted_eps: Decimal,
    accession: str,
) -> None:
    statement = extract_earnings_per_share(
        load_sec_fixture(fixture), cik=cik, fiscal_year=fiscal_year
    )

    assert statement.accession == accession
    assert statement.earnings_numerator.value == numerator
    assert statement.basic_weighted_average_shares.value == basic_shares
    assert statement.diluted_weighted_average_shares.value == diluted_shares
    assert statement.basic_eps.value == basic_eps
    assert statement.diluted_eps.value == diluted_eps
    assert statement.basic_verification.rounded_result == basic_eps
    assert statement.diluted_verification.rounded_result == diluted_eps
    assert statement.basic_verification.matches_reported is True
    assert statement.diluted_verification.matches_reported is True
    assert statement.basic_verification.rounding_mode == "ROUND_HALF_UP"
    assert statement.basic_eps.evidence_kind == "reported"
    assert statement.basic_verification.evidence_kind == "verification"
    assert "/Archives/edgar/data/" in str(statement.source_url)


def test_walmart_uses_parent_attributable_income_not_consolidated_income() -> None:
    statement = extract_earnings_per_share(
        load_sec_fixture("wmt_companyfacts.json"),
        cik="0000104169",
        fiscal_year=2026,
    )

    assert statement.earnings_numerator.taxonomy_tag == "NetIncomeLoss"
    assert statement.earnings_numerator.value == 21_893_000_000
    assert statement.earnings_numerator.value != 22_270_000_000
    assert "attributable to Walmart" in statement.earnings_numerator.reported_label


def test_msft_keeps_two_decimal_reported_basic_eps_in_json() -> None:
    statement = extract_earnings_per_share(
        load_sec_fixture("msft_companyfacts.json"),
        cik="0000789019",
        fiscal_year=2026,
    )

    payload = statement.model_dump(mode="json", by_alias=True)
    assert payload["basicEps"]["value"] == "18.00"
    assert payload["basicVerification"]["roundedResult"] == "18.00"


@pytest.mark.parametrize(
    ("tag", "unit"),
    [
        ("NetIncomeLoss", "USD"),
        ("WeightedAverageNumberOfSharesOutstandingBasic", "shares"),
        ("WeightedAverageNumberOfDilutedSharesOutstanding", "shares"),
        ("EarningsPerShareBasic", "USD/shares"),
        ("EarningsPerShareDiluted", "USD/shares"),
    ],
)
def test_rejects_a_required_fact_from_another_filing_context(
    tag: str, unit: str
) -> None:
    payload = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    for fact in payload["facts"]["us-gaap"][tag]["units"][unit]:
        fact["accn"] = "0000320193-24-000123"

    with pytest.raises(EarningsPerShareUnavailableError, match="reviewed annual context"):
        extract_earnings_per_share(payload, cik="0000320193", fiscal_year=2025)


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("start", "2024-09-28"),
        ("end", "2025-09-26"),
        ("form", "10-Q"),
        ("filed", "2025-10-30"),
    ],
)
def test_rejects_wrong_period_form_or_filed_date(field: str, value: str) -> None:
    payload = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    facts = payload["facts"]["us-gaap"]["EarningsPerShareBasic"]["units"][
        "USD/shares"
    ]
    facts[0][field] = value

    with pytest.raises(EarningsPerShareUnavailableError, match="reviewed annual context"):
        extract_earnings_per_share(payload, cik="0000320193", fiscal_year=2025)


def test_rejects_wrong_unit_instead_of_guessing_or_converting() -> None:
    payload = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    concept = payload["facts"]["us-gaap"]["EarningsPerShareBasic"]
    concept["units"]["USD"] = concept["units"].pop("USD/shares")

    with pytest.raises(EarningsPerShareUnavailableError, match="USD/shares"):
        extract_earnings_per_share(payload, cik="0000320193", fiscal_year=2025)


def test_rejects_missing_or_conflicting_reported_eps_fact() -> None:
    missing = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    del missing["facts"]["us-gaap"]["EarningsPerShareDiluted"]
    with pytest.raises(EarningsPerShareUnavailableError, match="EarningsPerShareDiluted"):
        extract_earnings_per_share(missing, cik="0000320193", fiscal_year=2025)

    conflicting = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    facts = conflicting["facts"]["us-gaap"]["EarningsPerShareBasic"]["units"][
        "USD/shares"
    ]
    duplicate = deepcopy(facts[0])
    duplicate["val"] = 7.50
    facts.append(duplicate)
    with pytest.raises(EarningsPerShareUnavailableError, match="conflicting values"):
        extract_earnings_per_share(conflicting, cik="0000320193", fiscal_year=2025)


def test_rejects_zero_weighted_average_shares_and_unmatched_reported_eps() -> None:
    zero_shares = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    zero_shares["facts"]["us-gaap"][
        "WeightedAverageNumberOfSharesOutstandingBasic"
    ]["units"]["shares"][0]["val"] = 0
    with pytest.raises(EarningsPerShareUnavailableError, match="positive"):
        extract_earnings_per_share(zero_shares, cik="0000320193", fiscal_year=2025)

    unmatched = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    unmatched["facts"]["us-gaap"]["EarningsPerShareBasic"]["units"][
        "USD/shares"
    ][0]["val"] = 7.48
    with pytest.raises(EarningsPerShareUnavailableError, match="does not match"):
        extract_earnings_per_share(unmatched, cik="0000320193", fiscal_year=2025)


def test_rejects_unreviewed_profile_and_wrong_company_payload() -> None:
    with pytest.raises(EarningsPerShareUnavailableError, match="profile.*unavailable"):
        extract_earnings_per_share(
            load_sec_fixture("aapl_companyfacts.json"),
            cik="0000320193",
            fiscal_year=2024,
        )

    wrong_company = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    wrong_company["cik"] = 789019
    with pytest.raises(EarningsPerShareUnavailableError, match="company CIK"):
        extract_earnings_per_share(
            wrong_company,
            cik="0000320193",
            fiscal_year=2025,
        )
