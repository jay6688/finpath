from dataclasses import dataclass
from datetime import date
import math
from typing import Any

from app.schemas.company import (
    CashFlowStatement,
    CashFlowStatementLine,
    CashFlowStatementLineId,
    CashFlowStatementLineRole,
)
from app.services.sec.provenance import build_filing_index_url


ANNUAL_FORMS = {"10-K", "10-K/A"}
MIN_ANNUAL_DAYS = 300
MAX_ANNUAL_DAYS = 430


class CashFlowStatementUnavailableError(ValueError):
    pass


@dataclass(frozen=True)
class LineSpec:
    id: CashFlowStatementLineId
    taxonomy_tag: str
    role: CashFlowStatementLineRole
    cash_effect_multiplier: int = 1


# Company Facts exposes economic increases/decreases for several XBRL concepts,
# while Apple's cash-flow statement displays their effect on operating cash.
# Asset increases reduce cash; asset decreases increase cash. The explicit
# multipliers keep that source-to-statement normalization reviewable.
LINE_SPECS = (
    LineSpec("net-income", "NetIncomeLoss", "starting-line"),
    LineSpec(
        "depreciation-and-amortization",
        "DepreciationDepletionAndAmortization",
        "non-cash-adjustment",
    ),
    LineSpec(
        "share-based-compensation-expense",
        "ShareBasedCompensation",
        "non-cash-adjustment",
    ),
    LineSpec("other", "OtherNoncashIncomeExpense", "non-cash-adjustment", -1),
    LineSpec(
        "accounts-receivable-net",
        "IncreaseDecreaseInAccountsReceivable",
        "operating-timing-adjustment",
        -1,
    ),
    LineSpec(
        "vendor-non-trade-receivables",
        "IncreaseDecreaseInOtherReceivables",
        "operating-timing-adjustment",
        -1,
    ),
    LineSpec(
        "inventories",
        "IncreaseDecreaseInInventories",
        "operating-timing-adjustment",
        -1,
    ),
    LineSpec(
        "other-current-and-non-current-assets",
        "IncreaseDecreaseInOtherOperatingAssets",
        "operating-timing-adjustment",
        -1,
    ),
    LineSpec(
        "accounts-payable",
        "IncreaseDecreaseInAccountsPayable",
        "operating-timing-adjustment",
    ),
    LineSpec(
        "other-current-and-non-current-liabilities",
        "IncreaseDecreaseInOtherOperatingLiabilities",
        "operating-timing-adjustment",
    ),
    LineSpec(
        "cash-generated-by-operating-activities",
        "NetCashProvidedByUsedInOperatingActivities",
        "final-total",
    ),
)


@dataclass(frozen=True)
class FactContext:
    fiscal_year: int
    start_date: date
    end_date: date
    form: str
    filed_at: date
    accession: str


@dataclass(frozen=True)
class NormalizedFact:
    context: FactContext
    value: int


def extract_cash_flow_statement(
    company_facts: dict[str, Any], *, cik: str, fiscal_year: int
) -> CashFlowStatement:
    anchor_spec = LINE_SPECS[-1]
    anchor_facts, _ = _facts_for_tag(company_facts, anchor_spec.taxonomy_tag)
    anchor = _select_anchor(anchor_facts, fiscal_year=fiscal_year)

    lines: list[CashFlowStatementLine] = []
    for spec in LINE_SPECS:
        raw_facts, taxonomy_label = _facts_for_tag(company_facts, spec.taxonomy_tag)
        source_value = _value_for_context(
            raw_facts,
            expected_context=anchor.context,
            taxonomy_tag=spec.taxonomy_tag,
        )
        lines.append(
            CashFlowStatementLine(
                id=spec.id,
                taxonomyTag=spec.taxonomy_tag,
                taxonomyLabel=taxonomy_label,
                value=source_value * spec.cash_effect_multiplier,
                role=spec.role,
            )
        )

    _validate_reconciliation(lines)
    return CashFlowStatement(
        fiscalYear=fiscal_year,
        startDate=anchor.context.start_date,
        endDate=anchor.context.end_date,
        currency="USD",
        form=anchor.context.form,
        filedAt=anchor.context.filed_at,
        accession=anchor.context.accession,
        sourceUrl=build_filing_index_url(cik, anchor.context.accession),
        lines=lines,
    )


