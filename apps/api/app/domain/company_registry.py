from dataclasses import dataclass, field
from datetime import date
from typing import Literal, get_args


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
    shares_outstanding: bool


# Capabilities served by a fiscal-year route
# (`/v1/companies/{ticker}/<statement>/{fiscal_year}`).
YearScopedCapability = Literal[
    "income_statement",
    "cash_flow",
    "balance_sheet",
    "earnings_per_share",
    "shares_outstanding",
]
YEAR_SCOPED_CAPABILITIES: tuple[YearScopedCapability, ...] = get_args(
    YearScopedCapability
)


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
    # The latest reviewed year. Every enabled capability is reviewed for it.
    reviewed_fiscal_year: int
    capabilities: CompanyCapabilities
    revenue_profile: RevenueProfile
    # Earlier years reviewed for one capability only. A year listed for the
    # income statement says nothing about the balance sheet in that year.
    earlier_reviewed_fiscal_years: dict[YearScopedCapability, tuple[int, ...]] = field(
        default_factory=dict,
        hash=False,
    )

    def reviewed_fiscal_years(
        self, capability: YearScopedCapability
    ) -> tuple[int, ...]:
        """Reviewed years for one capability, newest first; empty if disabled."""
        if not getattr(self.capabilities, capability):
            return ()
        earlier = self.earlier_reviewed_fiscal_years.get(capability, ())
        return (self.reviewed_fiscal_year, *sorted(earlier, reverse=True))

    def is_reviewed(self, capability: YearScopedCapability, fiscal_year: int) -> bool:
        return fiscal_year in self.reviewed_fiscal_years(capability)


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
            shares_outstanding=True,
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
        # FY2024 10-K, accession 0000320193-24-000123, filed 2024-11-01.
        earlier_reviewed_fiscal_years={
            "income_statement": (2024,),
            "cash_flow": (2024,),
        },
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
            shares_outstanding=True,
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
            shares_outstanding=True,
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


def _validate_registry(companies: tuple[SupportedCompany, ...]) -> None:
    for company in companies:
        for capability, years in company.earlier_reviewed_fiscal_years.items():
            if capability not in YEAR_SCOPED_CAPABILITIES:
                raise ValueError(f"{company.ticker}: unknown capability {capability}.")
            if not getattr(company.capabilities, capability):
                raise ValueError(
                    f"{company.ticker}: {capability} years listed for a disabled capability."
                )
            if len(set(years)) != len(years) or any(
                year >= company.reviewed_fiscal_year for year in years
            ):
                raise ValueError(
                    f"{company.ticker}: earlier {capability} years must be unique "
                    "and older than the reviewed fiscal year."
                )


_validate_registry(_COMPANIES)


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
