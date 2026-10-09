import {
  getCompanyBalanceSheet,
  getCompanyCashFlowStatement,
  getCompanyEarningsPerShare,
  getCompanyIncomeStatement,
  getCompanyOverview,
  getCompanySharesOutstanding,
  type CompanyBalanceSheet,
  type CompanyCashFlowStatement,
  type CompanyEarningsPerShare,
  type CompanyIncomeStatement,
  type CompanyOverview,
  type CompanySharesOutstanding,
  type DataState,
} from "./api.ts";
import {
  buildBalanceSheetEvidence,
  type BalanceSheetEvidence,
} from "./balance-sheet-learning.ts";
import {
  deriveSimpleFreeCashFlow,
  validateCompleteCashFlowStatement,
} from "./cash-flow-learning.ts";
import {
  getBusinessModelProfile,
  type BusinessModelProfile,
} from "../content/business-models/index.ts";
import {
  buildFreeCashFlowEvidence,
  buildNetProfitMarginEvidence,
  buildReportedEvidence,
  buildRevenueGrowthEvidence,
  reportedFactFromStatementLine,
  type DerivedEvidence,
  type ReportedEvidence,
} from "./evidence.ts";
import { validateEarningsPerShareForLesson } from "./earnings-per-share.ts";
import {
  buildRevenueGrowthRows,
  type RevenueGrowthRow,
} from "./history-insight.ts";
import { validateSharesOutstandingForLesson } from "./market-cap-learning.ts";
import { deriveNetProfitMargin } from "./profit-margin.ts";
import { validateProfitStatementForLesson } from "./profit-learning.ts";
import {
  buildThreeStatementConnectionData,
  type StatementConnection,
} from "./three-statements.ts";

const APPLE_CAPSTONE = {
  slug: "aapl",
  ticker: "AAPL",
  name: "Apple Inc.",
  cik: "0000320193",
  reviewedFiscalYear: 2025,
  accession: "0000320193-25-000079",
  startDate: "2024-09-29",
  endDate: "2025-09-27",
  filedAt: "2025-10-31",
  sharesAsOfDate: "2025-10-17",
} as const;

export class CapstoneDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CapstoneDataError";
  }
}

export type CapstoneInputs = {
  businessProfile: BusinessModelProfile;
  overview: CompanyOverview;
  incomeStatement: CompanyIncomeStatement;
  cashFlowStatement: CompanyCashFlowStatement;
  balanceSheet: CompanyBalanceSheet;
  earningsPerShare: CompanyEarningsPerShare;
  sharesOutstanding: CompanySharesOutstanding;
};

export type CapstoneEvidenceProvenance =
  | "reported"
  | "reviewed"
  | "finpath-derived";

export type CapstoneEvidenceRecord = {
  id: string;
  questionId:
    | "revenue-origin"
    | "period-performance"
    | "profit-to-cash"
    | "financial-position"
    | "per-share-valuation";
  label: string;
  displayValue: string;
  provenance: CapstoneEvidenceProvenance;
  recordType:
    | "Narrative Evidence Record"
    | "Number Passport"
    | "Derivation Passport";
  inspection:
    | { kind: "narrative"; evidenceIds: string[] }
    | { kind: "financial"; evidence: ReportedEvidence | DerivedEvidence }
    | { kind: "eps"; response: CompanyEarningsPerShare }
    | { kind: "shares"; response: CompanySharesOutstanding };
};

export type CapstoneCasebookQuestion = {
  id: CapstoneEvidenceRecord["questionId"];
  number: number;
  question: string;
  prompt: string;
  evidence: CapstoneEvidenceRecord[];
  unknowns: Array<{
    id: string;
    provenance: "unknown";
    label: string;
  }>;
};

