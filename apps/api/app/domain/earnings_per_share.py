from dataclasses import dataclass
from datetime import date
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP, localcontext
from typing import Any, Literal

from app.schemas.company import (
    EarningsPerShareStatement,
    EarningsPerShareVerification,
    ReportedEarningsAmount,
    ReportedEarningsPerShare,
    ReportedWeightedAverageShares,
)
from app.services.sec.provenance import build_filing_index_url


class EarningsPerShareUnavailableError(ValueError):
    pass


@dataclass(frozen=True)
class DurationContext:
    fiscal_year: int
    start_date: date
    end_date: date
    form: str
    filed_at: date
    accession: str


@dataclass(frozen=True)
class ReportedFactSpec:
    taxonomy_tag: str
    unit: str
    reported_label: str


@dataclass(frozen=True)
class EarningsPerShareProfile:
    context: DurationContext
    statement_name: str
    earnings_numerator: ReportedFactSpec
    basic_shares: ReportedFactSpec
    diluted_shares: ReportedFactSpec
    basic_eps: ReportedFactSpec
    diluted_eps: ReportedFactSpec


BASIC_SHARES = ReportedFactSpec(
    taxonomy_tag="WeightedAverageNumberOfSharesOutstandingBasic",
    unit="shares",
    reported_label="Weighted-average basic shares",
)
DILUTED_SHARES = ReportedFactSpec(
    taxonomy_tag="WeightedAverageNumberOfDilutedSharesOutstanding",
    unit="shares",
    reported_label="Weighted-average diluted shares",
)
BASIC_EPS = ReportedFactSpec(
    taxonomy_tag="EarningsPerShareBasic",
    unit="USD/shares",
    reported_label="Basic earnings per share",
)
DILUTED_EPS = ReportedFactSpec(
    taxonomy_tag="EarningsPerShareDiluted",
    unit="USD/shares",
    reported_label="Diluted earnings per share",
)


EPS_PROFILES = {
    ("0000320193", 2025): EarningsPerShareProfile(
        context=DurationContext(
            fiscal_year=2025,
            start_date=date(2024, 9, 29),
            end_date=date(2025, 9, 27),
            form="10-K",
            filed_at=date(2025, 10, 31),
            accession="0000320193-25-000079",
        ),
        statement_name="Earnings Per Share",
        earnings_numerator=ReportedFactSpec(
            taxonomy_tag="NetIncomeLoss",
            unit="USD",
            reported_label="Net income",
        ),
        basic_shares=BASIC_SHARES,
        diluted_shares=DILUTED_SHARES,
        basic_eps=BASIC_EPS,
        diluted_eps=DILUTED_EPS,
    ),
    ("0000789019", 2026): EarningsPerShareProfile(
        context=DurationContext(
            fiscal_year=2026,
            start_date=date(2025, 7, 1),
            end_date=date(2026, 6, 30),
            form="10-K",
            filed_at=date(2026, 7, 29),
            accession="0001193125-26-323660",
        ),
        statement_name="Earnings Per Share",
        earnings_numerator=ReportedFactSpec(
            taxonomy_tag="NetIncomeLoss",
            unit="USD",
            reported_label="Net income available for common shareholders",
        ),
        basic_shares=BASIC_SHARES,
        diluted_shares=DILUTED_SHARES,
        basic_eps=BASIC_EPS,
        diluted_eps=DILUTED_EPS,
    ),
    ("0000104169", 2026): EarningsPerShareProfile(
        context=DurationContext(
            fiscal_year=2026,
            start_date=date(2025, 2, 1),
            end_date=date(2026, 1, 31),
            form="10-K",
            filed_at=date(2026, 3, 13),
            accession="0000104169-26-000055",
        ),
        statement_name="Basic and Diluted Net Income Per Common Share",
        earnings_numerator=ReportedFactSpec(
            taxonomy_tag="NetIncomeLoss",
            unit="USD",
            reported_label="Consolidated net income attributable to Walmart",
        ),
        basic_shares=BASIC_SHARES,
        diluted_shares=DILUTED_SHARES,
        basic_eps=BASIC_EPS,
        diluted_eps=DILUTED_EPS,
    ),
}


