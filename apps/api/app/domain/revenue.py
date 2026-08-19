from dataclasses import dataclass
from datetime import date
from typing import Any

from app.schemas.company import AnnualFinancialFact
from app.services.sec.provenance import build_filing_index_url


REVENUE_TAGS = (
    "RevenueFromContractWithCustomerExcludingAssessedTax",
    "Revenues",
    "SalesRevenueNet",
)
ANNUAL_FORMS = {"10-K", "10-K/A"}
MIN_ANNUAL_DAYS = 300
MAX_ANNUAL_DAYS = 430


class RevenueUnavailableError(ValueError):
    pass


@dataclass(frozen=True)
class RevenueSeries:
    taxonomy_tag: str
    facts: list[AnnualFinancialFact]


def extract_annual_revenue(
    company_facts: dict[str, Any],
    *,
    cik: str,
    years: int = 5,
) -> RevenueSeries:
    for taxonomy_tag in REVENUE_TAGS:
        raw_facts = _facts_for_tag(company_facts, taxonomy_tag)
        normalized = _normalize_facts(raw_facts, cik=cik)
        if normalized:
            return RevenueSeries(
                taxonomy_tag=taxonomy_tag,
                facts=normalized[-years:],
            )

    raise RevenueUnavailableError(
        "No supported annual USD Revenue facts were found for this company."
    )


def _facts_for_tag(
    company_facts: dict[str, Any], taxonomy_tag: str
) -> list[dict[str, Any]]:
    try:
        facts = company_facts["facts"]["us-gaap"][taxonomy_tag]["units"]["USD"]
    except (KeyError, TypeError):
        return []
    return facts if isinstance(facts, list) else []


def _normalize_facts(
    raw_facts: list[dict[str, Any]], *, cik: str
) -> list[AnnualFinancialFact]:
    by_period_end: dict[date, AnnualFinancialFact] = {}

    for raw in raw_facts:
        candidate = _normalize_fact(raw, cik=cik)
        if candidate is None:
            continue

        existing = by_period_end.get(candidate.end_date)
        if existing is None or (
            candidate.filed_at,
            candidate.form == "10-K/A",
            candidate.accession,
        ) > (
            existing.filed_at,
            existing.form == "10-K/A",
            existing.accession,
        ):
            by_period_end[candidate.end_date] = candidate

    return [by_period_end[end_date] for end_date in sorted(by_period_end)]


def _normalize_fact(
    raw: dict[str, Any], *, cik: str
) -> AnnualFinancialFact | None:
    if raw.get("form") not in ANNUAL_FORMS or raw.get("fp") != "FY":
        return None

    try:
        start_date = date.fromisoformat(raw["start"])
        end_date = date.fromisoformat(raw["end"])
        filed_at = date.fromisoformat(raw["filed"])
        value = raw["val"]
        accession = raw["accn"]
    except (KeyError, TypeError, ValueError):
        return None

    duration_days = (end_date - start_date).days
    if not MIN_ANNUAL_DAYS <= duration_days <= MAX_ANNUAL_DAYS:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)) or value < 0:
        return None

    return AnnualFinancialFact(
        fiscalYear=end_date.year,
        startDate=start_date,
        endDate=end_date,
        value=round(value),
        form=raw["form"],
        filedAt=filed_at,
        accession=accession,
        sourceUrl=build_filing_index_url(cik, accession),
    )
