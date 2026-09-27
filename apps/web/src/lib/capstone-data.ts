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
  dataStatuses: Array<{
    source: string;
    state: DataState;
    retrievedAt: string;
  }>;
  analysisNote: {
    supported: string[];
    investigateNext: string[];
    unknown: string[];
  };
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
    cash: { operatingCashFlow, freeCashFlow },
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
    dataStatuses: [
      status("Revenue", overview.dataStatus),
      status("Income Statement", incomeStatement.dataStatus),
      status("Cash Flow Statement", cashFlowStatement.dataStatus),
      status("Balance Sheet", balanceSheet.dataStatus),
      status("EPS", earningsPerShare.dataStatus),
      status("Shares Outstanding", sharesOutstanding.dataStatus),
    ],
    analysisNote: buildAnalysisNote({
      profile: businessProfile,
      revenue,
      netIncome,
      operatingCashFlow,
      freeCashFlow,
      position,
      dilutedEps: earningsPerShare.statement.dilutedEps.value,
    }),
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

function formatBillions(evidence: ReportedEvidence): string {
  return `$${evidence.finPathDisplay.value.toFixed(3)}B`;
}

function buildAnalysisNote({
  profile,
  revenue,
  netIncome,
  operatingCashFlow,
  freeCashFlow,
  position,
  dilutedEps,
}: {
  profile: BusinessModelProfile;
  revenue: ReportedEvidence;
  netIncome: ReportedEvidence;
  operatingCashFlow: ReportedEvidence;
  freeCashFlow: DerivedEvidence;
  position: BalanceSheetEvidence;
  dilutedEps: string;
}): CapstoneData["analysisNote"] {
  return {
    supported: [
      `${profile.company.name}'s reviewed FY${profile.filing.fiscalYear} filing describes a business spanning products and related services.`,
      `It reported ${formatBillions(revenue)} of Revenue and ${formatBillions(netIncome)} of Net Income.`,
      `Operating Cash Flow was ${formatBillions(operatingCashFlow)}, while FinPath's defined simple FCF calculation was $${freeCashFlow.calculation.displayedResult.toFixed(3)}B.`,
      `At the reporting date, Cash was ${formatBillions(position.cashAndCashEquivalents)} and FinPath simple borrowings were $${position.simpleBorrowings.calculation.displayedResult.toFixed(3)}B. Apple reported Diluted EPS of $${dilutedEps}.`,
    ],
    investigateNext: [
      "How sustainable are the products, services and customer relationships behind future Revenue?",
      "What do debt maturities, interest burden and broader liquidity evidence show?",
      "How do current verified market-price measures compare with the filing evidence?",
    ],
    unknown: [
      "Future Revenue, margins and cash generation.",
      "Whether the current market valuation is cheap, expensive, undervalued or overvalued.",
      "Whether an investor should buy, sell or hold the shares.",
    ],
  };
}
