import type {
  CashFlowStatementLine,
  CashFlowStatementLineId,
  CompanyCashFlowStatement,
} from "@/lib/api";


export class OperatingCashFlowDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OperatingCashFlowDataError";
  }
}

const expectedLineIds: CashFlowStatementLineId[] = [
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
];

export function cashFlowLineMap(
  lines: CashFlowStatementLine[],
): Map<CashFlowStatementLineId, CashFlowStatementLine> {
  return new Map(lines.map((line) => [line.id, line]));
}

export function validateCashFlowStatementForLesson(
  statement: CompanyCashFlowStatement["statement"],
  expected: { fiscalYear: number; accession: string },
): void {
  const actualLineIds = statement.lines.map((line) => line.id);
  const uniqueIds = new Set(actualLineIds);
  const sourceUrl = safeSecFilingIndexUrl(statement.sourceUrl, statement.accession);

  if (
    statement.fiscalYear !== expected.fiscalYear ||
    statement.accession !== expected.accession ||
    statement.currency !== "USD" ||
    statement.form !== "10-K" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(statement.startDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(statement.endDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(statement.filedAt) ||
    !sourceUrl ||
    actualLineIds.length !== expectedLineIds.length ||
    uniqueIds.size !== expectedLineIds.length ||
    actualLineIds.some((lineId, index) => lineId !== expectedLineIds[index]) ||
    statement.lines.some((line) => !Number.isSafeInteger(line.value))
  ) {
    throw new OperatingCashFlowDataError(
      "Operating Cash Flow lesson requires one complete validated Apple annual filing record.",
    );
  }

  const total = statement.lines
    .slice(0, -1)
    .reduce((sum, line) => sum + line.value, 0);
  if (total !== statement.lines.at(-1)?.value) {
    throw new OperatingCashFlowDataError(
      "Operating cash-flow adjustments do not reconcile to the reported total.",
    );
  }
}

function safeSecFilingIndexUrl(sourceUrl: string, accession: string): boolean {
  try {
    const parsed = new URL(sourceUrl);
    const accessionMatch = /^(\d{10})-\d{2}-\d{6}$/.exec(accession);
    if (!accessionMatch) {
      return false;
    }

    const filerDirectory = accessionMatch[1].replace(/^0+/, "");
    const accessionDirectory = accession.replaceAll("-", "");
    return (
      parsed.protocol === "https:" &&
      ["sec.gov", "www.sec.gov"].includes(parsed.hostname.toLowerCase()) &&
      parsed.port === "" &&
      parsed.username === "" &&
      parsed.password === "" &&
      parsed.search === "" &&
      parsed.hash === "" &&
      parsed.pathname ===
        `/Archives/edgar/data/${filerDirectory}/${accessionDirectory}/${accession}-index.htm`
    );
  } catch {
    return false;
  }
}
