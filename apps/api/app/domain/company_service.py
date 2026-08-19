from dataclasses import dataclass
from typing import Any, Protocol

from app.domain.revenue import extract_annual_revenue
from app.schemas.company import (
    CompanyIdentity,
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
        normalized_ticker = ticker.strip().upper()
        ticker_payload = await self.sec.get_ticker_map()
        company = find_company(ticker_payload.payload, normalized_ticker)
        facts_payload = await self.sec.get_company_facts(company.cik)
        revenue = extract_annual_revenue(
            facts_payload.payload,
            cik=company.cik,
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
