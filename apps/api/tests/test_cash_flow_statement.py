from copy import deepcopy

import pytest

from app.domain.cash_flow_statement import (
    CashFlowStatementUnavailableError,
    extract_cash_flow_statement,
)
from tests.fixture_loader import load_sec_fixture


EXPECTED_LINE_VALUES = {
    "net-income": 112_010_000_000,
    "depreciation-and-amortization": 11_698_000_000,
    "share-based-compensation-expense": 12_863_000_000,
    "other": -89_000_000,
    "accounts-receivable-net": -6_682_000_000,
    "vendor-non-trade-receivables": -347_000_000,
    "inventories": 1_400_000_000,
    "other-current-and-non-current-assets": -9_197_000_000,
    "accounts-payable": 902_000_000,
    "other-current-and-non-current-liabilities": -11_076_000_000,
    "cash-generated-by-operating-activities": 111_482_000_000,
}


def test_extracts_one_complete_fy2025_operating_cash_flow_context() -> None:
    statement = extract_cash_flow_statement(
        load_sec_fixture("aapl_companyfacts.json"),
        cik="0000320193",
        fiscal_year=2025,
    )

    assert statement.fiscal_year == 2025
    assert statement.start_date.isoformat() == "2024-09-29"
    assert statement.end_date.isoformat() == "2025-09-27"
    assert statement.form == "10-K"
    assert statement.filed_at.isoformat() == "2025-10-31"
    assert statement.accession == "0000320193-25-000079"
    assert str(statement.source_url) == (
        "https://www.sec.gov/Archives/edgar/data/320193/"
        "000032019325000079/0000320193-25-000079-index.htm"
    )
    assert [line.id for line in statement.lines] == list(EXPECTED_LINE_VALUES)
    assert {line.id: line.value for line in statement.lines} == EXPECTED_LINE_VALUES


def test_normalizes_xbrl_signs_to_apple_statement_cash_effects() -> None:
    statement = extract_cash_flow_statement(
        load_sec_fixture("aapl_companyfacts.json"),
        cik="0000320193",
        fiscal_year=2025,
    )
    values = {line.id: line.value for line in statement.lines}

    assert values["accounts-receivable-net"] == -6_682_000_000
    assert values["inventories"] == 1_400_000_000
    assert values["other-current-and-non-current-assets"] == -9_197_000_000
    assert sum(list(values.values())[:-1]) == values[
        "cash-generated-by-operating-activities"
    ]


def test_rejects_a_line_from_another_filing_context() -> None:
    payload = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    fact = payload["facts"]["us-gaap"]["ShareBasedCompensation"]["units"]["USD"][0]
    fact["accn"] = "0000320193-24-000123"

    with pytest.raises(
        CashFlowStatementUnavailableError,
        match="does not match the selected operating cash flow filing context",
    ):
        extract_cash_flow_statement(payload, cik="0000320193", fiscal_year=2025)


def test_rejects_conflicting_values_for_the_same_context() -> None:
    payload = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    facts = payload["facts"]["us-gaap"]["NetCashProvidedByUsedInOperatingActivities"][
        "units"
    ]["USD"]
    conflicting = deepcopy(facts[0])
    conflicting["val"] = 111_483_000_000
    facts.append(conflicting)

    with pytest.raises(
        CashFlowStatementUnavailableError,
        match="contains conflicting values",
    ):
        extract_cash_flow_statement(payload, cik="0000320193", fiscal_year=2025)


def test_rejects_missing_lines_instead_of_substituting_zero() -> None:
    payload = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    del payload["facts"]["us-gaap"]["IncreaseDecreaseInAccountsReceivable"]

    with pytest.raises(
        CashFlowStatementUnavailableError,
        match="IncreaseDecreaseInAccountsReceivable is unavailable",
    ):
        extract_cash_flow_statement(payload, cik="0000320193", fiscal_year=2025)


def test_rejects_a_statement_that_does_not_reconcile() -> None:
    payload = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    fact = payload["facts"]["us-gaap"]["DepreciationDepletionAndAmortization"][
        "units"
    ]["USD"][0]
    fact["val"] = 11_697_000_000

    with pytest.raises(
        CashFlowStatementUnavailableError,
        match="must reconcile exactly",
    ):
        extract_cash_flow_statement(payload, cik="0000320193", fiscal_year=2025)
