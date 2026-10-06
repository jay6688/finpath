import type {
  CashFlowStatementLine,
  CashFlowStatementLineId,
  CashFlowStatementLineRole,
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

const expectedLineRoles = new Map<
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
]);

const nonCashLineIds: CashFlowStatementLineId[] = [
  "depreciation-and-amortization",
  "share-based-compensation-expense",
  "other",
];

const timingLineIds: CashFlowStatementLineId[] = [
  "accounts-receivable-net",
  "vendor-non-trade-receivables",
  "inventories",
  "other-current-and-non-current-assets",
  "accounts-payable",
  "other-current-and-non-current-liabilities",
];

export type AdjustmentDirection = "positive" | "negative" | "zero";

export type OperatingCashFlowPresentationLine = {
  id: CashFlowStatementLineId;
  kind: "reported-line";
  semanticRole: "non-cash-effect" | "operating-timing-effect";
  reportedRole:
    | "non-cash-adjustment"
    | "operating-timing-adjustment";
  amount: number;
  direction: AdjustmentDirection;
  magnitudePercent: number;
  evidenceAvailability: "reported";
};

export type OperatingCashFlowPresentationGroup = {
  id: "non-cash-effects" | "operating-timing-effects";
  kind: "finpath-derived-group";
  semanticRole: "non-cash-effects" | "operating-timing-effects";
  amount: number;
  direction: AdjustmentDirection;
  magnitudePercent: number;
  intermediateAmount: number;
  evidenceAvailability: "derived-from-reported-lines";
  lines: OperatingCashFlowPresentationLine[];
};

export type OperatingCashFlowPresentation = {
  startingPoint: {
    id: "net-income";
    kind: "reported-endpoint";
    semanticRole: "starting-point";
    amount: number;
    evidenceAvailability: "reported";
  };
  adjustmentGroups: [
    OperatingCashFlowPresentationGroup,
    OperatingCashFlowPresentationGroup,
  ];
  adjustmentScale: {
    kind: "shared-absolute-adjustment-scale";
    referenceAmount: number;
  };
  netAdjustment: {
    kind: "finpath-derived-net-adjustment";
    semanticRole: "net-adjustment";
    amount: number;
    direction: AdjustmentDirection;
    magnitudePercent: number;
    evidenceAvailability: "derived-from-reported-lines";
  };
  result: {
    id: "cash-generated-by-operating-activities";
    kind: "reported-endpoint";
    semanticRole: "result";
    amount: number;
    evidenceAvailability: "reported";
  };
};

export function cashFlowLineMap(
  lines: CashFlowStatementLine[],
): Map<CashFlowStatementLineId, CashFlowStatementLine> {
  return new Map(lines.map((line) => [line.id, line]));
}

