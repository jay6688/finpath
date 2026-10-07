import type {
  CashFlowSectionId,
  CashFlowStatementLine,
  CashFlowStatementLineId,
  CashFlowStatementLineRole,
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

const expectedRoles = new Map<
  CashFlowStatementLineId,
  CashFlowStatementLineRole
>([
  ["net-income", "starting-line"],
  ["depreciation-and-amortization", "non-cash-adjustment"],
  ["share-based-compensation-expense", "non-cash-adjustment"],
  ["other", "non-cash-adjustment"],
  ["accounts-receivable-net", "operating-timing-adjustment"],
  ["vendor-non-trade-receivables", "operating-timing-adjustment"],
  ["inventories", "operating-timing-adjustment"],
  ["other-current-and-non-current-assets", "operating-timing-adjustment"],
  ["accounts-payable", "operating-timing-adjustment"],
  ["other-current-and-non-current-liabilities", "operating-timing-adjustment"],
  ["cash-generated-by-operating-activities", "final-total"],
  ["purchases-of-marketable-securities", "cash-outflow"],
  ["maturities-of-marketable-securities", "cash-inflow"],
  ["sales-of-marketable-securities", "cash-inflow"],
  ["payments-for-property-plant-and-equipment", "cash-outflow"],
  ["other-investing-activities", "cash-outflow"],
  ["cash-generated-by-investing-activities", "section-total"],
  ["taxes-related-to-net-share-settlement", "cash-outflow"],
  ["dividends-and-dividend-equivalents", "cash-outflow"],
  ["common-stock-repurchases", "cash-outflow"],
  ["term-debt-issuance-net", "cash-inflow"],
  ["term-debt-repayment", "cash-outflow"],
  ["commercial-paper-net", "signed-cash-flow"],
  ["other-financing-activities", "signed-cash-flow"],
  ["cash-used-in-financing-activities", "section-total"],
  ["net-change-in-cash", "cash-change"],
]);

export type CashDirection = "inflow" | "outflow" | "none";

export type CashActivityPresentationLine = {
  id: CashFlowStatementLineId;
  kind: "reported-line";
  role: "cash-inflow" | "cash-outflow" | "signed-cash-flow";
  amount: number;
  direction: CashDirection;
  magnitudePercent: number;
  evidenceAvailability: "reported";
};

export type CashActivityPresentationSection = {
  id: CashFlowSectionId;
  kind: "reported-section-total";
  amount: number;
  direction: CashDirection;
  magnitudePercent: number;
  evidenceAvailability: "reported";
  lines: CashActivityPresentationLine[];
};

export type CashActivityPresentation = {
  activities: [
    CashActivityPresentationSection,
    CashActivityPresentationSection,
    CashActivityPresentationSection,
  ];
  activityScale: {
    kind: "shared-absolute-activity-scale";
    referenceAmount: number;
  };
  childScale: {
    kind: "shared-absolute-child-line-scale";
    referenceAmount: number;
  };
  change: {
    id: "net-change-in-cash";
    amount: number;
    direction: CashDirection;
    kind: "reported-cash-change";
    magnitudePercent: number;
  };
  balance: {
    beginning: number;
    change: number;
    ending: number;
  };
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
            line.role !== expectedRoles.get(line.id) ||
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
    movement.netChange.role !== expectedRoles.get(movement.netChange.id) ||
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

export function buildCashActivityPresentation(
  statement: CompanyCashFlowStatement["statement"],
  expected: { fiscalYear: number; accession: string },
): CashActivityPresentation {
  validateCompleteCashFlowStatement(statement, expected);

  const activityTotals = statement.sections.map((section) => {
    const total = section.lines.at(-1);
    if (!total) {
      throw new CashFlowLearningDataError(
        `${section.id} cash-flow activity requires a reported total.`,
      );
    }
    return total.value;
  });
  const activityReferenceAmount = Math.max(
    ...activityTotals.map((amount) => Math.abs(amount)),
  );
  const childLines = statement.sections
    .filter((section) => section.id !== "operating")
    .flatMap((section) => section.lines.slice(0, -1));
  const childReferenceAmount = Math.max(
    ...childLines.map((line) => Math.abs(line.value)),
  );
  if (activityReferenceAmount === 0 || childReferenceAmount === 0) {
    throw new CashFlowLearningDataError(
      "Cash Activity presentation requires non-zero shared scales.",
    );
  }

  const activities = statement.sections.map((section, index) => ({
    id: section.id,
    kind: "reported-section-total" as const,
    amount: activityTotals[index],
    direction: cashDirection(activityTotals[index]),
    magnitudePercent:
      (Math.abs(activityTotals[index]) / activityReferenceAmount) * 100,
    evidenceAvailability: "reported" as const,
    lines:
      section.id === "operating"
        ? []
        : section.lines.slice(0, -1).map((line) => {
            if (
              line.role !== "cash-inflow" &&
              line.role !== "cash-outflow" &&
              line.role !== "signed-cash-flow"
            ) {
              throw new CashFlowLearningDataError(
                `${line.id} does not have a supported cash-activity role.`,
              );
            }
            return {
              id: line.id,
              kind: "reported-line" as const,
              role: line.role,
              amount: line.value,
              direction: cashDirection(line.value),
              magnitudePercent:
                (Math.abs(line.value) / childReferenceAmount) * 100,
              evidenceAvailability: "reported" as const,
            };
          }),
  })) as CashActivityPresentation["activities"];
  const netChange = statement.cashMovement.netChange.value;

  return {
    activities,
    activityScale: {
      kind: "shared-absolute-activity-scale",
      referenceAmount: activityReferenceAmount,
    },
    childScale: {
      kind: "shared-absolute-child-line-scale",
      referenceAmount: childReferenceAmount,
    },
    change: {
      id: "net-change-in-cash",
      amount: netChange,
      direction: cashDirection(netChange),
      kind: "reported-cash-change",
      magnitudePercent: (Math.abs(netChange) / activityReferenceAmount) * 100,
    },
    balance: {
      beginning: statement.cashMovement.beginningCash.value,
      change: netChange,
      ending: statement.cashMovement.endingCash.value,
    },
  };
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

function cashDirection(amount: number): CashDirection {
  if (amount > 0) return "inflow";
  if (amount < 0) return "outflow";
  return "none";
}
