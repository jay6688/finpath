from dataclasses import dataclass
from datetime import date
from typing import Any

from app.schemas.company import (
    BalanceSheet,
    BalanceSheetLineId,
    BalanceSheetLineRole,
    DerivedBalanceSheetLine,
    DerivedBalanceSheetMeasure,
    ReportedBalanceSheetLine,
)
from app.services.sec.provenance import build_filing_index_url


ANNUAL_FORMS = {"10-K", "10-K/A"}


class BalanceSheetUnavailableError(ValueError):
    pass


@dataclass(frozen=True)
class InstantFactContext:
    fiscal_year: int
    as_of_date: date
    form: str
    filed_at: date
    accession: str


@dataclass(frozen=True)
class ReportedLineSpec:
    id: BalanceSheetLineId
    taxonomy_tag: str
    reported_label: str
    role: BalanceSheetLineRole


@dataclass(frozen=True)
class DerivedLineSpec:
    id: BalanceSheetLineId
    label: str
    role: BalanceSheetLineRole
    formula: str
    inputs: tuple[ReportedLineSpec, ...]


@dataclass(frozen=True)
class BalanceSheetProfile:
    context: InstantFactContext
    statement_name: str
    assets: ReportedLineSpec
    liabilities: ReportedLineSpec | DerivedLineSpec
    other_claims: tuple[ReportedLineSpec, ...]
    equity: ReportedLineSpec
    cash_and_cash_equivalents: ReportedLineSpec
    supplemental_financial_assets: tuple[ReportedLineSpec, ...]
    borrowing_inputs: tuple[ReportedLineSpec, ...]


ASSETS = ReportedLineSpec("total-assets", "Assets", "Total assets", "assets")
CASH = ReportedLineSpec(
    "cash-and-cash-equivalents",
    "CashAndCashEquivalentsAtCarryingValue",
    "Cash and cash equivalents",
    "supporting-fact",
)

