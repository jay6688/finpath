from dataclasses import dataclass
from datetime import date
from typing import Any

from app.schemas.company import AnnualFinancialFact
from app.domain.company_registry import RevenueProfile
from app.services.sec.provenance import build_filing_index_url


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
    profile: RevenueProfile,
    years: int = 5,
) -> RevenueSeries:
    if cik.zfill(10) == "0000000000":
        raise RevenueUnavailableError("Revenue profile has an invalid CIK context.")

    raw_facts = _facts_for_tag(company_facts, profile.taxonomy_tag)
    normalized = _normalize_facts(raw_facts, cik=cik)
    selected = normalized[-years:]
    if selected and _matches_reviewed_profile(selected[-1], profile):
        return RevenueSeries(
            taxonomy_tag=profile.taxonomy_tag,
            facts=selected,
        )

    raise RevenueUnavailableError(
        "The reviewed annual USD Revenue record is unavailable for this company."
    )


def _matches_reviewed_profile(
    fact: AnnualFinancialFact,
    profile: RevenueProfile,
) -> bool:
    return (
        fact.fiscal_year == profile.fiscal_year
        and fact.start_date == profile.start_date
        and fact.end_date == profile.end_date
        and fact.form == profile.form
        and fact.filed_at == profile.filed_at
        and fact.accession == profile.accession
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
