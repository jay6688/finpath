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

# Apple Form 10-K for FY2024 (filed 2024-11-01), signed as cash effects.
# Term-debt issuance is a reported SEC fact of 0 for FY2024, not a missing value.
EXPECTED_FY2024_SECTION_VALUES = {
    "operating": {
        "net-income": 93_736_000_000,
        "depreciation-and-amortization": 11_445_000_000,
        "share-based-compensation-expense": 11_688_000_000,
        "other": -2_266_000_000,
        "accounts-receivable-net": -3_788_000_000,
        "vendor-non-trade-receivables": -1_356_000_000,
        "inventories": -1_046_000_000,
        "other-current-and-non-current-assets": -11_731_000_000,
        "accounts-payable": 6_020_000_000,
        "other-current-and-non-current-liabilities": 15_552_000_000,
        "cash-generated-by-operating-activities": 118_254_000_000,
    },
    "investing": {
        "purchases-of-marketable-securities": -48_656_000_000,
        "maturities-of-marketable-securities": 51_211_000_000,
        "sales-of-marketable-securities": 11_135_000_000,
        "payments-for-property-plant-and-equipment": -9_447_000_000,
        "other-investing-activities": -1_308_000_000,
        "cash-generated-by-investing-activities": 2_935_000_000,
    },
    "financing": {
        "taxes-related-to-net-share-settlement": -5_441_000_000,
        "dividends-and-dividend-equivalents": -15_234_000_000,
        "common-stock-repurchases": -94_949_000_000,
        "term-debt-issuance-net": 0,
        "term-debt-repayment": -9_958_000_000,
        "commercial-paper-net": 3_960_000_000,
        "other-financing-activities": -361_000_000,
        "cash-used-in-financing-activities": -121_983_000_000,
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


def test_extracts_the_reviewed_fy2024_cash_flow_statement_from_its_own_filing() -> None:
    statement = extract_cash_flow_statement(
        load_sec_fixture("aapl_companyfacts.json"),
        cik="0000320193",
        fiscal_year=2024,
    )

    assert statement.fiscal_year == 2024
    assert statement.start_date.isoformat() == "2023-10-01"
    assert statement.end_date.isoformat() == "2024-09-28"
    assert statement.form == "10-K"
    assert statement.filed_at.isoformat() == "2024-11-01"
    assert statement.accession == "0000320193-24-000123"
    assert str(statement.source_url) == (
        "https://www.sec.gov/Archives/edgar/data/320193/"
        "000032019324000123/0000320193-24-000123-index.htm"
    )
    assert section_values(statement) == EXPECTED_FY2024_SECTION_VALUES


def test_fy2024_reconciles_sections_and_beginning_to_ending_cash() -> None:
    statement = extract_cash_flow_statement(
        load_sec_fixture("aapl_companyfacts.json"),
        cik="0000320193",
        fiscal_year=2024,
    )

    for section in statement.sections:
        assert sum(line.value for line in section.lines[:-1]) == section.lines[-1].value
    movement = statement.cash_movement
    assert movement.net_change.value == -794_000_000
    assert movement.beginning_cash.value == 30_737_000_000
    assert movement.beginning_cash.as_of_date.isoformat() == "2023-09-30"
    assert movement.ending_cash.value == 29_943_000_000
    assert movement.ending_cash.as_of_date.isoformat() == "2024-09-28"
    assert (
        movement.beginning_cash.value + movement.net_change.value
        == movement.ending_cash.value
    )


def test_fy2024_does_not_borrow_ending_cash_from_the_fy2025_filing() -> None:
    # The FY2025 10-K also reports cash at 2024-09-28. FY2024 must not use that
    # later filing's instant when its own filing's instant is missing.
    payload = deepcopy(load_sec_fixture("aapl_companyfacts.json"))
    balances = payload["facts"]["us-gaap"][
        "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"
    ]["units"]["USD"]
    balances[:] = [
        fact
        for fact in balances
        if not (fact["accn"] == "0000320193-24-000123" and fact["end"] == "2024-09-28")
    ]

    with pytest.raises(
        CashFlowStatementUnavailableError,
        match="does not match the selected cash flow filing context",
    ):
        extract_cash_flow_statement(payload, cik="0000320193", fiscal_year=2024)


@pytest.mark.parametrize("fiscal_year", [2022, 2023, 2026])
def test_rejects_unreviewed_apple_years(fiscal_year: int) -> None:
    with pytest.raises(
        CashFlowStatementUnavailableError,
        match=f"profile for CIK 0000320193 FY{fiscal_year} is unavailable",
    ):
        extract_cash_flow_statement(
            load_sec_fixture("aapl_companyfacts.json"),
            cik="0000320193",
            fiscal_year=fiscal_year,
        )
