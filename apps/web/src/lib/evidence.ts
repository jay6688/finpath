import type {
  AnnualFinancialFact,
  CompanyIncomeStatement,
  CompanyOverview,
  DataState,
  IncomeStatementLineId,
} from "@/lib/api";
import type { RevenueGrowthRow } from "@/lib/history-insight";
import type { NetProfitMarginDerivation } from "@/lib/profit-margin";

export type EvidenceCompany = CompanyOverview["company"];

export type ReportedFact = AnnualFinancialFact & {
  sourceUrl?: string | null;
  taxonomyTag: string;
};

export type EvidenceDataStatus = {
  state: DataState;
  retrievedAt: string;
};

export type ReviewedContextLine = {
  id: IncomeStatementLineId;
  reportedLabel: string;
  value: number;
};

export type ReviewedPresentation = {
  binding: {
    fiscalYear: number;
    startDate: string;
    endDate: string;
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
    id: "revenue" | "net-income";
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
    startDate: string;
    endDate: string;
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
    id: "net-profit-margin" | "revenue-growth";
    label: string;
  };
  inputs: ReportedEvidence[];
  calculation: {
    type: "ratio-percent" | "year-over-year-percent";
    formula: string;
    exactResult: number;
    displayedResult: number;
    decimalPlaces: 1;
    roundingNote: string;
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
  labels: Partial<Record<IncomeStatementLineId, string>>;
};

export function buildReviewedPresentation({
  statement,
  content,
  lineId,
  contextLineIds,
}: {
  statement: CompanyIncomeStatement["statement"];
  content: ReviewedStatementContent;
  lineId: IncomeStatementLineId;
  contextLineIds: IncomeStatementLineId[];
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

  const lines = new Map(statement.lines.map((line) => [line.id, line]));
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
      startDate: statement.startDate,
      endDate: statement.endDate,
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
  statement: CompanyIncomeStatement["statement"],
  lineId: IncomeStatementLineId,
): ReportedFact {
  const matchingLines = statement.lines.filter((line) => line.id === lineId);
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
  fact: AnnualFinancialFact & { sourceUrl?: string | null; taxonomyTag?: string };
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
      startDate: fact.startDate,
      endDate: fact.endDate,
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

function presentationMatchesFact(
  presentation: ReviewedPresentation,
  fact: AnnualFinancialFact,
): boolean {
  const binding = presentation.binding;
  return (
    binding.fiscalYear === fact.fiscalYear &&
    binding.startDate === fact.startDate &&
    binding.endDate === fact.endDate &&
    binding.form === fact.form &&
    binding.filedAt === fact.filedAt &&
    binding.accession === fact.accession
  );
}

function validFactIdentity(fact: AnnualFinancialFact): boolean {
  return (
    Number.isSafeInteger(fact.fiscalYear) &&
    fact.fiscalYear > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(fact.startDate) &&
    /^\d{4}-\d{2}-\d{2}$/.test(fact.endDate) &&
    fact.startDate <= fact.endDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(fact.filedAt) &&
    /^(10-K|10-K\/A)$/.test(fact.form) &&
    /^\d{10}-\d{2}-\d{6}$/.test(fact.accession)
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
