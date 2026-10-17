from dataclasses import replace

import pytest

from app.domain.cash_flow_statement import STATEMENT_SPECS as CASH_FLOW_SPECS
from app.domain.company_registry import (
    YEAR_SCOPED_CAPABILITIES,
    _validate_registry,
    list_supported_companies,
    require_supported_company,
)
from app.domain.income_statement import INCOME_STATEMENT_SPECS


def test_registry_contains_exactly_the_three_reviewed_companies() -> None:
    companies = list_supported_companies()

    assert [(company.slug, company.ticker, company.cik) for company in companies] == [
        ("aapl", "AAPL", "0000320193"),
        ("msft", "MSFT", "0000789019"),
        ("wmt", "WMT", "0000104169"),
    ]
    assert companies[0].capabilities.cash_flow is True
    assert companies[0].capabilities.balance_sheet is True
    assert companies[0].capabilities.cash_debt is True
    assert companies[0].capabilities.three_statements is True
    assert companies[0].capabilities.earnings_per_share is True
    assert companies[0].capabilities.shares_outstanding is True
    assert companies[1].capabilities.income_statement is True
    assert companies[1].capabilities.cash_flow is False
    assert companies[1].capabilities.balance_sheet is True
    assert companies[1].capabilities.cash_debt is True
    assert companies[1].capabilities.three_statements is False
    assert companies[1].capabilities.earnings_per_share is True
    assert companies[1].capabilities.shares_outstanding is True
    assert companies[2].capabilities.income_statement is False
    assert companies[2].capabilities.balance_sheet is True
    assert companies[2].capabilities.cash_debt is True
    assert companies[2].capabilities.three_statements is False
    assert companies[2].capabilities.earnings_per_share is True
    assert companies[2].capabilities.shares_outstanding is True


def test_registry_rejects_unreviewed_tickers() -> None:
    try:
        require_supported_company("nvda")
    except LookupError as error:
        assert "not a reviewed FinPath company" in str(error)
    else:
        raise AssertionError("Unreviewed ticker must not inherit a reviewed profile")


def test_reviewed_years_are_explicit_per_capability() -> None:
    apple, microsoft, walmart = list_supported_companies()

    assert apple.reviewed_fiscal_year == 2025
    assert apple.reviewed_fiscal_years("income_statement") == (2025, 2024)
    assert apple.reviewed_fiscal_years("cash_flow") == (2025, 2024)
    assert apple.reviewed_fiscal_years("balance_sheet") == (2025,)
    assert apple.reviewed_fiscal_years("earnings_per_share") == (2025,)
    assert apple.reviewed_fiscal_years("shares_outstanding") == (2025,)
    assert apple.is_reviewed("income_statement", 2024) is True
    assert apple.is_reviewed("income_statement", 2023) is False
    assert apple.is_reviewed("balance_sheet", 2024) is False

    assert microsoft.reviewed_fiscal_years("income_statement") == (2026,)
    assert microsoft.reviewed_fiscal_years("cash_flow") == ()
    assert walmart.reviewed_fiscal_years("income_statement") == ()
    assert walmart.reviewed_fiscal_years("balance_sheet") == (2026,)


def test_statement_profiles_match_the_registry_exactly() -> None:
    # The registry gate and the extractor profile tables must agree, so a year
    # can never be advertised without a reviewed profile, or the reverse.
    registry_income = {
        (company.cik, year)
        for company in list_supported_companies()
        for year in company.reviewed_fiscal_years("income_statement")
    }
    registry_cash_flow = {
        (company.cik, year)
        for company in list_supported_companies()
        for year in company.reviewed_fiscal_years("cash_flow")
    }

    assert registry_income == set(INCOME_STATEMENT_SPECS)
    assert registry_cash_flow == set(CASH_FLOW_SPECS)


@pytest.mark.parametrize(
    ("earlier", "message"),
    [
        ({"balance_sheet": (2025,)}, "older than the reviewed fiscal year"),
        ({"balance_sheet": (2024, 2024)}, "must be unique"),
        ({"revenue": (2024,)}, "unknown capability"),
    ],
)
def test_registry_rejects_invalid_earlier_years(earlier, message: str) -> None:
    apple = list_supported_companies()[0]

    with pytest.raises(ValueError, match=message):
        _validate_registry((replace(apple, earlier_reviewed_fiscal_years=earlier),))


def test_registry_rejects_earlier_years_for_a_disabled_capability() -> None:
    walmart = list_supported_companies()[2]

    with pytest.raises(ValueError, match="disabled capability"):
        _validate_registry(
            (replace(walmart, earlier_reviewed_fiscal_years={"income_statement": (2025,)}),)
        )


def test_every_year_scoped_capability_is_a_capability_flag() -> None:
    capabilities = list_supported_companies()[0].capabilities

    for capability in YEAR_SCOPED_CAPABILITIES:
        assert isinstance(getattr(capabilities, capability), bool)
