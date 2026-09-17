import type {
  CashFlowSectionId,
  CashFlowStatementLine,
  CashFlowStatementLineId,
  CompanyCashFlowStatement,
} from "./api.ts";
import {
  OperatingCashFlowDataError,
  validateCashFlowStatementForLesson,
} from "./operating-cash-flow.ts";

export class CashFlowLearningDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CashFlowLearningDataError";
  }
}

const expectedLines: Record<CashFlowSectionId, CashFlowStatementLineId[]> = {
  operating: [
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
  ],
  investing: [
    "purchases-of-marketable-securities",
    "maturities-of-marketable-securities",
    "sales-of-marketable-securities",
    "payments-for-property-plant-and-equipment",
    "other-investing-activities",
    "cash-generated-by-investing-activities",
  ],
  financing: [
    "taxes-related-to-net-share-settlement",
    "dividends-and-dividend-equivalents",
    "common-stock-repurchases",
    "term-debt-issuance-net",
    "term-debt-repayment",
    "commercial-paper-net",
    "other-financing-activities",
    "cash-used-in-financing-activities",
  ],
};

export type SimpleFreeCashFlowDerivation = {
  operatingCashFlow: number;
  propertyPlantEquipmentPurchases: number;
  exactValue: number;
  displayBillions: number;
};

export function cashFlowSections(
  statement: CompanyCashFlowStatement["statement"],
): Map<CashFlowSectionId, CashFlowStatementLine[]> {
  return new Map(statement.sections.map((section) => [section.id, section.lines]));
}

export function cashFlowStatementLines(
  statement: CompanyCashFlowStatement["statement"],
): CashFlowStatementLine[] {
  return statement.sections.flatMap((section) => section.lines);
}

export function validateCompleteCashFlowStatement(
  statement: CompanyCashFlowStatement["statement"],
  expected: { fiscalYear: number; accession: string },
): void {
  try {
    validateCashFlowStatementForLesson(statement, expected);
  } catch (error) {
    if (error instanceof OperatingCashFlowDataError) {
      throw new CashFlowLearningDataError(error.message);
    }
    throw error;
  }

  if (
    statement.sections.length !== 3 ||
    statement.sections.some(
      (section, index) =>
        section.id !== (["operating", "investing", "financing"] as const)[index] ||
        section.lines.length !== expectedLines[section.id].length ||
        section.lines.some(
          (line, lineIndex) =>
            line.id !== expectedLines[section.id][lineIndex] ||
            !Number.isSafeInteger(line.value),
        ),
    )
  ) {
    throw new CashFlowLearningDataError(
      "Cash Flow lessons require one complete ordered annual statement.",
    );
  }

  for (const section of statement.sections) {
    const detailTotal = section.lines
      .slice(0, -1)
      .reduce((sum, line) => sum + line.value, 0);
    if (detailTotal !== section.lines.at(-1)?.value) {
      throw new CashFlowLearningDataError(
        `${section.id} cash-flow lines do not reconcile to the reported total.`,
      );
    }
  }

  const movement = statement.cashMovement;
  const activityTotal = statement.sections.reduce(
    (sum, section) => sum + (section.lines.at(-1)?.value ?? Number.NaN),
    0,
  );
  if (
    movement.beginningCash.id !== "beginning-cash" ||
    movement.netChange.id !== "net-change-in-cash" ||
    movement.endingCash.id !== "ending-cash" ||
    !Number.isSafeInteger(movement.beginningCash.value) ||
    !Number.isSafeInteger(movement.netChange.value) ||
    !Number.isSafeInteger(movement.endingCash.value) ||
    movement.beginningCash.asOfDate !== previousIsoDate(statement.startDate) ||
    movement.endingCash.asOfDate !== statement.endDate ||
    activityTotal !== movement.netChange.value ||
    movement.beginningCash.value + movement.netChange.value !== movement.endingCash.value
  ) {
    throw new CashFlowLearningDataError(
      "Cash-flow activity totals must reconcile from beginning cash to ending cash.",
    );
  }

  const ppAndE = statement.sections[1].lines.find(
    (line) => line.id === "payments-for-property-plant-and-equipment",
  );
  if (!ppAndE || ppAndE.value >= 0) {
    throw new CashFlowLearningDataError(
      "PP&E purchases must be a validated cash outflow before deriving Free Cash Flow.",
    );
  }
}

export function deriveSimpleFreeCashFlow(
  statement: CompanyCashFlowStatement["statement"],
): SimpleFreeCashFlowDerivation {
  const lines = cashFlowStatementLines(statement);
  const operatingCashFlow = uniqueLineValue(
    lines,
    "cash-generated-by-operating-activities",
  );
  const ppAndECashEffect = uniqueLineValue(
    lines,
    "payments-for-property-plant-and-equipment",
  );
  if (ppAndECashEffect >= 0) {
    throw new CashFlowLearningDataError(
      "Simple Free Cash Flow requires PP&E purchases to be a cash outflow.",
    );
  }

  const propertyPlantEquipmentPurchases = Math.abs(ppAndECashEffect);
  const exactValue = operatingCashFlow - propertyPlantEquipmentPurchases;
  if (!Number.isSafeInteger(exactValue)) {
    throw new CashFlowLearningDataError("Free Cash Flow could not be derived exactly.");
  }
  return {
    operatingCashFlow,
    propertyPlantEquipmentPurchases,
    exactValue,
    displayBillions: exactValue / 1_000_000_000,
  };
}

function uniqueLineValue(
  lines: CashFlowStatementLine[],
  lineId: CashFlowStatementLineId,
): number {
  const matches = lines.filter((line) => line.id === lineId);
  if (matches.length !== 1 || !Number.isSafeInteger(matches[0].value)) {
    throw new CashFlowLearningDataError(`Expected exactly one ${lineId} line.`);
  }
  return matches[0].value;
}

function previousIsoDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}
