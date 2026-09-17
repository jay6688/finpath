from dataclasses import dataclass
from typing import Any, Protocol

from app.domain.cash_flow_statement import (
    CashFlowStatementUnavailableError,
    extract_cash_flow_statement,
)
from app.domain.company_registry import SupportedCompany, require_supported_company
from app.domain.income_statement import (
    IncomeStatementUnavailableError,
    extract_income_statement,
)
from app.domain.revenue import extract_annual_revenue
from app.schemas.company import (
    CompanyCashFlowStatementResponse,
    CompanyIdentity,
    CompanyIncomeStatementResponse,
    CompanyOverviewResponse,
    DataStatus,
    MetricMetadata,
)
from app.services.sec.client import SecPayload


class CompanyNotFoundError(LookupError):
    pass


class SecDataSource(Protocol):
    async def get_ticker_map(self) -> SecPayload: ...

    async def get_company_facts(self, cik: str) -> SecPayload: ...


@dataclass(frozen=True)
class CompanyMatch:
    ticker: str
    name: str
    cik: str


class CompanyOverviewService:
    def __init__(self, sec: SecDataSource) -> None:
        self.sec = sec

    async def get_overview(self, ticker: str) -> CompanyOverviewResponse:
        company, profile = await self._resolve_company(ticker)
        facts_payload = await self.sec.get_company_facts(company.cik)
        revenue = extract_annual_revenue(
            facts_payload.payload,
            cik=company.cik,
            profile=profile.revenue_profile,
        )

        return CompanyOverviewResponse(
            company=CompanyIdentity(
                ticker=company.ticker,
                name=company.name,
                cik=company.cik,
            ),
            metric=MetricMetadata(
                id="revenue",
                label="Revenue",
                currency="USD",
                taxonomyTag=revenue.taxonomy_tag,
            ),
            series=revenue.facts,
            dataStatus=DataStatus(
                state=facts_payload.state,
                retrievedAt=facts_payload.retrieved_at,
            ),
        )

    async def get_income_statement(
        self,
        ticker: str,
        fiscal_year: int,
    ) -> CompanyIncomeStatementResponse:
        company, profile = await self._resolve_company(ticker)
        if (
            not profile.capabilities.income_statement
            or fiscal_year != profile.reviewed_fiscal_year
        ):
            raise IncomeStatementUnavailableError(
                "Income statement profile for "
                f"CIK {company.cik} FY{fiscal_year} is unavailable."
            )
        facts_payload = await self.sec.get_company_facts(company.cik)
        statement = extract_income_statement(
            facts_payload.payload,
            cik=company.cik,
            fiscal_year=fiscal_year,
        )

        return CompanyIncomeStatementResponse(
            company=CompanyIdentity(
                ticker=company.ticker,
                name=company.name,
                cik=company.cik,
            ),
            statement=statement,
            dataStatus=DataStatus(
                state=facts_payload.state,
                retrievedAt=facts_payload.retrieved_at,
            ),
        )

    async def get_cash_flow_statement(
        self,
        ticker: str,
        fiscal_year: int,
    ) -> CompanyCashFlowStatementResponse:
        company, profile = await self._resolve_company(ticker)
        if (
            not profile.capabilities.cash_flow
            or fiscal_year != profile.reviewed_fiscal_year
        ):
            raise CashFlowStatementUnavailableError(
                "Cash flow statement profile for "
                f"CIK {company.cik} FY{fiscal_year} is unavailable."
            )
        facts_payload = await self.sec.get_company_facts(company.cik)
        statement = extract_cash_flow_statement(
            facts_payload.payload,
            cik=company.cik,
            fiscal_year=fiscal_year,
        )

        return CompanyCashFlowStatementResponse(
            company=CompanyIdentity(
                ticker=company.ticker,
                name=company.name,
                cik=company.cik,
            ),
            statement=statement,
            dataStatus=DataStatus(
                state=facts_payload.state,
                retrievedAt=facts_payload.retrieved_at,
            ),
        )

    async def _resolve_company(
        self, identifier: str
    ) -> tuple[CompanyMatch, SupportedCompany]:
        try:
            profile = require_supported_company(identifier)
        except LookupError as error:
            raise CompanyNotFoundError(str(error)) from error

        ticker_payload = await self.sec.get_ticker_map()
        sec_company = find_company(ticker_payload.payload, profile.ticker)
        if sec_company.cik != profile.cik:
            raise CompanyNotFoundError(
                f"SEC identity for {profile.ticker} does not match its reviewed profile."
            )

        return (
            CompanyMatch(
                ticker=profile.ticker,
                name=profile.display_name,
                cik=profile.cik,
            ),
            profile,
        )


def find_company(ticker_map: dict[str, Any], ticker: str) -> CompanyMatch:
    for entry in ticker_map.values():
        if not isinstance(entry, dict):
            continue
        if str(entry.get("ticker", "")).upper() != ticker:
            continue

        try:
            cik = str(int(entry["cik_str"])).zfill(10)
            name = str(entry["title"])
        except (KeyError, TypeError, ValueError) as error:
            raise CompanyNotFoundError(
                f"SEC ticker entry for {ticker} is incomplete."
            ) from error

        return CompanyMatch(ticker=ticker, name=name, cik=cik)

    raise CompanyNotFoundError(f"Ticker {ticker} was not found in the SEC map.")
