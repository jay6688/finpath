from copy import deepcopy

import pytest

from app.domain.cash_flow_statement import (
    CashFlowStatementUnavailableError,
    extract_cash_flow_statement,
)
from tests.fixture_loader import load_sec_fixture


EXPECTED_SECTION_VALUES = {
    "operating": {
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
    },
    "investing": {
        "purchases-of-marketable-securities": -24_407_000_000,
        "maturities-of-marketable-securities": 40_907_000_000,
        "sales-of-marketable-securities": 12_890_000_000,
        "payments-for-property-plant-and-equipment": -12_715_000_000,
        "other-investing-activities": -1_480_000_000,
        "cash-generated-by-investing-activities": 15_195_000_000,
    },
    "financing": {
        "taxes-related-to-net-share-settlement": -5_960_000_000,
        "dividends-and-dividend-equivalents": -15_421_000_000,
        "common-stock-repurchases": -90_711_000_000,
        "term-debt-issuance-net": 4_481_000_000,
        "term-debt-repayment": -10_932_000_000,
        "commercial-paper-net": -2_032_000_000,
        "other-financing-activities": -111_000_000,
        "cash-used-in-financing-activities": -120_686_000_000,
    },
}


def extract_fixture_statement():
    return extract_cash_flow_statement(
        load_sec_fixture("aapl_companyfacts.json"),
        cik="0000320193",
        fiscal_year=2025,
    )


def section_values(statement):
    return {
        section.id: {line.id: line.value for line in section.lines}
        for section in statement.sections
    }


def test_extracts_one_complete_fy2025_cash_flow_statement_context() -> None:
    statement = extract_fixture_statement()

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
    assert [section.id for section in statement.sections] == [
        "operating",
        "investing",
        "financing",
    ]
    assert section_values(statement) == EXPECTED_SECTION_VALUES


def test_rejects_an_unreviewed_company_instead_of_reusing_apples_profile() -> None:
    with pytest.raises(
        CashFlowStatementUnavailableError,
        match="profile for CIK 0000789019 FY2025 is unavailable",
    ):
        extract_cash_flow_statement(
            load_sec_fixture("aapl_companyfacts.json"),
            cik="0000789019",
            fiscal_year=2025,
        )


def test_reconciles_each_section_and_the_top_level_cash_change() -> None:
    statement = extract_fixture_statement()

    for section in statement.sections:
        assert sum(line.value for line in section.lines[:-1]) == section.lines[-1].value

    totals = [section.lines[-1].value for section in statement.sections]
    assert sum(totals) == statement.cash_movement.net_change.value
    assert statement.cash_movement.net_change.value == 5_991_000_000
    assert statement.cash_movement.beginning_cash.value == 29_943_000_000
    assert statement.cash_movement.beginning_cash.as_of_date.isoformat() == "2024-09-28"
    assert statement.cash_movement.ending_cash.value == 35_934_000_000
    assert statement.cash_movement.ending_cash.as_of_date.isoformat() == "2025-09-27"
    assert (
        statement.cash_movement.beginning_cash.value
        + statement.cash_movement.net_change.value
        == statement.cash_movement.ending_cash.value
    )


def test_normalizes_company_facts_signs_to_statement_cash_effects() -> None:
    values = section_values(extract_fixture_statement())

    assert values["operating"]["accounts-receivable-net"] == -6_682_000_000
    assert values["operating"]["inventories"] == 1_400_000_000
    assert values["investing"]["purchases-of-marketable-securities"] == -24_407_000_000
    assert values["investing"]["payments-for-property-plant-and-equipment"] == -12_715_000_000
    assert values["financing"]["common-stock-repurchases"] == -90_711_000_000
    assert values["financing"]["commercial-paper-net"] == -2_032_000_000


@pytest.mark.parametrize(
    "taxonomy_tag",
    [
        "ShareBasedCompensation",
        "PaymentsToAcquirePropertyPlantAndEquipment",
        "PaymentsOfDividends",
        "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalentsPeriodIncreaseDecreaseIncludingExchangeRateEffect",
    ],
)
def test_rejects_a_line_from_another_filing_context(taxonomy_tag: str) -> None:
    payload = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    fact = payload["facts"]["us-gaap"][taxonomy_tag]["units"]["USD"][0]
    fact["accn"] = "0000320193-24-000123"

    with pytest.raises(
        CashFlowStatementUnavailableError,
        match="does not match the selected cash flow filing context",
    ):
        extract_cash_flow_statement(payload, cik="0000320193", fiscal_year=2025)


def test_rejects_conflicting_values_for_the_same_context() -> None:
    payload = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    facts = payload["facts"]["us-gaap"]["NetCashProvidedByUsedInFinancingActivities"][
        "units"
    ]["USD"]
    conflicting = deepcopy(facts[0])
    conflicting["val"] = -120_685_000_000
    facts.append(conflicting)

    with pytest.raises(
        CashFlowStatementUnavailableError,
        match="contains conflicting values",
    ):
        extract_cash_flow_statement(payload, cik="0000320193", fiscal_year=2025)


def test_rejects_missing_lines_instead_of_substituting_zero() -> None:
    payload = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    del payload["facts"]["us-gaap"]["PaymentsToAcquirePropertyPlantAndEquipment"]

    with pytest.raises(
        CashFlowStatementUnavailableError,
        match="PaymentsToAcquirePropertyPlantAndEquipment is unavailable",
    ):
        extract_cash_flow_statement(payload, cik="0000320193", fiscal_year=2025)


@pytest.mark.parametrize(
    ("taxonomy_tag", "message"),
    [
        ("DepreciationDepletionAndAmortization", "Operating section"),
        ("PaymentsToAcquirePropertyPlantAndEquipment", "Investing section"),
        ("PaymentsOfDividends", "Financing section"),
        (
            "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalentsPeriodIncreaseDecreaseIncludingExchangeRateEffect",
            "activity totals",
        ),
        (
            "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents",
            "beginning cash plus net change",
        ),
    ],
)
def test_rejects_every_failed_reconciliation(
    taxonomy_tag: str,
    message: str,
) -> None:
    payload = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    fact = payload["facts"]["us-gaap"][taxonomy_tag]["units"]["USD"][0]
    fact["val"] += 1_000_000

    with pytest.raises(CashFlowStatementUnavailableError, match=message):
        extract_cash_flow_statement(payload, cik="0000320193", fiscal_year=2025)