def extract_earnings_per_share(
    company_facts: dict[str, Any], *, cik: str, fiscal_year: int
) -> EarningsPerShareStatement:
    normalized_cik = cik.zfill(10)
    _require_company_cik(company_facts, normalized_cik)
    profile = _profile_for(normalized_cik, fiscal_year)

    numerator, numerator_label = _reported_value(
        company_facts, profile.earnings_numerator, profile.context, integer=True
    )
    basic_shares, basic_shares_label = _reported_value(
        company_facts, profile.basic_shares, profile.context, integer=True
    )
    diluted_shares, diluted_shares_label = _reported_value(
        company_facts, profile.diluted_shares, profile.context, integer=True
    )
    basic_eps, basic_eps_label = _reported_value(
        company_facts, profile.basic_eps, profile.context, integer=False
    )
    diluted_eps, diluted_eps_label = _reported_value(
        company_facts, profile.diluted_eps, profile.context, integer=False
    )

    assert isinstance(numerator, int)
    assert isinstance(basic_shares, int)
    assert isinstance(diluted_shares, int)
    assert isinstance(basic_eps, Decimal)
    assert isinstance(diluted_eps, Decimal)
    if basic_shares <= 0 or diluted_shares <= 0:
        raise EarningsPerShareUnavailableError(
            "Weighted-average share counts must be positive."
        )
    if diluted_shares < basic_shares:
        raise EarningsPerShareUnavailableError(
            "Diluted weighted-average shares cannot be below basic weighted-average shares."
        )

    basic_verification = _verification(
        "basic", numerator, basic_shares, basic_eps
    )
    diluted_verification = _verification(
        "diluted", numerator, diluted_shares, diluted_eps
    )

    return EarningsPerShareStatement(
        fiscalYear=profile.context.fiscal_year,
        startDate=profile.context.start_date,
        endDate=profile.context.end_date,
        currency="USD",
        form=profile.context.form,
        filedAt=profile.context.filed_at,
        accession=profile.context.accession,
        sourceUrl=build_filing_index_url(normalized_cik, profile.context.accession),
        statementName=profile.statement_name,
        earningsNumerator=ReportedEarningsAmount(
            id="earnings-numerator",
            taxonomyTag=profile.earnings_numerator.taxonomy_tag,
            taxonomyLabel=numerator_label,
            reportedLabel=profile.earnings_numerator.reported_label,
            value=numerator,
            unit="USD",
        ),
        basicWeightedAverageShares=ReportedWeightedAverageShares(
            id="basic-weighted-average-shares",
            taxonomyTag=profile.basic_shares.taxonomy_tag,
            taxonomyLabel=basic_shares_label,
            reportedLabel=profile.basic_shares.reported_label,
            value=basic_shares,
            unit="shares",
        ),
        dilutedWeightedAverageShares=ReportedWeightedAverageShares(
            id="diluted-weighted-average-shares",
            taxonomyTag=profile.diluted_shares.taxonomy_tag,
            taxonomyLabel=diluted_shares_label,
            reportedLabel=profile.diluted_shares.reported_label,
            value=diluted_shares,
            unit="shares",
        ),
        basicEps=ReportedEarningsPerShare(
            id="basic-eps",
            taxonomyTag=profile.basic_eps.taxonomy_tag,
            taxonomyLabel=basic_eps_label,
            reportedLabel=profile.basic_eps.reported_label,
            value=basic_eps,
            unit="USD/share",
        ),
        dilutedEps=ReportedEarningsPerShare(
            id="diluted-eps",
            taxonomyTag=profile.diluted_eps.taxonomy_tag,
            taxonomyLabel=diluted_eps_label,
            reportedLabel=profile.diluted_eps.reported_label,
            value=diluted_eps,
            unit="USD/share",
        ),
        basicVerification=basic_verification,
        dilutedVerification=diluted_verification,
    )


