from app.domain.company_registry import list_supported_companies, require_supported_company


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
    assert companies[1].capabilities.income_statement is True
    assert companies[1].capabilities.cash_flow is False
    assert companies[1].capabilities.balance_sheet is True
    assert companies[1].capabilities.cash_debt is True
    assert companies[1].capabilities.three_statements is False
    assert companies[1].capabilities.earnings_per_share is True
    assert companies[2].capabilities.income_statement is False
    assert companies[2].capabilities.balance_sheet is True
    assert companies[2].capabilities.cash_debt is True
    assert companies[2].capabilities.three_statements is False
    assert companies[2].capabilities.earnings_per_share is True


def test_registry_rejects_unreviewed_tickers() -> None:
    try:
        require_supported_company("nvda")
    except LookupError as error:
        assert "not a reviewed FinPath company" in str(error)
    else:
        raise AssertionError("Unreviewed ticker must not inherit a reviewed profile")
