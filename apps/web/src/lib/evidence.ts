import type {
  AnnualFinancialFact,
  BalanceSheetLineId,
  CashFlowStatementLineId,
  CompanyCashFlowStatement,
  CompanyIncomeStatement,
  CompanyOverview,
  DataState,
  IncomeStatementLineId,
} from "@/lib/api";
import type { RevenueGrowthRow } from "@/lib/history-insight";
import type { NetProfitMarginDerivation } from "@/lib/profit-margin";
import type { SimpleFreeCashFlowDerivation } from "@/lib/cash-flow-learning";

export type EvidenceCompany = CompanyOverview["company"];

export type DurationReportingContext = {
  kind: "duration";
  startDate: string;
  endDate: string;
};

export type InstantReportingContext = {
  kind: "instant";
  asOfDate: string;
};

export type ReportingContext =
  | DurationReportingContext
  | InstantReportingContext;

type InstantFinancialFact = {
  fiscalYear: number;
  asOfDate: string;
  value: number;
  form: "10-K" | "10-K/A";
  filedAt: string;
  accession: string;
  sourceUrl?: string | null;
};

type DurationFinancialFact = Omit<AnnualFinancialFact, "sourceUrl"> & {
  sourceUrl?: string | null;
};

export type DurationReportedFact = DurationFinancialFact & {
  taxonomyTag: string;
};

export type InstantReportedFact = InstantFinancialFact & {
  taxonomyTag: string;
};

export type ReportedFact = DurationReportedFact | InstantReportedFact;

export type EvidenceDataStatus = {
  state: DataState;
  retrievedAt: string;
};

export type FinancialStatementLineId =
  | IncomeStatementLineId
  | CashFlowStatementLineId
  | BalanceSheetLineId;

type EvidenceStatement =
  | CompanyIncomeStatement["statement"]
  | CompanyCashFlowStatement["statement"];

type FinancialStatementLine =
  | CompanyIncomeStatement["statement"]["lines"][number]
  | CompanyCashFlowStatement["statement"]["sections"][number]["lines"][number];

function statementLines(statement: EvidenceStatement): FinancialStatementLine[] {
  return "sections" in statement
    ? [
        ...statement.sections.flatMap((section) => section.lines),
        statement.cashMovement.netChange,
      ]
    : statement.lines;
}

export type ReviewedContextLine = {
  id: FinancialStatementLineId;
  reportedLabel: string;
  value: number;
};

export type ReviewedPresentation = {
  binding: {
    fiscalYear: number;
    reportingContext: ReportingContext;
    form: "10-K" | "10-K/A";
    filedAt: string;
    accession: string;
  };
  statementName: string;
  reportedLabel: string;
  taxonomyTag: string;
  contextLines: ReviewedContextLine[];
};

export type ReportedEvidence = {
  kind: "reported";
  metric: {
    id:
      | "revenue"
      | "net-income"
      | "operating-cash-flow"
      | "investing-cash-flow"
      | "financing-cash-flow"
      | "net-change-in-cash"
      | "pp-and-e-purchases"
      | "total-assets"
      | "total-liabilities"
      | "current-liabilities"
      | "long-term-debt"
      | "long-term-operating-lease-obligations"
      | "long-term-finance-lease-obligations"
      | "deferred-income-taxes-and-other"
      | "redeemable-noncontrolling-interest"
      | "shareholders-equity"
      | "cash-and-cash-equivalents"
      | "current-marketable-securities"
      | "noncurrent-marketable-securities"
      | "short-term-investments"
      | "commercial-paper"
      | "current-term-debt"
      | "noncurrent-term-debt"
      | "current-portion-long-term-debt"
      | "short-term-borrowings"
      | "long-term-debt-due-within-one-year";
    label: string;
  };
  company: EvidenceCompany;
  finPathDisplay: {
    value: number;
    currency: "USD";
    scale: "billions";
    decimalPlaces: 3;
  };
  reportedFact: ReportedFact;
  filing: {
    fiscalYear: number;
    reportingContext: ReportingContext;
    form: "10-K" | "10-K/A";
    filedAt: string;
    accession: string;
    sourceUrl?: string;
  };
  reviewedPresentation?: ReviewedPresentation;
  transformation: {
    inputScale: "whole USD" | "USD millions";
    inputValue: number;
    divisor: number;
    outputScale: "USD billions";
    outputValue: number;
    note: string;
  };
  sourceCapability: {
    filingLink: "available" | "unavailable";
    reviewedPresentation: "available" | "unavailable";
    exactLocator: "unavailable";
  };
  dataStatus: EvidenceDataStatus;
};

