import type {
  BalanceSheetLineId,
  CompanyBalanceSheet,
  ReportedBalanceSheetLine,
} from "./api.ts";
import {
  buildReportedEvidence,
  EvidenceDataError,
  type DerivedEvidence,
  type ReportedEvidence,
} from "./evidence.ts";

type BalanceSheetStatement = CompanyBalanceSheet["statement"];

const reviewedIdentities = new Map<
  string,
  {
    cik: string;
    fiscalYear: number;
    asOfDate: string;
    filedAt: string;
    supplementalIds: BalanceSheetLineId[];
    borrowingIds: BalanceSheetLineId[];
  }
>([
  [
    "0000320193-25-000079",
    {
      cik: "0000320193", fiscalYear: 2025, asOfDate: "2025-09-27", filedAt: "2025-10-31",
      supplementalIds: ["current-marketable-securities", "noncurrent-marketable-securities"],
      borrowingIds: ["commercial-paper", "current-term-debt", "noncurrent-term-debt"],
    },
  ],
  [
    "0001193125-26-323660",
    {
      cik: "0000789019", fiscalYear: 2026, asOfDate: "2026-06-30", filedAt: "2026-07-29",
      supplementalIds: ["short-term-investments"],
      borrowingIds: ["current-portion-long-term-debt", "long-term-debt"],
    },
  ],
  [
    "0000104169-26-000055",
    {
      cik: "0000104169", fiscalYear: 2026, asOfDate: "2026-01-31", filedAt: "2026-03-13",
      supplementalIds: [],
      borrowingIds: ["short-term-borrowings", "long-term-debt-due-within-one-year", "long-term-debt"],
    },
  ],
] as const);

const expectedLiabilityComponentIds = new Set<BalanceSheetLineId>([
  "current-liabilities",
  "long-term-debt",
  "long-term-operating-lease-obligations",
  "long-term-finance-lease-obligations",
  "deferred-income-taxes-and-other",
]);

export type BalanceSheetEvidence = {
  assets: ReportedEvidence;
  liabilities: ReportedEvidence | DerivedEvidence;
  otherClaims: ReportedEvidence[];
  equity: ReportedEvidence;
  cashAndCashEquivalents: ReportedEvidence;
  supplementalFinancialAssets: ReportedEvidence[];
  simpleBorrowings: DerivedEvidence;
};