BALANCE_SHEET_PROFILES = {
    ("0000320193", 2025): BalanceSheetProfile(
        context=InstantFactContext(
            fiscal_year=2025,
            as_of_date=date(2025, 9, 27),
            form="10-K",
            filed_at=date(2025, 10, 31),
            accession="0000320193-25-000079",
        ),
        statement_name="Consolidated Balance Sheets",
        assets=ASSETS,
        liabilities=ReportedLineSpec(
            "total-liabilities", "Liabilities", "Total liabilities", "liabilities"
        ),
        other_claims=(),
        equity=ReportedLineSpec(
            "shareholders-equity",
            "StockholdersEquity",
            "Total shareholders’ equity",
            "equity",
        ),
        cash_and_cash_equivalents=CASH,
        supplemental_financial_assets=(
            ReportedLineSpec(
                "current-marketable-securities",
                "MarketableSecuritiesCurrent",
                "Current marketable securities",
                "supplemental-financial-asset",
            ),
            ReportedLineSpec(
                "noncurrent-marketable-securities",
                "MarketableSecuritiesNoncurrent",
                "Non-current marketable securities",
                "supplemental-financial-asset",
            ),
        ),
        borrowing_inputs=(
            ReportedLineSpec(
                "commercial-paper",
                "CommercialPaper",
                "Commercial paper",
                "borrowing-component",
            ),
            ReportedLineSpec(
                "current-term-debt",
                "LongTermDebtCurrent",
                "Current term debt",
                "borrowing-component",
            ),
            ReportedLineSpec(
                "noncurrent-term-debt",
                "LongTermDebtNoncurrent",
                "Non-current term debt",
                "borrowing-component",
            ),
        ),
    ),
    ("0000789019", 2026): BalanceSheetProfile(
        context=InstantFactContext(
            fiscal_year=2026,
            as_of_date=date(2026, 6, 30),
            form="10-K",
            filed_at=date(2026, 7, 29),
            accession="0001193125-26-323660",
        ),
        statement_name="Balance Sheets",
        assets=ASSETS,
        liabilities=ReportedLineSpec(
            "total-liabilities", "Liabilities", "Total liabilities", "liabilities"
        ),
        other_claims=(),
        equity=ReportedLineSpec(
            "shareholders-equity",
            "StockholdersEquity",
            "Total stockholders’ equity",
            "equity",
        ),
        cash_and_cash_equivalents=CASH,
        supplemental_financial_assets=(
            ReportedLineSpec(
                "short-term-investments",
                "ShortTermInvestments",
                "Short-term investments",
                "supplemental-financial-asset",
            ),
        ),
        borrowing_inputs=(
            ReportedLineSpec(
                "current-portion-long-term-debt",
                "LongTermDebtCurrent",
                "Current portion of long-term debt",
                "borrowing-component",
            ),
            ReportedLineSpec(
                "long-term-debt",
                "LongTermDebtNoncurrent",
                "Long-term debt",
                "borrowing-component",
            ),
        ),
    ),
    ("0000104169", 2026): BalanceSheetProfile(
        context=InstantFactContext(
            fiscal_year=2026,
            as_of_date=date(2026, 1, 31),
            form="10-K",
            filed_at=date(2026, 3, 13),
            accession="0000104169-26-000055",
        ),
        statement_name="Consolidated Balance Sheets",
        assets=ASSETS,
        liabilities=DerivedLineSpec(
            id="total-liabilities",
            label="Liabilities",
            role="liabilities",
            formula=(
                "Total current liabilities + Long-term debt + Long-term operating "
                "lease obligations + Long-term finance lease obligations + "
                "Deferred income taxes and other"
            ),
            inputs=(
                ReportedLineSpec(
                    "current-liabilities",
                    "LiabilitiesCurrent",
                    "Total current liabilities",
                    "liability-component",
                ),
                ReportedLineSpec(
                    "long-term-debt",
                    "LongTermDebtNoncurrent",
                    "Long-term debt",
                    "liability-component",
                ),
                ReportedLineSpec(
                    "long-term-operating-lease-obligations",
                    "OperatingLeaseLiabilityNoncurrent",
                    "Long-term operating lease obligations",
                    "liability-component",
                ),
                ReportedLineSpec(
                    "long-term-finance-lease-obligations",
                    "FinanceLeaseLiabilityNoncurrent",
                    "Long-term finance lease obligations",
                    "liability-component",
                ),
                ReportedLineSpec(
                    "deferred-income-taxes-and-other",
                    "DeferredIncomeTaxesAndOtherLiabilitiesNoncurrent",
                    "Deferred income taxes and other",
                    "liability-component",
                ),
            ),
        ),
        other_claims=(
            ReportedLineSpec(
                "redeemable-noncontrolling-interest",
                "RedeemableNoncontrollingInterestEquityCarryingAmount",
                "Redeemable noncontrolling interest",
                "other-claim",
            ),
        ),
        equity=ReportedLineSpec(
            "shareholders-equity",
            "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest",
            "Total shareholders’ equity",
            "equity",
        ),
        cash_and_cash_equivalents=CASH,
        supplemental_financial_assets=(),
        borrowing_inputs=(
            ReportedLineSpec(
                "short-term-borrowings",
                "ShortTermBorrowings",
                "Short-term borrowings",
                "borrowing-component",
            ),
            ReportedLineSpec(
                "long-term-debt-due-within-one-year",
                "LongTermDebtCurrent",
                "Long-term debt due within one year",
                "borrowing-component",
            ),
            ReportedLineSpec(
                "long-term-debt",
                "LongTermDebtNoncurrent",
                "Long-term debt",
                "borrowing-component",
            ),
        ),
    ),
}


def extract_balance_sheet(
    company_facts: dict[str, Any], *, cik: str, fiscal_year: int
) -> BalanceSheet:
    normalized_cik = cik.zfill(10)
    try:
        payload_cik = str(int(company_facts["cik"])).zfill(10)
    except (KeyError, TypeError, ValueError):
        raise BalanceSheetUnavailableError(
            "Company Facts does not contain a valid company CIK."
        ) from None
    if payload_cik != normalized_cik:
        raise BalanceSheetUnavailableError(
            "Company Facts does not match the reviewed company CIK."
        )

    profile = _profile_for(cik=cik, fiscal_year=fiscal_year)
    assets = _reported_line(company_facts, profile.assets, profile.context)
    liabilities = _liabilities_line(
        company_facts, profile.liabilities, profile.context
    )
    other_claims = [
        _reported_line(company_facts, spec, profile.context)
        for spec in profile.other_claims
    ]
    equity = _reported_line(company_facts, profile.equity, profile.context)
    cash = _reported_line(
        company_facts, profile.cash_and_cash_equivalents, profile.context
    )
    supplemental_financial_assets = [
        _reported_line(company_facts, spec, profile.context)
        for spec in profile.supplemental_financial_assets
    ]
    borrowing_inputs = [
        _reported_line(company_facts, spec, profile.context)
        for spec in profile.borrowing_inputs
    ]
    simple_borrowings = DerivedBalanceSheetMeasure(
        id="simple-borrowings",
        label="FinPath simple borrowings",
        value=sum(line.value for line in borrowing_inputs),
        formula=" + ".join(line.reported_label for line in borrowing_inputs),
        definition="The sum of the reviewed borrowing lines used in this lesson.",
        inputs=borrowing_inputs,
    )

    claims_total = (
        liabilities.value
        + sum(line.value for line in other_claims)
        + equity.value
    )
    if assets.value != claims_total:
        raise BalanceSheetUnavailableError(
            "Assets must reconcile exactly to liabilities, other claims, and equity."
        )

    return BalanceSheet(
        fiscalYear=profile.context.fiscal_year,
        asOfDate=profile.context.as_of_date,
        currency="USD",
        form=profile.context.form,
        filedAt=profile.context.filed_at,
        accession=profile.context.accession,
        sourceUrl=build_filing_index_url(cik, profile.context.accession),
        statementName=profile.statement_name,
        assets=assets,
        liabilities=liabilities,
        otherClaims=other_claims,
        equity=equity,
        cashAndCashEquivalents=cash,
        supplementalFinancialAssets=supplemental_financial_assets,
        simpleBorrowings=simple_borrowings,
    )