export type DerivedEvidence = {
  kind: "derived";
  metric: {
    id:
      | "net-profit-margin"
      | "revenue-growth"
      | "free-cash-flow"
      | "total-liabilities"
      | "simple-borrowings";
    label: string;
  };
  inputs: ReportedEvidence[];
  calculation:
    | {
        type: "ratio-percent" | "year-over-year-percent";
        formula: string;
        exactResult: number;
        displayedResult: number;
        decimalPlaces: 1;
        roundingNote: string;
      }
    | {
        type: "difference-amount" | "sum-amount";
        formula: string;
        exactResult: number;
        displayedResult: number;
        decimalPlaces: 3;
        roundingNote: string;
        definitionNote: string;
      };
  limitation: string;
};

export class EvidenceDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvidenceDataError";
  }
}

type ReviewedStatementContent = {
  fiscalYear: number;
  startDate: string;
  endDate: string;
  form: "10-K" | "10-K/A";
  filedAt: string;
  accession: string;
  statementName?: string;
  labels: Partial<Record<FinancialStatementLineId, string>>;
};

export function buildReviewedPresentation({
  statement,
  content,
  lineId,
  contextLineIds,
}: {
  statement: EvidenceStatement;
  content: ReviewedStatementContent;
  lineId: FinancialStatementLineId;
  contextLineIds: FinancialStatementLineId[];
}): ReviewedPresentation | null {
  if (
    statement.fiscalYear !== content.fiscalYear ||
    statement.startDate !== content.startDate ||
    statement.endDate !== content.endDate ||
    statement.form !== content.form ||
    statement.filedAt !== content.filedAt ||
    statement.accession !== content.accession ||
    !content.statementName?.trim() ||
    !safeSecFilingIndexUrl(
      statement.sourceUrl,
      statement.accession,
      null,
    )
  ) {
    return null;
  }

  const lines = new Map<string, FinancialStatementLine>(
    statementLines(statement).map((line) => [line.id, line]),
  );
  const reportedLabel = content.labels[lineId]?.trim();
  const selectedLine = lines.get(lineId);
  if (!reportedLabel || !selectedLine || !Number.isSafeInteger(selectedLine.value)) {
    return null;
  }

  const contextLines: ReviewedContextLine[] = [];
  for (const contextLineId of contextLineIds) {
    const line = lines.get(contextLineId);
    const label = content.labels[contextLineId]?.trim();
    if (!line || !label || !Number.isSafeInteger(line.value)) return null;
    contextLines.push({ id: contextLineId, reportedLabel: label, value: line.value });
  }

  return {
    binding: {
      fiscalYear: statement.fiscalYear,
      reportingContext: {
        kind: "duration",
        startDate: statement.startDate,
        endDate: statement.endDate,
      },
      form: statement.form,
      filedAt: statement.filedAt,
      accession: statement.accession,
    },
    statementName: content.statementName.trim(),
    reportedLabel,
    taxonomyTag: selectedLine.taxonomyTag,
    contextLines,
  };
}

export function reportedFactFromStatementLine(
  statement: EvidenceStatement,
  lineId: FinancialStatementLineId,
): DurationReportedFact {
  const matchingLines = statementLines(statement).filter((line) => line.id === lineId);
  if (matchingLines.length !== 1) {
    throw new EvidenceDataError(`Evidence requires exactly one ${lineId} line.`);
  }

  const line = matchingLines[0];
  return {
    fiscalYear: statement.fiscalYear,
    startDate: statement.startDate,
    endDate: statement.endDate,
    value: line.value,
    form: statement.form,
    filedAt: statement.filedAt,
    accession: statement.accession,
    sourceUrl: statement.sourceUrl,
    taxonomyTag: line.taxonomyTag,
  };
}