export type CapstoneData = {
  company: Pick<BusinessModelProfile["company"], "slug" | "ticker" | "name" | "cik">;
  filing: {
    fiscalYear: number;
    startDate: string;
    endDate: string;
    asOfDate: string;
    form: "10-K" | "10-K/A";
    filedAt: string;
    accession: string;
    sourceUrl: string;
  };
  business: {
    kind: "narrative";
    profile: BusinessModelProfile;
  };
  performance: {
    revenue: ReportedEvidence;
    netIncome: ReportedEvidence;
    netProfitMargin: DerivedEvidence;
    revenueGrowth?: DerivedEvidence;
  };
  cash: {
    operatingCashFlow: ReportedEvidence;
    freeCashFlow: DerivedEvidence;
    activityEvidence: {
      operating: ReportedEvidence;
      investing: ReportedEvidence;
      financing: ReportedEvidence;
      reportedChange: ReportedEvidence;
      beginningBalance: ReportedEvidence;
      endingBalance: ReportedEvidence;
    };
  };
  financialPosition: {
    assets: BalanceSheetEvidence["assets"];
    liabilities: BalanceSheetEvidence["liabilities"];
    equity: BalanceSheetEvidence["equity"];
    cash: BalanceSheetEvidence["cashAndCashEquivalents"];
    simpleBorrowings: BalanceSheetEvidence["simpleBorrowings"];
  };
  perShare: {
    dilutedEps: {
      kind: "reported";
      value: string;
      response: CompanyEarningsPerShare;
    };
    sharesOutstanding: {
      kind: "reported";
      value: number;
      asOfDate: string;
      response: CompanySharesOutstanding;
    };
  };
  valuation: {
    kind: "not-assessed";
    status: "Not assessed from verified market evidence";
    reason: string;
  };
  connections: StatementConnection[];
  casebook: CapstoneCasebookQuestion[];
  evidenceCatalog: CapstoneEvidenceRecord[];
  dataStatuses: Array<{
    source: string;
    state: DataState;
    retrievedAt: string;
  }>;
};

export async function getCapstoneData(): Promise<CapstoneData> {
  const [
    overview,
    incomeStatement,
    cashFlowStatement,
    balanceSheet,
    earningsPerShare,
    sharesOutstanding,
  ] = await Promise.all([
    getCompanyOverview(APPLE_CAPSTONE.ticker),
    getCompanyIncomeStatement(
      APPLE_CAPSTONE.ticker,
      APPLE_CAPSTONE.reviewedFiscalYear,
    ),
    getCompanyCashFlowStatement(
      APPLE_CAPSTONE.ticker,
      APPLE_CAPSTONE.reviewedFiscalYear,
    ),
    getCompanyBalanceSheet(
      APPLE_CAPSTONE.ticker,
      APPLE_CAPSTONE.reviewedFiscalYear,
    ),
    getCompanyEarningsPerShare(
      APPLE_CAPSTONE.ticker,
      APPLE_CAPSTONE.reviewedFiscalYear,
    ),
    getCompanySharesOutstanding(
      APPLE_CAPSTONE.ticker,
      APPLE_CAPSTONE.reviewedFiscalYear,
    ),
  ]);

  return buildCapstoneData({
    businessProfile: getBusinessModelProfile(APPLE_CAPSTONE.ticker),
    overview,
    incomeStatement,
    cashFlowStatement,
    balanceSheet,
    earningsPerShare,
    sharesOutstanding,
  });
}

export function buildCapstoneData(inputs: CapstoneInputs): CapstoneData {
  try {
    return buildValidatedCapstone(inputs);
  } catch (error) {
    if (error instanceof CapstoneDataError) throw error;
    throw new CapstoneDataError(
      error instanceof Error
        ? error.message
        : "The reviewed Capstone evidence package could not be validated.",
    );
  }
}

