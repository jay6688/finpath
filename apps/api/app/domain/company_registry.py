from dataclasses import dataclass
from datetime import date


class UnsupportedCompanyError(LookupError):
    pass


@dataclass(frozen=True)
class CompanyCapabilities:
    revenue: bool
    revenue_growth: bool
    income_statement: bool
    cash_flow: bool
    balance_sheet: bool
    cash_debt: bool
    three_statements: bool
    earnings_per_share: bool


@dataclass(frozen=True)
class RevenueProfile:
    taxonomy_tag: str
    fiscal_year: int
    start_date: date
    end_date: date
    form: str
    filed_at: date
    accession: str


@dataclass(frozen=True)
class SupportedCompany:
    slug: str
    ticker: str
    cik: str
    display_name: str
    reviewed_fiscal_year: int
    capabilities: CompanyCapabilities
    revenue_profile: RevenueProfile


_COMPANIES = (
    SupportedCompany(
        slug="aapl",
        ticker="AAPL",
        cik="0000320193",
        display_name="Apple Inc.",
        reviewed_fiscal_year=2025,
        capabilities=CompanyCapabilities(
            revenue=True,
            revenue_growth=True,
            income_statement=True,
            cash_flow=True,
            balance_sheet=True,
            cash_debt=True,
            three_statements=True,
            earnings_per_share=True,
        ),
        revenue_profile=RevenueProfile(
            taxonomy_tag="RevenueFromContractWithCustomerExcludingAssessedTax",
            fiscal_year=2025,
            start_date=date(2024, 9, 29),
            end_date=date(2025, 9, 27),
            form="10-K",
            filed_at=date(2025, 10, 31),
            accession="0000320193-25-000079",
        ),
    ),
    SupportedCompany(
        slug="msft",
        ticker="MSFT",
        cik="0000789019",
        display_name="Microsoft Corporation",
        reviewed_fiscal_year=2026,
        capabilities=CompanyCapabilities(
            revenue=True,
            revenue_growth=True,
            income_statement=True,
            cash_flow=False,
            balance_sheet=True,
            cash_debt=True,
            three_statements=False,
            earnings_per_share=True,
        ),
        revenue_profile=RevenueProfile(
            taxonomy_tag="RevenueFromContractWithCustomerExcludingAssessedTax",
            fiscal_year=2026,
            start_date=date(2025, 7, 1),
            end_date=date(2026, 6, 30),
            form="10-K",
            filed_at=date(2026, 7, 29),
            accession="0001193125-26-323660",
        ),
    ),
    SupportedCompany(
        slug="wmt",
        ticker="WMT",
        cik="0000104169",
        display_name="Walmart Inc.",
        reviewed_fiscal_year=2026,
        capabilities=CompanyCapabilities(
            revenue=True,
            revenue_growth=True,
            income_statement=False,
            cash_flow=False,
            balance_sheet=True,
            cash_debt=True,
            three_statements=False,
            earnings_per_share=True,
        ),
        revenue_profile=RevenueProfile(
            taxonomy_tag="Revenues",
            fiscal_year=2026,
            start_date=date(2025, 2, 1),
            end_date=date(2026, 1, 31),
            form="10-K",
            filed_at=date(2026, 3, 13),
            accession="0000104169-26-000055",
        ),
    ),
)


def list_supported_companies() -> tuple[SupportedCompany, ...]:
    return _COMPANIES


def require_supported_company(identifier: str) -> SupportedCompany:
    normalized = identifier.strip().lower()
    for company in _COMPANIES:
        if normalized in {company.slug, company.ticker.lower()}:
            return company
    raise UnsupportedCompanyError(
        f"{identifier.strip().upper() or 'This ticker'} is not a reviewed FinPath company."
    )