def _facts_for_tag(
    company_facts: dict[str, Any], taxonomy_tag: str
) -> tuple[list[dict[str, Any]], str]:
    try:
        concept = company_facts["facts"]["us-gaap"][taxonomy_tag]
        facts = concept["units"]["USD"]
    except (KeyError, TypeError):
        raise CashFlowStatementUnavailableError(
            f"Required annual USD fact {taxonomy_tag} is unavailable."
        ) from None
    if not isinstance(facts, list):
        raise CashFlowStatementUnavailableError(
            f"Required annual USD fact {taxonomy_tag} is unavailable."
        )
    label = concept.get("label")
    return facts, label.strip() if isinstance(label, str) and label.strip() else taxonomy_tag


def _select_anchor(
    raw_facts: list[dict[str, Any]], *, fiscal_year: int
) -> NormalizedFact:
    by_context: dict[FactContext, set[int]] = {}
    for raw in raw_facts:
        candidate = _normalize_fact(raw)
        if candidate is None or candidate.context.fiscal_year != fiscal_year:
            continue
        by_context.setdefault(candidate.context, set()).add(candidate.value)
    if any(len(values) > 1 for values in by_context.values()):
        raise CashFlowStatementUnavailableError(
            "Operating cash flow contains conflicting values for the same SEC context."
        )
    candidates = [
        NormalizedFact(context=context, value=next(iter(values)))
        for context, values in by_context.items()
    ]
    if not candidates:
        raise CashFlowStatementUnavailableError(
            f"No complete FY{fiscal_year} annual operating cash flow context was found."
        )
    return max(
        candidates,
        key=lambda candidate: (
            candidate.context.end_date,
            candidate.context.filed_at,
            candidate.context.form == "10-K/A",
            candidate.context.accession,
        ),
    )


def _value_for_context(
    raw_facts: list[dict[str, Any]],
    *,
    expected_context: FactContext,
    taxonomy_tag: str,
) -> int:
    values = {
        candidate.value
        for raw in raw_facts
        if (candidate := _normalize_fact(raw)) is not None
        and candidate.context == expected_context
    }
    if not values:
        raise CashFlowStatementUnavailableError(
            f"{taxonomy_tag} does not match the selected operating cash flow filing context."
        )
    if len(values) > 1:
        raise CashFlowStatementUnavailableError(
            f"{taxonomy_tag} contains conflicting values for the selected SEC context."
        )
    return next(iter(values))


def _normalize_fact(raw: dict[str, Any]) -> NormalizedFact | None:
    if raw.get("form") not in ANNUAL_FORMS or raw.get("fp") != "FY":
        return None
    try:
        context = FactContext(
            fiscal_year=int(raw["fy"]),
            start_date=date.fromisoformat(raw["start"]),
            end_date=date.fromisoformat(raw["end"]),
            form=str(raw["form"]),
            filed_at=date.fromisoformat(raw["filed"]),
            accession=str(raw["accn"]),
        )
        value = raw["val"]
    except (KeyError, TypeError, ValueError):
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    if not math.isfinite(value):
        return None
    if not MIN_ANNUAL_DAYS <= (context.end_date - context.start_date).days <= MAX_ANNUAL_DAYS:
        return None
    return NormalizedFact(context=context, value=round(value))


def _validate_reconciliation(lines: list[CashFlowStatementLine]) -> None:
    if sum(line.value for line in lines[:-1]) != lines[-1].value:
        raise CashFlowStatementUnavailableError(
            "Operating cash flow adjustments must reconcile exactly to the reported total."
        )
