from copy import deepcopy

import pytest

from app.domain.income_statement import (
    IncomeStatementUnavailableError,
    extract_income_statement,
)
from tests.fixture_loader import load_sec_fixture


EXPECTED_LINE_VALUES = {
    "total-net-sales": 416_161_000_000,
    "total-cost-of-sales": 220_960_000_000,
    "gross-margin": 195_201_000_000,
    "total-operating-expenses": 62_151_000_000,
    "operating-income": 133_050_000_000,
    "other-income-expense-net": -321_000_000,
    "income-before-income-taxes": 132_729_000_000,
    "income-tax-provision": 20_719_000_000,
    "net-income": 112_010_000_000,
}


def test_extracts_one_complete_fy2025_statement_context() -> None:
    statement = extract_income_statement(
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


def test_preserves_signed_other_expense_and_exact_reconciliation() -> None:
    statement = extract_income_statement(
        load_sec_fixture("aapl_companyfacts.json"),
        cik="0000320193",
        fiscal_year=2025,
    )
    values = {line.id: line.value for line in statement.lines}

    assert values["other-income-expense-net"] == -321_000_000
    assert (
        values["total-net-sales"] - values["total-cost-of-sales"]
        == values["gross-margin"]
    )
    assert (
        values["gross-margin"] - values["total-operating-expenses"]
        == values["operating-income"]
    )
    assert (
        values["operating-income"] + values["other-income-expense-net"]
        == values["income-before-income-taxes"]
    )
    assert (
        values["income-before-income-taxes"] - values["income-tax-provision"]
        == values["net-income"]
    )


def test_rejects_a_required_line_from_another_filing_context() -> None:
    payload = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    fact = payload["facts"]["us-gaap"]["GrossProfit"]["units"]["USD"][-1]
    fact["accn"] = "0000320193-24-000123"

    with pytest.raises(
        IncomeStatementUnavailableError,
        match="does not match the selected Revenue filing context",
    ):
        extract_income_statement(payload, cik="0000320193", fiscal_year=2025)


def test_rejects_conflicting_values_for_the_same_context() -> None:
    payload = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    facts = payload["facts"]["us-gaap"]["NetIncomeLoss"]["units"]["USD"]
    conflicting = deepcopy(facts[0])
    conflicting["val"] = 112_011_000_000
    facts.append(conflicting)

    with pytest.raises(
        IncomeStatementUnavailableError,
        match="contains conflicting values",
    ):
        extract_income_statement(payload, cik="0000320193", fiscal_year=2025)


def test_rejects_missing_lines_instead_of_substituting_zero() -> None:
    payload = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    del payload["facts"]["us-gaap"]["NonoperatingIncomeExpense"]

    with pytest.raises(
        IncomeStatementUnavailableError,
        match="NonoperatingIncomeExpense is unavailable",
    ):
        extract_income_statement(payload, cik="0000320193", fiscal_year=2025)


def test_rejects_a_statement_that_does_not_reconcile() -> None:
    payload = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    facts = payload["facts"]["us-gaap"]["OperatingExpenses"]["units"]["USD"]
    facts[0]["val"] = 62_150_000_000

    with pytest.raises(
        IncomeStatementUnavailableError,
        match="Gross margin minus operating expenses",
    ):
        extract_income_statement(payload, cik="0000320193", fiscal_year=2025)