export function buildReportedEvidence({
  metric,
  company,
  currency,
  taxonomyTag,
  fact,
  dataStatus,
  reviewedPresentation,
}: {
  metric: ReportedEvidence["metric"];
  company: EvidenceCompany;
  currency: string;
  taxonomyTag?: string;
  fact: (DurationFinancialFact | InstantFinancialFact) & {
    sourceUrl?: string | null;
    taxonomyTag?: string;
  };
  dataStatus: EvidenceDataStatus;
  reviewedPresentation?: ReviewedPresentation | null;
}): ReportedEvidence {
  if (currency !== "USD") {
    throw new EvidenceDataError(
      "Evidence formatting is unavailable because the reported unit is not USD.",
    );
  }
  if (!Number.isSafeInteger(fact.value)) {
    throw new EvidenceDataError("Evidence requires an exact stored integer value.");
  }
  if (!validFactIdentity(fact)) {
    throw new EvidenceDataError("Evidence requires a valid filing and reporting period.");
  }

  const sourceUrl = safeSecFilingIndexUrl(
    fact.sourceUrl,
    fact.accession,
    company.cik,
  );
  const effectiveTaxonomyTag = fact.taxonomyTag ?? taxonomyTag ?? "";
  const matchedPresentation =
    sourceUrl &&
    reviewedPresentation &&
    reviewedPresentation.taxonomyTag === effectiveTaxonomyTag &&
    presentationMatchesFact(reviewedPresentation, fact)
      ? reviewedPresentation
      : undefined;
  const reportedFact: ReportedFact = {
    ...fact,
    sourceUrl: fact.sourceUrl,
    taxonomyTag: effectiveTaxonomyTag,
  };
  const outputValue = fact.value / 1_000_000_000;
  const usesReviewedMillions = Boolean(matchedPresentation);

  return {
    kind: "reported",
    metric,
    company,
    finPathDisplay: {
      value: outputValue,
      currency: "USD",
      scale: "billions",
      decimalPlaces: 3,
    },
    reportedFact,
    filing: {
      fiscalYear: fact.fiscalYear,
      reportingContext: reportingContextFromFact(fact),
      form: fact.form,
      filedAt: fact.filedAt,
      accession: fact.accession,
      sourceUrl,
    },
    reviewedPresentation: matchedPresentation,
    transformation: {
      inputScale: usesReviewedMillions ? "USD millions" : "whole USD",
      inputValue: usesReviewedMillions ? fact.value / 1_000_000 : fact.value,
      divisor: usesReviewedMillions ? 1_000 : 1_000_000_000,
      outputScale: "USD billions",
      outputValue,
      note: "Formatting only. No financial estimate.",
    },
    sourceCapability: {
      filingLink: sourceUrl ? "available" : "unavailable",
      reviewedPresentation: matchedPresentation ? "available" : "unavailable",
      exactLocator: "unavailable",
    },
    dataStatus,
  };
}

export function buildNetProfitMarginEvidence({
  incomeStatement,
  derivation,
  reviewedRevenue,
  reviewedNetIncome,
}: {
  incomeStatement: CompanyIncomeStatement;
  derivation: NetProfitMarginDerivation;
  reviewedRevenue?: ReviewedPresentation | null;
  reviewedNetIncome?: ReviewedPresentation | null;
}): DerivedEvidence {
  const { company, statement, dataStatus } = incomeStatement;
  const revenueFact = reportedFactFromStatementLine(statement, "total-net-sales");
  const netIncomeFact = reportedFactFromStatementLine(statement, "net-income");

  if (
    derivation.revenue !== revenueFact.value ||
    derivation.netIncome !== netIncomeFact.value ||
    revenueFact.accession !== netIncomeFact.accession ||
    revenueFact.startDate !== netIncomeFact.startDate ||
    revenueFact.endDate !== netIncomeFact.endDate ||
    statement.currency !== "USD" ||
    revenueFact.value <= 0
  ) {
    throw new EvidenceDataError(
      "Net Profit Margin evidence requires matching validated Revenue and Net Income inputs.",
    );
  }

  const exactResult = (netIncomeFact.value / revenueFact.value) * 100;
  if (
    !Number.isFinite(exactResult) ||
    Math.abs(exactResult - derivation.exactPercent) > 1e-12
  ) {
    throw new EvidenceDataError("Net Profit Margin evidence does not match its inputs.");
  }

  return {
    kind: "derived",
    metric: { id: "net-profit-margin", label: "Net Profit Margin" },
    inputs: [
      buildReportedEvidence({
        metric: { id: "revenue", label: "Revenue" },
        company,
        currency: statement.currency,
        fact: revenueFact,
        dataStatus,
        reviewedPresentation: reviewedRevenue,
      }),
      buildReportedEvidence({
        metric: { id: "net-income", label: "Net Income" },
        company,
        currency: statement.currency,
        fact: netIncomeFact,
        dataStatus,
        reviewedPresentation: reviewedNetIncome,
      }),
    ],
    calculation: {
      type: "ratio-percent",
      formula: "Net Income ÷ Revenue × 100",
      exactResult,
      displayedResult: derivation.displayPercent,
      decimalPlaces: 1,
      roundingNote:
        "FinPath calculates with the exact reported values, then rounds the learning display to one decimal place.",
    },
    limitation:
      "Apple reported the inputs, not this ratio as a filing line. The result does not mean cash moved, was generated, or was retained.",
  };
}

