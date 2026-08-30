from dataclasses import dataclass
from datetime import date
import math
from typing import Any

from app.schemas.company import (
    IncomeStatement,
    IncomeStatementLine,
    IncomeStatementLineId,
    IncomeStatementLineRole,
)
from app.services.sec.provenance import build_filing_index_url


ANNUAL_FORMS = {"10-K", "10-K/A"}
MIN_ANNUAL_DAYS = 300
MAX_ANNUAL_DAYS = 430


class IncomeStatementUnavailableError(ValueError):
    pass


@dataclass(frozen=True)
class LineSpec:
    id: IncomeStatementLineId
    taxonomy_tag: str
    role: IncomeStatementLineRole


LINE_SPECS = (
    LineSpec(
        id="total-net-sales",
        taxonomy_tag="RevenueFromContractWithCustomerExcludingAssessedTax",
        role="starting-line",
    ),
    LineSpec(
        id="total-cost-of-sales",
        taxonomy_tag="CostOfGoodsAndServicesSold",
        role="deduction",
    ),
    LineSpec(
        id="gross-margin",
        taxonomy_tag="GrossProfit",
        role="subtotal",
    ),
    LineSpec(
        id="total-operating-expenses",
        taxonomy_tag="OperatingExpenses",
        role="deduction",
    ),
    LineSpec(
        id="operating-income",
        taxonomy_tag="OperatingIncomeLoss",
        role="subtotal",
    ),
    LineSpec(
        id="other-income-expense-net",
        taxonomy_tag="NonoperatingIncomeExpense",
        role="signed-adjustment",
    ),
    LineSpec(
        id="income-before-income-taxes",
        taxonomy_tag=(
            "IncomeLossFromContinuingOperationsBeforeIncomeTaxes"
            "ExtraordinaryItemsNoncontrollingInterest"
        ),
        role="subtotal",
    ),
    LineSpec(
        id="income-tax-provision",
        taxonomy_tag="IncomeTaxExpenseBenefit",
        role="deduction",
    ),
    LineSpec(
        id="net-income",
        taxonomy_tag="NetIncomeLoss",
        role="final-total",
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


def extract_income_statement(
    company_facts: dict[str, Any],
    *,
    cik: str,
    fiscal_year: int,
) -> IncomeStatement:
    anchor_spec = LINE_SPECS[0]
    anchor_facts, _ = _facts_for_tag(company_facts, anchor_spec.taxonomy_tag)
    anchor = _select_anchor(anchor_facts, fiscal_year=fiscal_year)

    lines: list[IncomeStatementLine] = []
    for spec in LINE_SPECS:
        raw_facts, taxonomy_label = _facts_for_tag(
            company_facts,
            spec.taxonomy_tag,
        )
        value = _value_for_context(
            raw_facts,
            expected_context=anchor.context,
            taxonomy_tag=spec.taxonomy_tag,
        )
        lines.append(
            IncomeStatementLine(
                id=spec.id,
                taxonomyTag=spec.taxonomy_tag,
                taxonomyLabel=taxonomy_label,
                value=value,
                role=spec.role,
            )
        )

    _validate_reconciliation(lines)

    return IncomeStatement(
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
    company_facts: dict[str, Any],
    taxonomy_tag: str,
) -> tuple[list[dict[str, Any]], str]:
    try:
        concept = company_facts["facts"]["us-gaap"][taxonomy_tag]
        facts = concept["units"]["USD"]
    except (KeyError, TypeError):
        raise IncomeStatementUnavailableError(
            f"Required annual USD fact {taxonomy_tag} is unavailable."
        ) from None

    if not isinstance(facts, list):
        raise IncomeStatementUnavailableError(
            f"Required annual USD fact {taxonomy_tag} is unavailable."
        )

    taxonomy_label = concept.get("label")
    if not isinstance(taxonomy_label, str) or not taxonomy_label.strip():
        taxonomy_label = taxonomy_tag

    return facts, taxonomy_label.strip()


def _select_anchor(
    raw_facts: list[dict[str, Any]],
    *,
    fiscal_year: int,
) -> NormalizedFact:
    by_context: dict[FactContext, set[int]] = {}

    for raw in raw_facts:
        candidate = _normalize_fact(raw)
        if candidate is None or candidate.context.fiscal_year != fiscal_year:
            continue
        by_context.setdefault(candidate.context, set()).add(candidate.value)

    conflicts = [context for context, values in by_context.items() if len(values) > 1]
    if conflicts:
        raise IncomeStatementUnavailableError(
            "Revenue contains conflicting values for the same SEC context."
        )

    candidates = [
        NormalizedFact(context=context, value=next(iter(values)))
        for context, values in by_context.items()
    ]
    if not candidates:
        raise IncomeStatementUnavailableError(
            f"No complete FY{fiscal_year} annual Revenue context was found."
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
        raise IncomeStatementUnavailableError(
            f"{taxonomy_tag} does not match the selected Revenue filing context."
        )
    if len(values) > 1:
        raise IncomeStatementUnavailableError(
            f"{taxonomy_tag} contains conflicting values for the selected SEC context."
        )

    return next(iter(values))


def _normalize_fact(raw: dict[str, Any]) -> NormalizedFact | None:
    if raw.get("form") not in ANNUAL_FORMS or raw.get("fp") != "FY":
        return None

    try:
        fiscal_year = int(raw["fy"])
        start_date = date.fromisoformat(raw["start"])
        end_date = date.fromisoformat(raw["end"])
        filed_at = date.fromisoformat(raw["filed"])
        value = raw["val"]
        accession = str(raw["accn"])
    except (KeyError, TypeError, ValueError):
        return None

    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    if not math.isfinite(value):
        return None

    duration_days = (end_date - start_date).days
    if not MIN_ANNUAL_DAYS <= duration_days <= MAX_ANNUAL_DAYS:
        return None

    return NormalizedFact(
        context=FactContext(
            fiscal_year=fiscal_year,
            start_date=start_date,
            end_date=end_date,
            form=str(raw["form"]),
            filed_at=filed_at,
            accession=accession,
        ),
        value=round(value),
    )


def _validate_reconciliation(lines: list[IncomeStatementLine]) -> None:
    values = {line.id: line.value for line in lines}
    checks = (
        (
            values["total-net-sales"] - values["total-cost-of-sales"],
            values["gross-margin"],
            "Revenue minus cost of sales must equal Gross margin.",
        ),
        (
            values["gross-margin"] - values["total-operating-expenses"],
            values["operating-income"],
            "Gross margin minus operating expenses must equal Operating income.",
        ),
        (
            values["operating-income"] + values["other-income-expense-net"],
            values["income-before-income-taxes"],
            "Operating income plus other income or expense must equal income before tax.",
        ),
        (
            values["income-before-income-taxes"]
            - values["income-tax-provision"],
            values["net-income"],
            "Income before tax minus the tax provision must equal Net income.",
        ),
    )

    for calculated, reported, message in checks:
        if calculated != reported:
            raise IncomeStatementUnavailableError(message)
