from dataclasses import dataclass
from datetime import date, timedelta
import math
from typing import Any

from app.schemas.company import (
    CashBalanceFact,
    CashFlowSection,
    CashFlowSectionId,
    CashFlowStatement,
    CashFlowStatementLine,
    CashFlowStatementLineId,
    CashFlowStatementLineRole,
    CashMovement,
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


@dataclass(frozen=True)
class SectionSpec:
    id: CashFlowSectionId
    lines: tuple[LineSpec, ...]


# Company Facts sometimes exposes a positive payment magnitude even when the
# filed cash-flow statement presents that payment as a cash outflow. Explicit
# multipliers keep every normalization visible and testable.
SECTION_SPECS = (
    SectionSpec(
        "operating",
        (
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
        ),
    ),
    SectionSpec(
        "investing",
        (
            LineSpec(
                "purchases-of-marketable-securities",
                "PaymentsToAcquireAvailableForSaleSecuritiesDebt",
                "cash-outflow",
                -1,
            ),
            LineSpec(
                "maturities-of-marketable-securities",
                "ProceedsFromMaturitiesPrepaymentsAndCallsOfAvailableForSaleSecurities",
                "cash-inflow",
            ),
            LineSpec(
                "sales-of-marketable-securities",
                "ProceedsFromSaleOfAvailableForSaleSecuritiesDebt",
                "cash-inflow",
            ),
            LineSpec(
                "payments-for-property-plant-and-equipment",
                "PaymentsToAcquirePropertyPlantAndEquipment",
                "cash-outflow",
                -1,
            ),
            LineSpec(
                "other-investing-activities",
                "PaymentsForProceedsFromOtherInvestingActivities",
                "cash-outflow",
                -1,
            ),
            LineSpec(
                "cash-generated-by-investing-activities",
                "NetCashProvidedByUsedInInvestingActivities",
                "section-total",
            ),
        ),
    ),
    SectionSpec(
        "financing",
        (
            LineSpec(
                "taxes-related-to-net-share-settlement",
                "PaymentsRelatedToTaxWithholdingForShareBasedCompensation",
                "cash-outflow",
                -1,
            ),
            LineSpec(
                "dividends-and-dividend-equivalents",
                "PaymentsOfDividends",
                "cash-outflow",
                -1,
            ),
            LineSpec(
                "common-stock-repurchases",
                "PaymentsForRepurchaseOfCommonStock",
                "cash-outflow",
                -1,
            ),
            LineSpec(
                "term-debt-issuance-net",
                "ProceedsFromIssuanceOfLongTermDebt",
                "cash-inflow",
            ),
            LineSpec(
                "term-debt-repayment",
                "RepaymentsOfLongTermDebt",
                "cash-outflow",
                -1,
            ),
            LineSpec(
                "commercial-paper-net",
                "ProceedsFromRepaymentsOfCommercialPaper",
                "signed-cash-flow",
            ),
            LineSpec(
                "other-financing-activities",
                "ProceedsFromPaymentsForOtherFinancingActivities",
                "signed-cash-flow",
            ),
            LineSpec(
                "cash-used-in-financing-activities",
                "NetCashProvidedByUsedInFinancingActivities",
                "section-total",
            ),
        ),
    ),
)

NET_CHANGE_SPEC = LineSpec(
    "net-change-in-cash",
    "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalentsPeriodIncreaseDecreaseIncludingExchangeRateEffect",
    "cash-change",
)
CASH_BALANCE_TAG = "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"


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
    operating_total_spec = SECTION_SPECS[0].lines[-1]
    anchor_facts, _ = _facts_for_tag(company_facts, operating_total_spec.taxonomy_tag)
    anchor = _select_anchor(anchor_facts, fiscal_year=fiscal_year)

    sections = [
        _extract_section(company_facts, section_spec, anchor.context)
        for section_spec in SECTION_SPECS
    ]
    net_change = _extract_line(company_facts, NET_CHANGE_SPEC, anchor.context)
    balance_facts, balance_label = _facts_for_tag(company_facts, CASH_BALANCE_TAG)
    beginning_date = anchor.context.start_date - timedelta(days=1)
    beginning_cash = CashBalanceFact(
        id="beginning-cash",
        taxonomyTag=CASH_BALANCE_TAG,
        taxonomyLabel=balance_label,
        value=_instant_value_for_context(
            balance_facts,
            expected_context=anchor.context,
            expected_date=beginning_date,
            taxonomy_tag=CASH_BALANCE_TAG,
        ),
        asOfDate=beginning_date,
    )
    ending_cash = CashBalanceFact(
        id="ending-cash",
        taxonomyTag=CASH_BALANCE_TAG,
        taxonomyLabel=balance_label,
        value=_instant_value_for_context(
            balance_facts,
            expected_context=anchor.context,
            expected_date=anchor.context.end_date,
            taxonomy_tag=CASH_BALANCE_TAG,
        ),
        asOfDate=anchor.context.end_date,
    )
    cash_movement = CashMovement(
        beginningCash=beginning_cash,
        netChange=net_change,
        endingCash=ending_cash,
    )
    _validate_statement(sections, cash_movement)

    return CashFlowStatement(
        fiscalYear=fiscal_year,
        startDate=anchor.context.start_date,
        endDate=anchor.context.end_date,
        currency="USD",
        form=anchor.context.form,
        filedAt=anchor.context.filed_at,
        accession=anchor.context.accession,
        sourceUrl=build_filing_index_url(cik, anchor.context.accession),
        sections=sections,
        cashMovement=cash_movement,
    )


def _extract_section(
    company_facts: dict[str, Any],
    section_spec: SectionSpec,
    context: FactContext,
) -> CashFlowSection:
    return CashFlowSection(
        id=section_spec.id,
        lines=[_extract_line(company_facts, spec, context) for spec in section_spec.lines],
    )


def _extract_line(
    company_facts: dict[str, Any],
    spec: LineSpec,
    context: FactContext,
) -> CashFlowStatementLine:
    raw_facts, taxonomy_label = _facts_for_tag(company_facts, spec.taxonomy_tag)
    source_value = _value_for_context(
        raw_facts,
        expected_context=context,
        taxonomy_tag=spec.taxonomy_tag,
    )
    return CashFlowStatementLine(
        id=spec.id,
        taxonomyTag=spec.taxonomy_tag,
        taxonomyLabel=taxonomy_label,
        value=source_value * spec.cash_effect_multiplier,
        role=spec.role,
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
        candidate = _normalize_annual_fact(raw)
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
            f"No complete FY{fiscal_year} annual cash flow context was found."
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
        if (candidate := _normalize_annual_fact(raw)) is not None
        and candidate.context == expected_context
    }
    if not values:
        raise CashFlowStatementUnavailableError(
            f"{taxonomy_tag} does not match the selected cash flow filing context."
        )
    if len(values) > 1:
        raise CashFlowStatementUnavailableError(
            f"{taxonomy_tag} contains conflicting values for the selected SEC context."
        )
    return next(iter(values))


def _instant_value_for_context(
    raw_facts: list[dict[str, Any]],
    *,
    expected_context: FactContext,
    expected_date: date,
    taxonomy_tag: str,
) -> int:
    values: set[int] = set()
    for raw in raw_facts:
        if (
            raw.get("form") not in ANNUAL_FORMS
            or raw.get("fp") != "FY"
            or raw.get("accn") != expected_context.accession
            or raw.get("form") != expected_context.form
            or raw.get("filed") != expected_context.filed_at.isoformat()
        ):
            continue
        try:
            fiscal_year = int(raw["fy"])
            fact_date = date.fromisoformat(raw["end"])
            value = raw["val"]
        except (KeyError, TypeError, ValueError):
            continue
        if (
            fiscal_year != expected_context.fiscal_year
            or fact_date != expected_date
            or isinstance(value, bool)
            or not isinstance(value, (int, float))
            or not math.isfinite(value)
        ):
            continue
        values.add(round(value))

    if not values:
        raise CashFlowStatementUnavailableError(
            f"{taxonomy_tag} does not match the selected cash flow filing context."
        )
    if len(values) > 1:
        raise CashFlowStatementUnavailableError(
            f"{taxonomy_tag} contains conflicting values for the selected SEC context."
        )
    return next(iter(values))


def _normalize_annual_fact(raw: dict[str, Any]) -> NormalizedFact | None:
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


def _validate_statement(
    sections: list[CashFlowSection], cash_movement: CashMovement
) -> None:
    for section in sections:
        if sum(line.value for line in section.lines[:-1]) != section.lines[-1].value:
            raise CashFlowStatementUnavailableError(
                f"{section.id.title()} section lines must reconcile exactly to the reported total."
            )

    if sum(section.lines[-1].value for section in sections) != cash_movement.net_change.value:
        raise CashFlowStatementUnavailableError(
            "Cash flow activity totals must reconcile exactly to the reported net change in cash."
        )
    if (
        cash_movement.beginning_cash.value + cash_movement.net_change.value
        != cash_movement.ending_cash.value
    ):
        raise CashFlowStatementUnavailableError(
            "Reported beginning cash plus net change must reconcile exactly to ending cash."
        )