export function validateBalanceSheetForLesson(
  statement: BalanceSheetStatement,
  company: CompanyBalanceSheet["company"],
): void {
  const identity = reviewedIdentities.get(statement.accession);
  if (
    !identity ||
    company.cik !== identity.cik ||
    statement.fiscalYear !== identity.fiscalYear ||
    statement.asOfDate !== identity.asOfDate ||
    statement.filedAt !== identity.filedAt ||
    statement.form !== "10-K" ||
    statement.currency !== "USD" ||
    !safeSecFilingIndexUrl(statement.sourceUrl, statement.accession, company.cik)
  ) {
    throw new EvidenceDataError(
      "Balance Sheet lesson data does not match a reviewed annual filing.",
    );
  }

  const reportedLines = [
    statement.assets,
    ...statement.otherClaims,
    statement.equity,
    statement.cashAndCashEquivalents,
    ...statement.supplementalFinancialAssets,
    ...statement.simpleBorrowings.inputs,
    ...(statement.liabilities.evidenceKind === "reported"
      ? [statement.liabilities]
      : statement.liabilities.inputs),
  ];
  for (const line of reportedLines) validateReportedLine(line);

  if (
    statement.assets.id !== "total-assets" ||
    statement.liabilities.id !== "total-liabilities" ||
    statement.equity.id !== "shareholders-equity" ||
    statement.cashAndCashEquivalents.id !== "cash-and-cash-equivalents" ||
    statement.assets.role !== "assets" ||
    statement.liabilities.role !== "liabilities" ||
    statement.equity.role !== "equity" ||
    statement.cashAndCashEquivalents.role !== "supporting-fact" ||
    statement.otherClaims.some((line) => line.role !== "other-claim")
  ) {
    throw new EvidenceDataError("Balance Sheet lines use an invalid semantic role.");
  }

  const supplementalIds = statement.supplementalFinancialAssets.map((line) => line.id);
  const borrowingIds = statement.simpleBorrowings.inputs.map((line) => line.id);
  const borrowingTotal = statement.simpleBorrowings.inputs.reduce(
    (sum, line) => sum + line.value,
    0,
  );
  if (
    statement.supplementalFinancialAssets.some(
      (line) => line.role !== "supplemental-financial-asset",
    ) ||
    statement.simpleBorrowings.evidenceKind !== "derived" ||
    statement.simpleBorrowings.id !== "simple-borrowings" ||
    statement.simpleBorrowings.label !== "FinPath simple borrowings" ||
    statement.simpleBorrowings.definition !==
      "The sum of the reviewed borrowing lines used in this lesson." ||
    statement.simpleBorrowings.formula !==
      statement.simpleBorrowings.inputs.map((line) => line.reportedLabel).join(" + ") ||
    statement.simpleBorrowings.inputs.length === 0 ||
    statement.simpleBorrowings.inputs.some(
      (line) => line.role !== "borrowing-component",
    ) ||
    new Set(supplementalIds).size !== supplementalIds.length ||
    new Set(borrowingIds).size !== borrowingIds.length ||
    supplementalIds.join("|") !== identity.supplementalIds.join("|") ||
    borrowingIds.join("|") !== identity.borrowingIds.join("|") ||
    borrowingTotal !== statement.simpleBorrowings.value
  ) {
    throw new EvidenceDataError(
      "Cash & Debt evidence does not match the complete reviewed profile.",
    );
  }

  if (statement.liabilities.evidenceKind === "derived") {
    const ids = new Set(statement.liabilities.inputs.map((line) => line.id));
    const inputSum = statement.liabilities.inputs.reduce(
      (sum, line) => sum + line.value,
      0,
    );
    if (
      statement.liabilities.inputs.length !== expectedLiabilityComponentIds.size ||
      ids.size !== expectedLiabilityComponentIds.size ||
      [...expectedLiabilityComponentIds].some((id) => !ids.has(id)) ||
      inputSum !== statement.liabilities.value
    ) {
      throw new EvidenceDataError(
        "Derived Liabilities must equal the complete reviewed set of reported inputs.",
      );
    }
  }

  const claims = statement.otherClaims.reduce((sum, line) => sum + line.value, 0);
  if (
    statement.assets.value !==
    statement.liabilities.value + claims + statement.equity.value
  ) {
    throw new EvidenceDataError("The Balance Sheet does not reconcile exactly.");
  }
}

export function buildBalanceSheetEvidence(
  response: CompanyBalanceSheet,
): BalanceSheetEvidence {
  validateBalanceSheetForLesson(response.statement, response.company);
  const { company, dataStatus, statement } = response;

  const reported = (
    line: ReportedBalanceSheetLine,
    label: string,
  ): ReportedEvidence =>
    buildReportedEvidence({
      metric: { id: line.id, label },
      company,
      currency: statement.currency,
      fact: {
        fiscalYear: statement.fiscalYear,
        asOfDate: statement.asOfDate,
        value: line.value,
        form: statement.form,
        filedAt: statement.filedAt,
        accession: statement.accession,
        sourceUrl: statement.sourceUrl,
        taxonomyTag: line.taxonomyTag,
      },
      dataStatus,
    });

  const liabilities =
    statement.liabilities.evidenceKind === "reported"
      ? reported(statement.liabilities, "Liabilities")
      : buildDerivedLiabilities(response, reported);

  return {
    assets: reported(statement.assets, "Assets"),
    liabilities,
    otherClaims: statement.otherClaims.map((line) =>
      reported(line, line.reportedLabel),
    ),
    equity: reported(statement.equity, "Shareholders' Equity"),
    cashAndCashEquivalents: reported(
      statement.cashAndCashEquivalents,
      "Cash and cash equivalents",
    ),
    supplementalFinancialAssets: statement.supplementalFinancialAssets.map((line) =>
      reported(line, line.reportedLabel),
    ),
    simpleBorrowings: buildSimpleBorrowingsEvidence(response, reported),
  };
}