def _require_company_cik(company_facts: dict[str, Any], expected_cik: str) -> None:
    try:
        payload_cik = str(int(company_facts["cik"])).zfill(10)
    except (KeyError, TypeError, ValueError):
        raise EarningsPerShareUnavailableError(
            "Company Facts does not contain a valid company CIK."
        ) from None
    if payload_cik != expected_cik:
        raise EarningsPerShareUnavailableError(
            "Company Facts does not match the reviewed company CIK."
        )


def _profile_for(cik: str, fiscal_year: int) -> EarningsPerShareProfile:
    try:
        return EPS_PROFILES[(cik, fiscal_year)]
    except KeyError:
        raise EarningsPerShareUnavailableError(
            f"Earnings per share profile for CIK {cik} FY{fiscal_year} is unavailable."
        ) from None


def _reported_value(
    company_facts: dict[str, Any],
    spec: ReportedFactSpec,
    context: DurationContext,
    *,
    integer: bool,
) -> tuple[int | Decimal, str]:
    try:
        concept = company_facts["facts"]["us-gaap"][spec.taxonomy_tag]
        facts = concept["units"][spec.unit]
    except (KeyError, TypeError):
        raise EarningsPerShareUnavailableError(
            f"Required {spec.unit} fact {spec.taxonomy_tag} is unavailable."
        ) from None
    if not isinstance(facts, list):
        raise EarningsPerShareUnavailableError(
            f"Required {spec.unit} fact {spec.taxonomy_tag} is unavailable."
        )

    values: set[Decimal] = set()
    for raw in facts:
        if not _matches_context(raw, context):
            continue
        try:
            if isinstance(raw.get("val"), bool):
                continue
            value = Decimal(str(raw["val"]))
        except (KeyError, InvalidOperation, TypeError, ValueError):
            continue
        if value.is_finite():
            values.add(value)

    if not values:
        raise EarningsPerShareUnavailableError(
            f"{spec.taxonomy_tag} does not match the reviewed annual context."
        )
    if len(values) > 1:
        raise EarningsPerShareUnavailableError(
            f"{spec.taxonomy_tag} contains conflicting values for the reviewed annual context."
        )

    value = next(iter(values))
    taxonomy_label = concept.get("label")
    if not isinstance(taxonomy_label, str) or not taxonomy_label.strip():
        taxonomy_label = spec.taxonomy_tag
    if integer:
        if value != value.to_integral_value():
            raise EarningsPerShareUnavailableError(
                f"{spec.taxonomy_tag} must be an exact integer {spec.unit} fact."
            )
        return int(value), taxonomy_label.strip()
    quantized = value.quantize(Decimal("0.01"))
    if value != quantized:
        raise EarningsPerShareUnavailableError(
            f"{spec.taxonomy_tag} exceeds the reviewed two-decimal reporting precision."
        )
    return quantized, taxonomy_label.strip()


def _matches_context(raw: dict[str, Any], context: DurationContext) -> bool:
    return (
        raw.get("fy") == context.fiscal_year
        and raw.get("fp") == "FY"
        and raw.get("form") == context.form
        and raw.get("start") == context.start_date.isoformat()
        and raw.get("end") == context.end_date.isoformat()
        and raw.get("filed") == context.filed_at.isoformat()
        and raw.get("accn") == context.accession
    )


def _verification(
    basis: Literal["basic", "diluted"],
    numerator: int,
    denominator: int,
    reported: Decimal,
) -> EarningsPerShareVerification:
    with localcontext() as context:
        context.prec = 40
        exact = Decimal(numerator) / Decimal(denominator)
        rounded = exact.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if rounded != reported:
        raise EarningsPerShareUnavailableError(
            f"{basis.title()} EPS verification does not match the company-reported EPS."
        )
    return EarningsPerShareVerification(
        basis=basis,
        formula="Earnings numerator ÷ weighted-average shares",
        numerator=numerator,
        denominator=denominator,
        exactResult=exact,
        roundedResult=rounded,
        reportedResult=reported,
    )