export function buildRevenueGrowthEvidence({
  row,
  company,
  currency,
  taxonomyTag,
  dataStatus,
  reviewedPresentation,
}: {
  row: Extract<RevenueGrowthRow, { state: "available" }>;
  company: EvidenceCompany;
  currency: string;
  taxonomyTag: string;
  dataStatus: EvidenceDataStatus;
  reviewedPresentation?: ReviewedPresentation | null;
}): DerivedEvidence {
  if (
    row.current.fiscalYear !== row.previous.fiscalYear + 1 ||
    !Number.isSafeInteger(row.current.value) ||
    !Number.isSafeInteger(row.previous.value) ||
    row.previous.value <= 0
  ) {
    throw new EvidenceDataError(
      "Revenue Growth evidence requires two valid consecutive annual Revenue facts.",
    );
  }

  const exactResult =
    ((row.current.value - row.previous.value) / row.previous.value) * 100;
  const exactChange = row.current.value - row.previous.value;
  const expectedDirection =
    exactChange > 0 ? "increase" : exactChange < 0 ? "decrease" : "unchanged";
  if (
    !Number.isFinite(exactResult) ||
    Math.abs(exactResult - row.percentageChange) > 1e-12 ||
    row.absoluteChange !== exactChange ||
    row.direction !== expectedDirection
  ) {
    throw new EvidenceDataError("Revenue Growth evidence does not match its inputs.");
  }

  return {
    kind: "derived",
    metric: { id: "revenue-growth", label: "Revenue Growth" },
    inputs: [
      buildReportedEvidence({
        metric: { id: "revenue", label: `FY${row.previous.fiscalYear} Revenue` },
        company,
        currency,
        taxonomyTag,
        fact: row.previous,
        dataStatus,
        reviewedPresentation,
      }),
      buildReportedEvidence({
        metric: { id: "revenue", label: `FY${row.current.fiscalYear} Revenue` },
        company,
        currency,
        taxonomyTag,
        fact: row.current,
        dataStatus,
        reviewedPresentation,
      }),
    ],
    calculation: {
      type: "year-over-year-percent",
      formula: "(Current Revenue − Previous Revenue) ÷ Previous Revenue × 100",
      exactResult,
      displayedResult: roundTo(exactResult, 1),
      decimalPlaces: 1,
      roundingNote:
        "FinPath calculates with both exact reported values, then rounds the display to one decimal place.",
    },
    limitation:
      "This calculation shows the percentage change between two reported annual Revenue facts. It does not explain why Revenue changed or show Profit.",
  };
}

export function buildFreeCashFlowEvidence({
  cashFlowStatement,
  derivation,
  reviewedOperatingCashFlow,
  reviewedPropertyPlantEquipment,
}: {
  cashFlowStatement: CompanyCashFlowStatement;
  derivation: SimpleFreeCashFlowDerivation;
  reviewedOperatingCashFlow?: ReviewedPresentation | null;
  reviewedPropertyPlantEquipment?: ReviewedPresentation | null;
}): DerivedEvidence {
  const { company, statement, dataStatus } = cashFlowStatement;
  const operatingFact = reportedFactFromStatementLine(
    statement,
    "cash-generated-by-operating-activities",
  );
  const ppAndEFact = reportedFactFromStatementLine(
    statement,
    "payments-for-property-plant-and-equipment",
  );
  const exactResult = operatingFact.value - Math.abs(ppAndEFact.value);

  if (
    operatingFact.value !== derivation.operatingCashFlow ||
    Math.abs(ppAndEFact.value) !== derivation.propertyPlantEquipmentPurchases ||
    ppAndEFact.value >= 0 ||
    exactResult !== derivation.exactValue ||
    derivation.displayBillions !== exactResult / 1_000_000_000 ||
    operatingFact.accession !== ppAndEFact.accession ||
    operatingFact.startDate !== ppAndEFact.startDate ||
    operatingFact.endDate !== ppAndEFact.endDate ||
    statement.currency !== "USD"
  ) {
    throw new EvidenceDataError(
      "Free Cash Flow evidence requires matching validated Operating Cash Flow and PP&E inputs.",
    );
  }

  return {
    kind: "derived",
    metric: { id: "free-cash-flow", label: "Free Cash Flow" },
    inputs: [
      buildReportedEvidence({
        metric: { id: "operating-cash-flow", label: "Operating Cash Flow" },
        company,
        currency: statement.currency,
        fact: operatingFact,
        dataStatus,
        reviewedPresentation: reviewedOperatingCashFlow,
      }),
      buildReportedEvidence({
        metric: { id: "pp-and-e-purchases", label: "PP&E purchases" },
        company,
        currency: statement.currency,
        fact: ppAndEFact,
        dataStatus,
        reviewedPresentation: reviewedPropertyPlantEquipment,
      }),
    ],
    calculation: {
      type: "difference-amount",
      formula: "Operating Cash Flow − PP&E purchases",
      exactResult,
      displayedResult: derivation.displayBillions,
      decimalPlaces: 3,
      roundingNote:
        "FinPath calculates with exact reported USD values, then changes the display from millions to billions.",
      definitionNote:
        "FinPath uses a simple educational convention: Operating Cash Flow minus PP&E purchases.",
    },
    limitation:
      "Free Cash Flow is an analytical measure, not an Apple-reported GAAP metric. Definitions can vary, and this result is not ending cash, Net Income, valuation, or cash guaranteed to shareholders.",
  };
}

