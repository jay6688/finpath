from datetime import date, datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


class ApiModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class CompanyIdentity(ApiModel):
    ticker: str
    name: str
    cik: str

    @field_validator("ticker")
    @classmethod
    def normalize_ticker(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("cik")
    @classmethod
    def validate_cik(cls, value: str) -> str:
        normalized = value.strip().zfill(10)
        if not normalized.isdigit() or len(normalized) != 10:
            raise ValueError("CIK must contain ten digits")
        return normalized


class CompanyCapabilities(ApiModel):
    revenue: bool
    revenue_growth: bool = Field(alias="revenueGrowth")
    income_statement: bool = Field(alias="incomeStatement")
    cash_flow: bool = Field(alias="cashFlow")
    balance_sheet: bool = Field(alias="balanceSheet")


class SupportedCompanySummary(ApiModel):
    slug: str
    ticker: str
    name: str
    cik: str
    reviewed_fiscal_year: int = Field(alias="reviewedFiscalYear")
    capabilities: CompanyCapabilities


class SupportedCompaniesResponse(ApiModel):
    companies: list[SupportedCompanySummary]


class MetricMetadata(ApiModel):
    id: Literal["revenue"]
    label: Literal["Revenue"]
    currency: Literal["USD"]
    taxonomy_tag: str = Field(alias="taxonomyTag")


class AnnualFinancialFact(ApiModel):
    fiscal_year: int = Field(alias="fiscalYear")
    start_date: date = Field(alias="startDate")
    end_date: date = Field(alias="endDate")
    value: int
    form: Literal["10-K", "10-K/A"]
    filed_at: date = Field(alias="filedAt")
    accession: str
    source_url: HttpUrl = Field(alias="sourceUrl")

    @field_validator("source_url")
    @classmethod
    def require_sec_filing_url(cls, value: HttpUrl) -> HttpUrl:
        if value.host not in {"sec.gov", "www.sec.gov"}:
            raise ValueError("sourceUrl must point to an SEC host")
        if "/Archives/edgar/data/" not in value.path:
            raise ValueError("sourceUrl must point to an EDGAR filing")
        return value


IncomeStatementLineId = Literal[
    "total-net-sales",
    "total-cost-of-sales",
    "gross-margin",
    "total-operating-expenses",
    "operating-income",
    "other-income-expense-net",
    "income-before-income-taxes",
    "income-tax-provision",
    "net-income",
]

IncomeStatementLineRole = Literal[
    "starting-line",
    "deduction",
    "subtotal",
    "signed-adjustment",
    "final-total",
]


class IncomeStatementLine(ApiModel):
    id: IncomeStatementLineId
    taxonomy_tag: str = Field(alias="taxonomyTag")
    taxonomy_label: str = Field(alias="taxonomyLabel")
    value: int
    role: IncomeStatementLineRole


class IncomeStatement(ApiModel):
    fiscal_year: int = Field(alias="fiscalYear")
    start_date: date = Field(alias="startDate")
    end_date: date = Field(alias="endDate")
    currency: Literal["USD"]
    form: Literal["10-K", "10-K/A"]
    filed_at: date = Field(alias="filedAt")
    accession: str
    source_url: HttpUrl = Field(alias="sourceUrl")
    lines: list[IncomeStatementLine]

    @field_validator("source_url")
    @classmethod
    def require_sec_filing_url(cls, value: HttpUrl) -> HttpUrl:
        if value.host not in {"sec.gov", "www.sec.gov"}:
            raise ValueError("sourceUrl must point to an SEC host")
        if "/Archives/edgar/data/" not in value.path:
            raise ValueError("sourceUrl must point to an EDGAR filing")
        return value


CashFlowStatementLineId = Literal[
    "net-income",
    "depreciation-and-amortization",
    "share-based-compensation-expense",
    "other",
    "accounts-receivable-net",
    "vendor-non-trade-receivables",
    "inventories",
    "other-current-and-non-current-assets",
    "accounts-payable",
    "other-current-and-non-current-liabilities",
    "cash-generated-by-operating-activities",
    "purchases-of-marketable-securities",
    "maturities-of-marketable-securities",
    "sales-of-marketable-securities",
    "payments-for-property-plant-and-equipment",
    "other-investing-activities",
    "cash-generated-by-investing-activities",
    "taxes-related-to-net-share-settlement",
    "dividends-and-dividend-equivalents",
    "common-stock-repurchases",
    "term-debt-issuance-net",
    "term-debt-repayment",
    "commercial-paper-net",
    "other-financing-activities",
    "cash-used-in-financing-activities",
    "net-change-in-cash",
]

CashFlowStatementLineRole = Literal[
    "starting-line",
    "non-cash-adjustment",
    "operating-timing-adjustment",
    "cash-inflow",
    "cash-outflow",
    "signed-cash-flow",
    "section-total",
    "cash-change",
    "final-total",
]

CashFlowSectionId = Literal["operating", "investing", "financing"]


class CashFlowStatementLine(ApiModel):
    id: CashFlowStatementLineId
    taxonomy_tag: str = Field(alias="taxonomyTag")
    taxonomy_label: str = Field(alias="taxonomyLabel")
    value: int
    role: CashFlowStatementLineRole


class CashFlowSection(ApiModel):
    id: CashFlowSectionId
    lines: list[CashFlowStatementLine]


class CashBalanceFact(ApiModel):
    id: Literal["beginning-cash", "ending-cash"]
    taxonomy_tag: str = Field(alias="taxonomyTag")
    taxonomy_label: str = Field(alias="taxonomyLabel")
    value: int
    as_of_date: date = Field(alias="asOfDate")


class CashMovement(ApiModel):
    beginning_cash: CashBalanceFact = Field(alias="beginningCash")
    net_change: CashFlowStatementLine = Field(alias="netChange")
    ending_cash: CashBalanceFact = Field(alias="endingCash")


class CashFlowStatement(ApiModel):
    fiscal_year: int = Field(alias="fiscalYear")
    start_date: date = Field(alias="startDate")
    end_date: date = Field(alias="endDate")
    currency: Literal["USD"]
    form: Literal["10-K", "10-K/A"]
    filed_at: date = Field(alias="filedAt")
    accession: str
    source_url: HttpUrl = Field(alias="sourceUrl")
    sections: list[CashFlowSection]
    cash_movement: CashMovement = Field(alias="cashMovement")

    @field_validator("source_url")
    @classmethod
    def require_sec_filing_url(cls, value: HttpUrl) -> HttpUrl:
        if value.host not in {"sec.gov", "www.sec.gov"}:
            raise ValueError("sourceUrl must point to an SEC host")
        if "/Archives/edgar/data/" not in value.path:
            raise ValueError("sourceUrl must point to an EDGAR filing")
        return value


class DataState(StrEnum):
    LIVE = "live"
    CACHED = "cached"
    STALE = "stale"


class DataStatus(ApiModel):
    state: DataState
    retrieved_at: datetime = Field(alias="retrievedAt")


class CompanyOverviewResponse(ApiModel):
    company: CompanyIdentity
    metric: MetricMetadata
    series: list[AnnualFinancialFact]
    data_status: DataStatus = Field(alias="dataStatus")


class CompanyIncomeStatementResponse(ApiModel):
    company: CompanyIdentity
    statement: IncomeStatement
    data_status: DataStatus = Field(alias="dataStatus")


class CompanyCashFlowStatementResponse(ApiModel):
    company: CompanyIdentity
    statement: CashFlowStatement
    data_status: DataStatus = Field(alias="dataStatus")


BalanceSheetLineId = Literal[
    "total-assets",
    "total-liabilities",
    "current-liabilities",
    "long-term-debt",
    "long-term-operating-lease-obligations",
    "long-term-finance-lease-obligations",
    "deferred-income-taxes-and-other",
    "redeemable-noncontrolling-interest",
    "shareholders-equity",
    "cash-and-cash-equivalents",
]

BalanceSheetLineRole = Literal[
    "assets",
    "liabilities",
    "liability-component",
    "other-claim",
    "equity",
    "supporting-fact",
]


class ReportedBalanceSheetLine(ApiModel):
    evidence_kind: Literal["reported"] = Field(
        default="reported", alias="evidenceKind"
    )
    id: BalanceSheetLineId
    taxonomy_tag: str = Field(alias="taxonomyTag")
    taxonomy_label: str = Field(alias="taxonomyLabel")
    reported_label: str = Field(alias="reportedLabel")
    value: int
    role: BalanceSheetLineRole


class DerivedBalanceSheetLine(ApiModel):
    evidence_kind: Literal["derived"] = Field(
        default="derived", alias="evidenceKind"
    )
    id: Literal["total-liabilities"]
    label: Literal["Liabilities"]
    value: int
    role: Literal["liabilities"]
    formula: str
    inputs: list[ReportedBalanceSheetLine]


class BalanceSheet(ApiModel):
    fiscal_year: int = Field(alias="fiscalYear")
    as_of_date: date = Field(alias="asOfDate")
    currency: Literal["USD"]
    form: Literal["10-K", "10-K/A"]
    filed_at: date = Field(alias="filedAt")
    accession: str
    source_url: HttpUrl = Field(alias="sourceUrl")
    statement_name: str = Field(alias="statementName")
    assets: ReportedBalanceSheetLine
    liabilities: ReportedBalanceSheetLine | DerivedBalanceSheetLine
    other_claims: list[ReportedBalanceSheetLine] = Field(alias="otherClaims")
    equity: ReportedBalanceSheetLine
    cash_and_cash_equivalents: ReportedBalanceSheetLine = Field(
        alias="cashAndCashEquivalents"
    )

    @field_validator("source_url")
    @classmethod
    def require_sec_filing_url(cls, value: HttpUrl) -> HttpUrl:
        if value.host not in {"sec.gov", "www.sec.gov"}:
            raise ValueError("sourceUrl must point to an SEC host")
        if "/Archives/edgar/data/" not in value.path:
            raise ValueError("sourceUrl must point to an EDGAR filing")
        return value


class CompanyBalanceSheetResponse(ApiModel):
    company: CompanyIdentity
    statement: BalanceSheet
    data_status: DataStatus = Field(alias="dataStatus")