function buildSimpleBorrowingsEvidence(
  response: CompanyBalanceSheet,
  reported: (line: ReportedBalanceSheetLine, label: string) => ReportedEvidence,
): DerivedEvidence {
  const measure = response.statement.simpleBorrowings;
  const inputs = measure.inputs.map((line) => reported(line, line.reportedLabel));
  const exactResult = inputs.reduce(
    (sum, input) => sum + input.reportedFact.value,
    0,
  );
  if (exactResult !== measure.value) {
    throw new EvidenceDataError("Simple borrowings do not match their inputs.");
  }
  return {
    kind: "derived",
    metric: { id: "simple-borrowings", label: measure.label },
    inputs,
    calculation: {
      type: "sum-amount",
      formula: measure.formula,
      exactResult,
      displayedResult: exactResult / 1_000_000_000,
      decimalPlaces: 3,
      roundingNote:
        "FinPath sums exact reported USD values, then changes the display to billions.",
      definitionNote: measure.definition,
    },
    limitation:
      "This is not a company-reported Total Debt line. Debt definitions can vary. This lesson excludes lease obligations, and this number alone does not prove financial strength, weakness, solvency, valuation, or investment quality.",
  };
}

function buildDerivedLiabilities(
  response: CompanyBalanceSheet,
  reported: (line: ReportedBalanceSheetLine, label: string) => ReportedEvidence,
): DerivedEvidence {
  const line = response.statement.liabilities;
  if (line.evidenceKind !== "derived") {
    throw new EvidenceDataError("Expected derived Liabilities evidence.");
  }
  const inputs = line.inputs.map((input) => reported(input, input.reportedLabel));
  const exactResult = inputs.reduce(
    (sum, input) => sum + input.reportedFact.value,
    0,
  );
  if (exactResult !== line.value) {
    throw new EvidenceDataError("Derived Liabilities do not match their inputs.");
  }
  return {
    kind: "derived",
    metric: { id: "total-liabilities", label: "Liabilities" },
    inputs,
    calculation: {
      type: "sum-amount",
      formula: line.formula,
      exactResult,
      displayedResult: exactResult / 1_000_000_000,
      decimalPlaces: 3,
      roundingNote:
        "FinPath sums exact reported USD values, then changes the display to billions.",
      definitionNote:
        "The filing does not provide one usable Company Facts total for Liabilities in this reviewed context, so FinPath shows the complete validated sum.",
    },
    limitation:
      "This Liabilities total is FinPath-derived from the listed same-filing inputs. It is not labeled as a directly reported total.",
  };
}

function validateReportedLine(line: ReportedBalanceSheetLine): void {
  if (
    line.evidenceKind !== "reported" ||
    !line.id ||
    !line.taxonomyTag.trim() ||
    !line.taxonomyLabel.trim() ||
    !line.reportedLabel.trim() ||
    !Number.isSafeInteger(line.value) ||
    line.value < 0
  ) {
    throw new EvidenceDataError("Balance Sheet evidence contains an invalid reported line.");
  }
}

function safeSecFilingIndexUrl(
  sourceUrl: string,
  accession: string,
  cik: string,
): boolean {
  try {
    const parsed = new URL(sourceUrl);
    const accessionDirectory = accession.replaceAll("-", "");
    const normalizedCik = cik.replace(/^0+/, "");
    return (
      parsed.protocol === "https:" &&
      ["www.sec.gov", "sec.gov"].includes(parsed.hostname.toLowerCase()) &&
      parsed.pathname ===
        `/Archives/edgar/data/${normalizedCik}/${accessionDirectory}/${accession}-index.htm`
    );
  } catch {
    return false;
  }
}