export function validateCashFlowStatementForLesson(
  statement: CompanyCashFlowStatement["statement"],
  expected: { fiscalYear: number; accession: string },
): void {
  const operatingSections = statement.sections.filter(
    (section) => section.id === "operating",
  );
  const operatingLines = operatingSections[0]?.lines ?? [];
  const sourceUrl = safeSecFilingIndexUrl(statement.sourceUrl, statement.accession);

  if (
    statement.fiscalYear !== expected.fiscalYear ||
    statement.accession !== expected.accession ||
    statement.currency !== "USD" ||
    statement.form !== "10-K" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(statement.startDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(statement.endDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(statement.filedAt) ||
    !sourceUrl
  ) {
    throw new OperatingCashFlowDataError(
      "Operating Cash Flow lesson requires one complete validated Apple annual filing record.",
    );
  }
  assertCompleteOperatingReconciliation(operatingSections.length, operatingLines);
}

export function buildOperatingCashFlowPresentation(
  statement: CompanyCashFlowStatement["statement"],
): OperatingCashFlowPresentation {
  const operatingSections = statement.sections.filter(
    (section) => section.id === "operating",
  );
  const operatingLines = operatingSections[0]?.lines ?? [];
  assertCompleteOperatingReconciliation(operatingSections.length, operatingLines);

  const lines = cashFlowLineMap(operatingLines);
  const startingAmount = requiredLine(lines, "net-income").value;
  const resultAmount = requiredLine(
    lines,
    "cash-generated-by-operating-activities",
  ).value;
  const nonCashAmount = sumLines(lines, nonCashLineIds);
  const timingAmount = sumLines(lines, timingLineIds);
  const referenceAmount = Math.max(
    Math.abs(nonCashAmount),
    Math.abs(timingAmount),
  );
  const netAdjustmentAmount = nonCashAmount + timingAmount;

  if (referenceAmount === 0) {
    throw new OperatingCashFlowDataError(
      "Operating cash-flow presentation requires a non-zero adjustment scale.",
    );
  }

  const nonCashGroup = buildGroup({
    id: "non-cash-effects",
    semanticRole: "non-cash-effects",
    lineSemanticRole: "non-cash-effect",
    reportedRole: "non-cash-adjustment",
    lineIds: nonCashLineIds,
    lines,
    amount: nonCashAmount,
    referenceAmount,
    intermediateAmount: startingAmount + nonCashAmount,
  });
  const timingGroup = buildGroup({
    id: "operating-timing-effects",
    semanticRole: "operating-timing-effects",
    lineSemanticRole: "operating-timing-effect",
    reportedRole: "operating-timing-adjustment",
    lineIds: timingLineIds,
    lines,
    amount: timingAmount,
    referenceAmount,
    intermediateAmount: startingAmount + nonCashAmount + timingAmount,
  });

  if (timingGroup.intermediateAmount !== resultAmount) {
    throw new OperatingCashFlowDataError(
      "Operating cash-flow adjustments do not reconcile to the reported total.",
    );
  }

  return {
    startingPoint: {
      id: "net-income",
      kind: "reported-endpoint",
      semanticRole: "starting-point",
      amount: startingAmount,
      evidenceAvailability: "reported",
    },
    adjustmentGroups: [nonCashGroup, timingGroup],
    adjustmentScale: {
      kind: "shared-absolute-adjustment-scale",
      referenceAmount,
    },
    netAdjustment: {
      kind: "finpath-derived-net-adjustment",
      semanticRole: "net-adjustment",
      amount: netAdjustmentAmount,
      direction: directionOf(netAdjustmentAmount),
      magnitudePercent: magnitudePercent(netAdjustmentAmount, referenceAmount),
      evidenceAvailability: "derived-from-reported-lines",
    },
    result: {
      id: "cash-generated-by-operating-activities",
      kind: "reported-endpoint",
      semanticRole: "result",
      amount: resultAmount,
      evidenceAvailability: "reported",
    },
  };
}

function assertCompleteOperatingReconciliation(
  operatingSectionCount: number,
  lines: CashFlowStatementLine[],
): void {
  const actualLineIds = lines.map((line) => line.id);
  const uniqueIds = new Set(actualLineIds);
  if (
    operatingSectionCount !== 1 ||
    actualLineIds.length !== expectedLineIds.length ||
    uniqueIds.size !== expectedLineIds.length ||
    actualLineIds.some((lineId, index) => lineId !== expectedLineIds[index]) ||
    lines.some(
      (line) =>
        !Number.isSafeInteger(line.value) ||
        line.role !== expectedLineRoles.get(line.id),
    )
  ) {
    throw new OperatingCashFlowDataError(
      "Operating Cash Flow lesson requires one complete validated Apple annual filing record.",
    );
  }

  const total = lines.slice(0, -1).reduce((sum, line) => sum + line.value, 0);
  if (total !== lines.at(-1)?.value) {
    throw new OperatingCashFlowDataError(
      "Operating cash-flow adjustments do not reconcile to the reported total.",
    );
  }
}

function buildGroup({
  id,
  semanticRole,
  lineSemanticRole,
  reportedRole,
  lineIds,
  lines,
  amount,
  referenceAmount,
  intermediateAmount,
}: {
  id: OperatingCashFlowPresentationGroup["id"];
  semanticRole: OperatingCashFlowPresentationGroup["semanticRole"];
  lineSemanticRole: OperatingCashFlowPresentationLine["semanticRole"];
  reportedRole: OperatingCashFlowPresentationLine["reportedRole"];
  lineIds: CashFlowStatementLineId[];
  lines: Map<CashFlowStatementLineId, CashFlowStatementLine>;
  amount: number;
  referenceAmount: number;
  intermediateAmount: number;
}): OperatingCashFlowPresentationGroup {
  return {
    id,
    kind: "finpath-derived-group",
    semanticRole,
    amount,
    direction: directionOf(amount),
    magnitudePercent: magnitudePercent(amount, referenceAmount),
    intermediateAmount,
    evidenceAvailability: "derived-from-reported-lines",
    lines: lineIds.map((lineId) => {
      const line = requiredLine(lines, lineId);
      return {
        id: line.id,
        kind: "reported-line",
        semanticRole: lineSemanticRole,
        reportedRole,
        amount: line.value,
        direction: directionOf(line.value),
        magnitudePercent: magnitudePercent(line.value, referenceAmount),
        evidenceAvailability: "reported",
      };
    }),
  };
}

function requiredLine(
  lines: Map<CashFlowStatementLineId, CashFlowStatementLine>,
  id: CashFlowStatementLineId,
): CashFlowStatementLine {
  const line = lines.get(id);
  if (!line) {
    throw new OperatingCashFlowDataError(
      `Operating cash-flow presentation is missing ${id}.`,
    );
  }
  return line;
}

function sumLines(
  lines: Map<CashFlowStatementLineId, CashFlowStatementLine>,
  ids: CashFlowStatementLineId[],
): number {
  return ids.reduce((sum, id) => sum + requiredLine(lines, id).value, 0);
}

function directionOf(amount: number): AdjustmentDirection {
  if (amount > 0) return "positive";
  if (amount < 0) return "negative";
  return "zero";
}

function magnitudePercent(amount: number, referenceAmount: number): number {
  return Number(((Math.abs(amount) / referenceAmount) * 100).toFixed(6));
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