function buildValidatedCapstone({
  businessProfile,
  overview,
  incomeStatement,
  cashFlowStatement,
  balanceSheet,
  earningsPerShare,
  sharesOutstanding,
}: CapstoneInputs): CapstoneData {
  validateBusinessProfile(businessProfile);
  validateOverview(overview);
  validateDataStatus("Revenue", overview.dataStatus);
  validateDataStatus("Income Statement", incomeStatement.dataStatus);
  validateDataStatus("Cash Flow Statement", cashFlowStatement.dataStatus);
  validateDataStatus("Balance Sheet", balanceSheet.dataStatus);
  validateDataStatus("EPS", earningsPerShare.dataStatus);
  validateDataStatus("Shares Outstanding", sharesOutstanding.dataStatus);

  const expected = {
    fiscalYear: APPLE_CAPSTONE.reviewedFiscalYear,
    accession: APPLE_CAPSTONE.accession,
  };
  validateProfitStatementForLesson(incomeStatement.statement, expected);
  validateCompleteCashFlowStatement(cashFlowStatement.statement, expected);
  const threeStatements = buildThreeStatementConnectionData({
    incomeStatement,
    cashFlowStatement,
    balanceSheet,
  });
  validateEarningsPerShareForLesson(earningsPerShare, APPLE_CAPSTONE);
  validateSharesOutstandingForLesson(sharesOutstanding, APPLE_CAPSTONE);

  if (
    earningsPerShare.statement.accession !== incomeStatement.statement.accession ||
    earningsPerShare.statement.startDate !== incomeStatement.statement.startDate ||
    earningsPerShare.statement.endDate !== incomeStatement.statement.endDate ||
    earningsPerShare.statement.earningsNumerator.value !==
      threeStatements.values.netIncome
  ) {
    throw new CapstoneDataError(
      "The reviewed EPS earnings numerator does not reconcile to Net Income.",
    );
  }
  if (
    sharesOutstanding.fact.accession !== incomeStatement.statement.accession ||
    sharesOutstanding.fact.asOfDate !== APPLE_CAPSTONE.sharesAsOfDate
  ) {
    throw new CapstoneDataError(
      "Shares Outstanding does not match the reviewed point-in-time filing context.",
    );
  }

  const latestRevenueFacts = overview.series.filter(
    (fact) => fact.fiscalYear === APPLE_CAPSTONE.reviewedFiscalYear,
  );
  const incomeRevenue = reportedFactFromStatementLine(
    incomeStatement.statement,
    "total-net-sales",
  );
  if (
    latestRevenueFacts.length !== 1 ||
    latestRevenueFacts[0].value !== incomeRevenue.value ||
    latestRevenueFacts[0].startDate !== incomeRevenue.startDate ||
    latestRevenueFacts[0].endDate !== incomeRevenue.endDate ||
    latestRevenueFacts[0].accession !== incomeRevenue.accession ||
    latestRevenueFacts[0].sourceUrl !== incomeRevenue.sourceUrl
  ) {
    throw new CapstoneDataError(
      "Revenue does not reconcile across the reviewed company records.",
    );
  }

  const revenue = buildReportedEvidence({
    metric: { id: "revenue", label: "Revenue" },
    company: overview.company,
    currency: overview.metric.currency,
    taxonomyTag: overview.metric.taxonomyTag,
    fact: latestRevenueFacts[0],
    dataStatus: overview.dataStatus,
  });
  if (!revenue.filing.sourceUrl) {
    throw new CapstoneDataError("Revenue requires an official SEC filing link.");
  }

  const marginDerivation = deriveNetProfitMargin(incomeStatement.statement);
  const netProfitMargin = buildNetProfitMarginEvidence({
    incomeStatement,
    derivation: marginDerivation,
  });
  const netIncome = netProfitMargin.inputs[1];

  const growthRow = buildRevenueGrowthRows(overview.series).find(
    (row): row is Extract<RevenueGrowthRow, { state: "available" }> =>
      row.state === "available" &&
      row.fiscalYear === APPLE_CAPSTONE.reviewedFiscalYear,
  );
  const revenueGrowth = growthRow
    ? buildRevenueGrowthEvidence({
        row: growthRow,
        company: overview.company,
        currency: overview.metric.currency,
        taxonomyTag: overview.metric.taxonomyTag,
        dataStatus: overview.dataStatus,
      })
    : undefined;

  const freeCashFlow = buildFreeCashFlowEvidence({
    cashFlowStatement,
    derivation: deriveSimpleFreeCashFlow(cashFlowStatement.statement),
  });
  const operatingCashFlow = freeCashFlow.inputs[0];
  const position = buildBalanceSheetEvidence(balanceSheet);
  const filing = threeStatements.filing;
  const activityEvidence = {
    operating: threeStatements.evidence.operatingCashFlow,
    investing: threeStatements.evidence.investingCashFlow,
    financing: threeStatements.evidence.financingCashFlow,
    reportedChange: threeStatements.evidence.netChangeInCash,
    beginningBalance: threeStatements.evidence.beginningCash,
    endingBalance: threeStatements.evidence.endingCash,
  };
  const casebook = buildCasebook({
    businessProfile,
    revenue,
    revenueGrowth,
    netIncome,
    netProfitMargin,
    operatingCashFlow,
    freeCashFlow,
    activityEvidence,
    position,
    earningsPerShare,
    sharesOutstanding,
  });

  return {
    company: businessProfile.company,
    filing,
    business: { kind: "narrative", profile: businessProfile },
    performance: {
      revenue,
      netIncome,
      netProfitMargin,
      revenueGrowth,
    },
    cash: { operatingCashFlow, freeCashFlow, activityEvidence },
    financialPosition: {
      assets: position.assets,
      liabilities: position.liabilities,
      equity: position.equity,
      cash: position.cashAndCashEquivalents,
      simpleBorrowings: position.simpleBorrowings,
    },
    perShare: {
      dilutedEps: {
        kind: "reported",
        value: earningsPerShare.statement.dilutedEps.value,
        response: earningsPerShare,
      },
      sharesOutstanding: {
        kind: "reported",
        value: sharesOutstanding.fact.value,
        asOfDate: sharesOutstanding.fact.asOfDate,
        response: sharesOutstanding,
      },
    },
    valuation: {
      kind: "not-assessed",
      status: "Not assessed from verified market evidence",
      reason:
        "FinPath does not have approved, verified market-price evidence for this Capstone, so current valuation remains unknown.",
    },
    connections: threeStatements.connections,
    casebook,
    evidenceCatalog: casebook.flatMap((question) => question.evidence),
    dataStatuses: [
      status("Revenue", overview.dataStatus),
      status("Income Statement", incomeStatement.dataStatus),
      status("Cash Flow Statement", cashFlowStatement.dataStatus),
      status("Balance Sheet", balanceSheet.dataStatus),
      status("EPS", earningsPerShare.dataStatus),
      status("Shares Outstanding", sharesOutstanding.dataStatus),
    ],
  };
}

