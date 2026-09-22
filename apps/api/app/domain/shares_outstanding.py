from dataclasses import dataclass
from datetime import date
from typing import Any, Literal

from app.services.sec.provenance import build_filing_index_url


class SharesOutstandingUnavailableError(ValueError):
    pass


@dataclass(frozen=True)
class SharesOutstandingProfile:
    cik: str
    fiscal_year: int
    taxonomy_namespace: Literal["dei"]
    taxonomy_tag: Literal["EntityCommonStockSharesOutstanding"]
    unit: Literal["shares"]
    as_of_date: date
    form: Literal["10-K"]
    filed_at: date
    accession: str
    expected_value: int
    reported_label: str


@dataclass(frozen=True)
class ReportedSharesOutstanding:
    evidence_kind: Literal["reported"]
    id: Literal["common-shares-outstanding"]
    cik: str
    fiscal_year: int
    as_of_date: date
    form: Literal["10-K"]
    filed_at: date
    accession: str
    source_url: str
    taxonomy_namespace: Literal["dei"]
    taxonomy_tag: Literal["EntityCommonStockSharesOutstanding"]
    taxonomy_label: str
    reported_label: str
    value: int
    unit: Literal["shares"]


SHARES_OUTSTANDING_PROFILES = {
    ("0000320193", 2025): SharesOutstandingProfile(
        cik="0000320193",
        fiscal_year=2025,
        taxonomy_namespace="dei",
        taxonomy_tag="EntityCommonStockSharesOutstanding",
        unit="shares",
        as_of_date=date(2025, 10, 17),
        form="10-K",
        filed_at=date(2025, 10, 31),
        accession="0000320193-25-000079",
        expected_value=14_776_353_000,
        reported_label="Shares of common stock outstanding",
    ),
    ("0000789019", 2026): SharesOutstandingProfile(
        cik="0000789019",
        fiscal_year=2026,
        taxonomy_namespace="dei",
        taxonomy_tag="EntityCommonStockSharesOutstanding",
        unit="shares",
        as_of_date=date(2026, 7, 23),
        form="10-K",
        filed_at=date(2026, 7, 29),
        accession="0001193125-26-323660",
        expected_value=7_425_545_491,
        reported_label="Shares of common stock outstanding",
    ),
    ("0000104169", 2026): SharesOutstandingProfile(
        cik="0000104169",
        fiscal_year=2026,
        taxonomy_namespace="dei",
        taxonomy_tag="EntityCommonStockSharesOutstanding",
        unit="shares",
        as_of_date=date(2026, 3, 11),
        form="10-K",
        filed_at=date(2026, 3, 13),
        accession="0000104169-26-000055",
        expected_value=7_972_402_501,
        reported_label="Shares of common stock outstanding",
    ),
}


def extract_shares_outstanding(
    company_facts: dict[str, Any], *, cik: str, fiscal_year: int
) -> ReportedSharesOutstanding:
    normalized_cik = cik.zfill(10)
    _require_company_cik(company_facts, normalized_cik)
    profile = _profile_for(normalized_cik, fiscal_year)

    try:
        concept = company_facts["facts"][profile.taxonomy_namespace][
            profile.taxonomy_tag
        ]
        facts = concept["units"][profile.unit]
    except (KeyError, TypeError):
        raise SharesOutstandingUnavailableError(
            "Required instant shares fact "
            f"{profile.taxonomy_namespace}:{profile.taxonomy_tag} is unavailable."
        ) from None
    if not isinstance(facts, list):
        raise SharesOutstandingUnavailableError(
            f"Required instant shares fact {profile.taxonomy_tag} is unavailable."
        )

    matching = [
        raw
        for raw in facts
        if isinstance(raw, dict) and _matches_reviewed_instant(raw, profile)
    ]
    if not matching:
        raise SharesOutstandingUnavailableError(
            f"{profile.taxonomy_tag} does not match the reviewed instant context."
        )
    values: set[int] = set()
    for raw in matching:
        value = raw.get("val")
        if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
            raise SharesOutstandingUnavailableError(
                f"{profile.taxonomy_tag} must be a positive integer shares fact."
            )
        values.add(value)
    if len(values) > 1:
        raise SharesOutstandingUnavailableError(
            f"{profile.taxonomy_tag} contains conflicting values for the reviewed instant context."
        )

    value = next(iter(values))
    if value != profile.expected_value:
        raise SharesOutstandingUnavailableError(
            f"{profile.taxonomy_tag} does not match the reviewed value."
        )
    taxonomy_label = concept.get("label")
    if not isinstance(taxonomy_label, str) or not taxonomy_label.strip():
        taxonomy_label = profile.taxonomy_tag

    return ReportedSharesOutstanding(
        evidence_kind="reported",
        id="common-shares-outstanding",
        cik=profile.cik,
        fiscal_year=profile.fiscal_year,
        as_of_date=profile.as_of_date,
        form=profile.form,
        filed_at=profile.filed_at,
        accession=profile.accession,
        source_url=build_filing_index_url(profile.cik, profile.accession),
        taxonomy_namespace=profile.taxonomy_namespace,
        taxonomy_tag=profile.taxonomy_tag,
        taxonomy_label=taxonomy_label.strip(),
        reported_label=profile.reported_label,
        value=value,
        unit=profile.unit,
    )


def get_shares_outstanding_profile(
    cik: str, fiscal_year: int
) -> SharesOutstandingProfile:
    return _profile_for(cik.zfill(10), fiscal_year)


def _profile_for(cik: str, fiscal_year: int) -> SharesOutstandingProfile:
    try:
        return SHARES_OUTSTANDING_PROFILES[(cik, fiscal_year)]
    except KeyError:
        raise SharesOutstandingUnavailableError(
            f"Shares-outstanding profile for CIK {cik} FY{fiscal_year} is unavailable."
        ) from None


def _require_company_cik(company_facts: dict[str, Any], expected_cik: str) -> None:
    try:
        payload_cik = str(int(company_facts["cik"])).zfill(10)
    except (KeyError, TypeError, ValueError):
        raise SharesOutstandingUnavailableError(
            "Company Facts does not contain a valid company CIK."
        ) from None
    if payload_cik != expected_cik:
        raise SharesOutstandingUnavailableError(
            "Company Facts does not match the reviewed company CIK."
        )


def _matches_reviewed_instant(
    raw: dict[str, Any], profile: SharesOutstandingProfile
) -> bool:
    return (
        "start" not in raw
        and raw.get("end") == profile.as_of_date.isoformat()
        and raw.get("fy") == profile.fiscal_year
        and raw.get("fp") == "FY"
        and raw.get("form") == profile.form
        and raw.get("filed") == profile.filed_at.isoformat()
        and raw.get("accn") == profile.accession
    )