function presentationMatchesFact(
  presentation: ReviewedPresentation,
  fact: DurationFinancialFact | InstantFinancialFact,
): boolean {
  const binding = presentation.binding;
  return (
    binding.fiscalYear === fact.fiscalYear &&
    reportingContextsMatch(binding.reportingContext, reportingContextFromFact(fact)) &&
    binding.form === fact.form &&
    binding.filedAt === fact.filedAt &&
    binding.accession === fact.accession
  );
}

function validFactIdentity(
  fact: DurationFinancialFact | InstantFinancialFact,
): boolean {
  return (
    Number.isSafeInteger(fact.fiscalYear) &&
    fact.fiscalYear > 0 &&
    validReportingContext(reportingContextFromFact(fact)) &&
    /^\d{4}-\d{2}-\d{2}$/.test(fact.filedAt) &&
    /^(10-K|10-K\/A)$/.test(fact.form) &&
    /^\d{10}-\d{2}-\d{6}$/.test(fact.accession)
  );
}

function reportingContextFromFact(
  fact: DurationFinancialFact | InstantFinancialFact,
): ReportingContext {
  if ("asOfDate" in fact) {
    return { kind: "instant", asOfDate: fact.asOfDate };
  }
  return {
    kind: "duration",
    startDate: fact.startDate,
    endDate: fact.endDate,
  };
}

function validReportingContext(context: ReportingContext): boolean {
  if (context.kind === "instant") {
    return /^\d{4}-\d{2}-\d{2}$/.test(context.asOfDate);
  }
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(context.startDate) &&
    /^\d{4}-\d{2}-\d{2}$/.test(context.endDate) &&
    context.startDate <= context.endDate
  );
}

function reportingContextsMatch(
  left: ReportingContext,
  right: ReportingContext,
): boolean {
  if (left.kind !== right.kind) return false;
  if (left.kind === "instant" && right.kind === "instant") {
    return left.asOfDate === right.asOfDate;
  }
  return (
    left.kind === "duration" &&
    right.kind === "duration" &&
    left.startDate === right.startDate &&
    left.endDate === right.endDate
  );
}

function safeSecFilingIndexUrl(
  sourceUrl: string | null | undefined,
  accession: string,
  cik: string | null,
): string | undefined {
  if (!sourceUrl) return undefined;

  try {
    const parsed = new URL(sourceUrl);
    const normalizedCik = cik?.replace(/^0+/, "") || "[0-9]+";
    const accessionDirectory = accession.replaceAll("-", "");
    const expectedPath = new RegExp(
      `^/Archives/edgar/data/${normalizedCik}/${accessionDirectory}/${accession}-index\\.htm$`,
      "i",
    );
    if (
      parsed.protocol !== "https:" ||
      !["sec.gov", "www.sec.gov"].includes(parsed.hostname.toLowerCase()) ||
      !expectedPath.test(parsed.pathname)
    ) {
      return undefined;
    }
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function roundTo(value: number, decimalPlaces: number): number {
  const factor = 10 ** decimalPlaces;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