function validateBusinessProfile(profile: BusinessModelProfile): void {
  const identity = profile.company;
  const filing = profile.filing;
  if (
    identity.slug !== APPLE_CAPSTONE.slug ||
    identity.ticker !== APPLE_CAPSTONE.ticker ||
    identity.name !== APPLE_CAPSTONE.name ||
    identity.cik !== APPLE_CAPSTONE.cik ||
    filing.fiscalYear !== APPLE_CAPSTONE.reviewedFiscalYear ||
    filing.form !== "10-K" ||
    filing.filedAt !== APPLE_CAPSTONE.filedAt ||
    filing.accession !== APPLE_CAPSTONE.accession ||
    !isCanonicalFilingUrl(filing.sourceUrl) ||
    profile.offerings.length === 0 ||
    profile.moneyPaths.length === 0 ||
    profile.evidence.length === 0 ||
    profile.evidence.some(
      (evidence) =>
        evidence.company.ticker !== APPLE_CAPSTONE.ticker ||
        evidence.company.cik !== APPLE_CAPSTONE.cik ||
        evidence.accession !== APPLE_CAPSTONE.accession ||
        evidence.sourceUrl !== filing.sourceUrl,
    )
  ) {
    throw new CapstoneDataError(
      "The Business Model profile does not match the reviewed Apple filing.",
    );
  }
}

function validateOverview(overview: CompanyOverview): void {
  if (
    overview.company.ticker !== APPLE_CAPSTONE.ticker ||
    overview.company.name !== APPLE_CAPSTONE.name ||
    overview.company.cik !== APPLE_CAPSTONE.cik ||
    overview.metric.id !== "revenue" ||
    overview.metric.currency !== "USD" ||
    !overview.metric.taxonomyTag.trim()
  ) {
    throw new CapstoneDataError(
      "The Revenue response does not match the reviewed Apple company identity.",
    );
  }
}

function validateDataStatus(
  source: string,
  dataStatus: { state: DataState; retrievedAt: string },
): void {
  if (
    !["live", "cached", "stale"].includes(dataStatus.state) ||
    !Number.isFinite(Date.parse(dataStatus.retrievedAt))
  ) {
    throw new CapstoneDataError(`${source} has an invalid source status.`);
  }
}

function isCanonicalFilingUrl(sourceUrl: string): boolean {
  try {
    const parsed = new URL(sourceUrl);
    return (
      parsed.protocol === "https:" &&
      ["sec.gov", "www.sec.gov"].includes(parsed.hostname.toLowerCase()) &&
      parsed.pathname ===
        "/Archives/edgar/data/320193/000032019325000079/0000320193-25-000079-index.htm"
    );
  } catch {
    return false;
  }
}