def _profile_for(*, cik: str, fiscal_year: int) -> BalanceSheetProfile:
    normalized_cik = cik.zfill(10)
    try:
        return BALANCE_SHEET_PROFILES[(normalized_cik, fiscal_year)]
    except KeyError:
        raise BalanceSheetUnavailableError(
            f"Balance Sheet profile for CIK {normalized_cik} FY{fiscal_year} is unavailable."
        ) from None


def _liabilities_line(
    company_facts: dict[str, Any],
    spec: ReportedLineSpec | DerivedLineSpec,
    context: InstantFactContext,
) -> ReportedBalanceSheetLine | DerivedBalanceSheetLine:
    if isinstance(spec, ReportedLineSpec):
        return _reported_line(company_facts, spec, context)

    inputs = [
        _reported_line(company_facts, input_spec, context)
        for input_spec in spec.inputs
    ]
    return DerivedBalanceSheetLine(
        id="total-liabilities",
        label="Liabilities",
        value=sum(line.value for line in inputs),
        role="liabilities",
        formula=spec.formula,
        inputs=inputs,
    )


def _reported_line(
    company_facts: dict[str, Any],
    spec: ReportedLineSpec,
    context: InstantFactContext,
) -> ReportedBalanceSheetLine:
    facts, taxonomy_label = _facts_for_tag(company_facts, spec.taxonomy_tag)
    values = {
        normalized_value
        for raw in facts
        if (normalized := _normalize_instant_fact(raw)) is not None
        and normalized[0] == context
        for normalized_value in [normalized[1]]
    }
    if not values:
        raise BalanceSheetUnavailableError(
            f"{spec.taxonomy_tag} does not match the reviewed instant context."
        )
    if len(values) > 1:
        raise BalanceSheetUnavailableError(
            f"{spec.taxonomy_tag} contains conflicting values for the reviewed instant context."
        )

    return ReportedBalanceSheetLine(
        id=spec.id,
        taxonomyTag=spec.taxonomy_tag,
        taxonomyLabel=taxonomy_label,
        reportedLabel=spec.reported_label,
        value=next(iter(values)),
        role=spec.role,
    )


def _facts_for_tag(
    company_facts: dict[str, Any], taxonomy_tag: str
) -> tuple[list[dict[str, Any]], str]:
    try:
        concept = company_facts["facts"]["us-gaap"][taxonomy_tag]
        facts = concept["units"]["USD"]
    except (KeyError, TypeError):
        raise BalanceSheetUnavailableError(
            f"Required instant USD fact {taxonomy_tag} is unavailable."
        ) from None

    if not isinstance(facts, list):
        raise BalanceSheetUnavailableError(
            f"Required instant USD fact {taxonomy_tag} is unavailable."
        )
    taxonomy_label = concept.get("label")
    if not isinstance(taxonomy_label, str) or not taxonomy_label.strip():
        taxonomy_label = taxonomy_tag
    return facts, taxonomy_label.strip()


def _normalize_instant_fact(
    raw: dict[str, Any],
) -> tuple[InstantFactContext, int] | None:
    if raw.get("form") not in ANNUAL_FORMS or raw.get("fp") != "FY":
        return None
    if "start" in raw:
        return None

    try:
        context = InstantFactContext(
            fiscal_year=int(raw["fy"]),
            as_of_date=date.fromisoformat(raw["end"]),
            form=str(raw["form"]),
            filed_at=date.fromisoformat(raw["filed"]),
            accession=str(raw["accn"]),
        )
        value = raw["val"]
    except (KeyError, TypeError, ValueError):
        return None

    if isinstance(value, bool) or not isinstance(value, int):
        return None
    return context, value
