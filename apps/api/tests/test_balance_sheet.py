from copy import deepcopy

import pytest

from app.domain.balance_sheet import (
    BalanceSheetUnavailableError,
    extract_balance_sheet,
)
from tests.fixture_loader import load_sec_fixture


@pytest.mark.parametrize(
    ("fixture", "cik", "fiscal_year", "as_of_date", "assets", "liabilities", "equity"),
    [
        (
            "aapl_companyfacts.json",
            "0000320193",
            2025,
            "2025-09-27",
            359_241_000_000,
            285_508_000_000,
            73_733_000_000,
        ),
        (
            "msft_companyfacts.json",
            "0000789019",
            2026,
            "2026-06-30",
            758_376_000_000,
            315_989_000_000,
            442_387_000_000,
        ),
    ],
)
def test_extracts_direct_reported_balance_sheet_totals(
    fixture: str,
    cik: str,
    fiscal_year: int,
    as_of_date: str,
    assets: int,
    liabilities: int,
    equity: int,
) -> None:
    statement = extract_balance_sheet(
        load_sec_fixture(fixture), cik=cik, fiscal_year=fiscal_year
    )

    assert statement.as_of_date.isoformat() == as_of_date
    assert statement.assets.evidence_kind == "reported"
    assert statement.liabilities.evidence_kind == "reported"
    assert statement.equity.evidence_kind == "reported"
    assert statement.assets.value == assets
    assert statement.liabilities.value == liabilities
    assert statement.equity.value == equity
    assert statement.other_claims == []
    assert assets == liabilities + equity


def test_walmart_derives_liabilities_from_complete_reported_components() -> None:
    statement = extract_balance_sheet(
        load_sec_fixture("wmt_companyfacts.json"),
        cik="0000104169",
        fiscal_year=2026,
    )

    assert statement.as_of_date.isoformat() == "2026-01-31"
    assert statement.assets.value == 284_668_000_000
    assert statement.liabilities.evidence_kind == "derived"
    assert statement.liabilities.value == 178_488_000_000
    assert [line.value for line in statement.liabilities.inputs] == [
        107_469_000_000,
        34_624_000_000,
        13_941_000_000,
        5_905_000_000,
        16_549_000_000,
    ]
    assert statement.liabilities.value == sum(
        line.value for line in statement.liabilities.inputs
    )
    assert [(line.id, line.value) for line in statement.other_claims] == [
        ("redeemable-noncontrolling-interest", 293_000_000)
    ]
    assert statement.equity.value == 105_887_000_000
    assert statement.assets.value == (
        statement.liabilities.value
        + sum(line.value for line in statement.other_claims)
        + statement.equity.value
    )


def test_instant_context_rejects_wrong_date_instead_of_using_a_comparative_fact() -> None:
    payload = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    facts = payload["facts"]["us-gaap"]["Liabilities"]["units"]["USD"]
    facts[0]["end"] = "2024-09-28"

    with pytest.raises(BalanceSheetUnavailableError, match="reviewed instant context"):
        extract_balance_sheet(payload, cik="0000320193", fiscal_year=2025)


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("accn", "0000320193-24-000123"),
        ("form", "10-Q"),
        ("filed", "2025-10-30"),
    ],
)
def test_instant_context_rejects_wrong_filing_identity(field: str, value: str) -> None:
    payload = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    fact = payload["facts"]["us-gaap"]["StockholdersEquity"]["units"]["USD"][0]
    fact[field] = value

    with pytest.raises(BalanceSheetUnavailableError, match="reviewed instant context"):
        extract_balance_sheet(payload, cik="0000320193", fiscal_year=2025)


def test_rejects_conflicting_values_for_one_instant_context() -> None:
    payload = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    facts = payload["facts"]["us-gaap"]["Assets"]["units"]["USD"]
    conflicting = deepcopy(facts[1])
    conflicting["val"] = 359_242_000_000
    facts.append(conflicting)

    with pytest.raises(BalanceSheetUnavailableError, match="conflicting values"):
        extract_balance_sheet(payload, cik="0000320193", fiscal_year=2025)


def test_rejects_missing_required_fact_instead_of_substituting_zero() -> None:
    payload = deepcopy(load_sec_fixture("wmt_companyfacts.json"))
    del payload["facts"]["us-gaap"]["FinanceLeaseLiabilityNoncurrent"]

    with pytest.raises(
        BalanceSheetUnavailableError,
        match="FinanceLeaseLiabilityNoncurrent is unavailable",
    ):
        extract_balance_sheet(payload, cik="0000104169", fiscal_year=2026)


def test_rejects_a_balance_sheet_that_does_not_reconcile_exactly() -> None:
    payload = deepcopy(load_sec_fixture("msft_companyfacts.json"))
    payload["facts"]["us-gaap"]["StockholdersEquity"]["units"]["USD"][0][
        "val"
    ] += 1

    with pytest.raises(BalanceSheetUnavailableError, match="reconcile exactly"):
        extract_balance_sheet(payload, cik="0000789019", fiscal_year=2026)


def test_rejects_unsupported_reviewed_profile() -> None:
    with pytest.raises(BalanceSheetUnavailableError, match="profile.*unavailable"):
        extract_balance_sheet(
            load_sec_fixture("aapl_companyfacts.json"),
            cik="0000320193",
            fiscal_year=2024,
        )


def test_rejects_company_facts_for_another_cik() -> None:
    payload = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    payload["cik"] = 789019

    with pytest.raises(BalanceSheetUnavailableError, match="company CIK"):
        extract_balance_sheet(payload, cik="0000320193", fiscal_year=2025)