function status(
  source: string,
  dataStatus: { state: DataState; retrievedAt: string },
) {
  return { source, ...dataStatus };
}

function reportedRecord({
  id,
  questionId,
  label,
  evidence,
}: {
  id: string;
  questionId: CapstoneEvidenceRecord["questionId"];
  label: string;
  evidence: ReportedEvidence;
}): CapstoneEvidenceRecord {
  return {
    id,
    questionId,
    label,
    displayValue: `$${evidence.finPathDisplay.value.toFixed(3)}B`,
    provenance: "reported",
    recordType: "Number Passport",
    inspection: { kind: "financial", evidence },
  };
}

function derivedRecord({
  id,
  questionId,
  label,
  displayValue,
  evidence,
}: {
  id: string;
  questionId: CapstoneEvidenceRecord["questionId"];
  label: string;
  displayValue: string;
  evidence: DerivedEvidence;
}): CapstoneEvidenceRecord {
  return {
    id,
    questionId,
    label,
    displayValue,
    provenance: "finpath-derived",
    recordType: "Derivation Passport",
    inspection: { kind: "financial", evidence },
  };
}

function buildCasebook({
  businessProfile,
  revenue,
  revenueGrowth,
  netIncome,
  netProfitMargin,
  operatingCashFlow,
  freeCashFlow,
  activityEvidence,
  position,
  earningsPerShare,
  sharesOutstanding,
}: {
  businessProfile: BusinessModelProfile;
  revenue: ReportedEvidence;
  revenueGrowth?: DerivedEvidence;
  netIncome: ReportedEvidence;
  netProfitMargin: DerivedEvidence;
  operatingCashFlow: ReportedEvidence;
  freeCashFlow: DerivedEvidence;
  activityEvidence: CapstoneData["cash"]["activityEvidence"];
  position: BalanceSheetEvidence;
  earningsPerShare: CompanyEarningsPerShare;
  sharesOutstanding: CompanySharesOutstanding;
}): CapstoneCasebookQuestion[] {
  const performance: CapstoneEvidenceRecord[] = [
    reportedRecord({ id: "performance-revenue", questionId: "period-performance", label: "Revenue", evidence: revenue }),
    reportedRecord({ id: "performance-net-income", questionId: "period-performance", label: "Net Income", evidence: netIncome }),
    derivedRecord({
      id: "performance-margin",
      questionId: "period-performance",
      label: "Net Profit Margin",
      displayValue: `${netProfitMargin.calculation.displayedResult.toFixed(1)}%`,
      evidence: netProfitMargin,
    }),
  ];
  if (revenueGrowth) {
    performance.splice(1, 0, derivedRecord({
      id: "performance-growth",
      questionId: "period-performance",
      label: "Revenue Growth",
      displayValue: `${revenueGrowth.calculation.displayedResult >= 0 ? "+" : ""}${revenueGrowth.calculation.displayedResult.toFixed(1)}%`,
      evidence: revenueGrowth,
    }));
  }

  const positionLiabilities =
    position.liabilities.kind === "reported"
      ? reportedRecord({ id: "position-liabilities", questionId: "financial-position", label: "Liabilities", evidence: position.liabilities })
      : derivedRecord({
          id: "position-liabilities",
          questionId: "financial-position",
          label: "Liabilities",
          displayValue: `$${position.liabilities.calculation.displayedResult.toFixed(3)}B`,
          evidence: position.liabilities,
        });

  return [
    {
      id: "revenue-origin",
      number: 1,
      question: "How does the business generate Revenue?",
      prompt: "Connect reviewed offerings, counterparties and exchanges. Contribution size and profitability by offering remain unknown.",
      evidence: businessProfile.moneyPaths.map((path) => ({
        id: `business-${path.id}`,
        questionId: "revenue-origin",
        label: path.receives,
        displayValue: `${path.payer} · ${path.mechanism}`,
        provenance: "reviewed",
        recordType: "Narrative Evidence Record",
        inspection: { kind: "narrative", evidenceIds: [...path.evidenceIds] },
      })),
      unknowns: [
        { id: "business-contribution", provenance: "unknown", label: "Revenue contribution by offering" },
        { id: "business-profitability", provenance: "unknown", label: "Profitability and durability by offering" },
        { id: "business-moat", provenance: "unknown", label: "Moat or competitive durability" },
      ],
    },
    {
      id: "period-performance",
      number: 2,
      question: "What does the period's performance show?",
      prompt: "State what changed and name the comparison or relationship used as your basis.",
      evidence: performance,
      unknowns: [
        { id: "performance-future", provenance: "unknown", label: "Future Revenue and margin path" },
      ],
    },
    {
      id: "profit-to-cash",
      number: 3,
      question: "How did Profit connect to cash?",
      prompt: "Trace Net Income to OCF, OCF to FinPath simple FCF, and the three cash activities to reported cash change.",
      evidence: [
        reportedRecord({ id: "cash-net-income", questionId: "profit-to-cash", label: "Net Income", evidence: netIncome }),
        reportedRecord({ id: "cash-operating", questionId: "profit-to-cash", label: "Operating Cash Flow", evidence: operatingCashFlow }),
        derivedRecord({
          id: "cash-fcf",
          questionId: "profit-to-cash",
          label: "Simple Free Cash Flow",
          displayValue: `$${freeCashFlow.calculation.displayedResult.toFixed(3)}B`,
          evidence: freeCashFlow,
        }),
        reportedRecord({ id: "cash-investing", questionId: "profit-to-cash", label: "Investing Cash Flow", evidence: activityEvidence.investing }),
        reportedRecord({ id: "cash-financing", questionId: "profit-to-cash", label: "Financing Cash Flow", evidence: activityEvidence.financing }),
        reportedRecord({ id: "cash-change", questionId: "profit-to-cash", label: "Reported change in cash", evidence: activityEvidence.reportedChange }),
        reportedRecord({ id: "cash-beginning", questionId: "profit-to-cash", label: "Beginning cash-related balance", evidence: activityEvidence.beginningBalance }),
        reportedRecord({ id: "cash-ending", questionId: "profit-to-cash", label: "Ending cash-related balance", evidence: activityEvidence.endingBalance }),
      ],
      unknowns: [
        { id: "cash-sustainability", provenance: "unknown", label: "Future cash-generation sustainability" },
        { id: "cash-allocation-quality", provenance: "unknown", label: "Capital-allocation quality" },
      ],
    },
    {
      id: "financial-position",
      number: 4,
      question: "What was the reporting-date financial position?",
      prompt: "Use the reporting-date facts without treating borrowings alone as a solvency verdict.",
      evidence: [
        reportedRecord({ id: "position-assets", questionId: "financial-position", label: "Assets", evidence: position.assets }),
        positionLiabilities,
        reportedRecord({ id: "position-equity", questionId: "financial-position", label: "Equity", evidence: position.equity }),
        reportedRecord({ id: "position-cash", questionId: "financial-position", label: "Cash and cash equivalents", evidence: position.cashAndCashEquivalents }),
        derivedRecord({
          id: "position-borrowings",
          questionId: "financial-position",
          label: "Simple borrowings",
          displayValue: `$${position.simpleBorrowings.calculation.displayedResult.toFixed(3)}B`,
          evidence: position.simpleBorrowings,
        }),
      ],
      unknowns: [
        { id: "position-solvency", provenance: "unknown", label: "Solvency or liquidity quality from these facts alone" },
        { id: "position-debt-risk", provenance: "unknown", label: "Debt maturity and interest-burden risk" },
      ],
    },
    {
      id: "per-share-valuation",
      number: 5,
      question: "What does the per-share / valuation scenario show?",
      prompt: "Use reported per-share inputs. Add one optional educational price or intentionally leave valuation unassessed.",
      evidence: [
        {
          id: "valuation-eps",
          questionId: "per-share-valuation",
          label: "Diluted EPS",
          displayValue: `$${earningsPerShare.statement.dilutedEps.value}`,
          provenance: "reported",
          recordType: "Number Passport",
          inspection: { kind: "eps", response: earningsPerShare },
        },
        {
          id: "valuation-shares",
          questionId: "per-share-valuation",
          label: "Shares Outstanding",
          displayValue: new Intl.NumberFormat("en-US").format(sharesOutstanding.fact.value),
          provenance: "reported",
          recordType: "Number Passport",
          inspection: { kind: "shares", response: sharesOutstanding },
        },
      ],
      unknowns: [
        { id: "valuation-current", provenance: "unknown", label: "Current market valuation" },
        { id: "valuation-fair", provenance: "unknown", label: "Fair value, expected return or investment verdict" },
      ],
    },
  ];
}
