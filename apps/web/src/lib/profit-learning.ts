import type {
  CompanyIncomeStatement,
  IncomeStatementLine,
  IncomeStatementLineId,
  IncomeStatementLineRole,
} from "@/lib/api";

export const PROFIT_LINE_ORDER: IncomeStatementLineId[] = [
  "total-net-sales",
  "total-cost-of-sales",
  "gross-margin",
  "total-operating-expenses",
  "operating-income",
  "other-income-expense-net",
  "income-before-income-taxes",
  "income-tax-provision",
  "net-income",
];

const EXPECTED_ROLES: Record<IncomeStatementLineId, IncomeStatementLineRole> = {
  "total-net-sales": "starting-line",
  "total-cost-of-sales": "deduction",
  "gross-margin": "subtotal",
  "total-operating-expenses": "deduction",
  "operating-income": "subtotal",
  "other-income-expense-net": "signed-adjustment",
  "income-before-income-taxes": "subtotal",
  "income-tax-provision": "deduction",
  "net-income": "final-total",
};

export type ProfitLedgerSemanticRole =
  | "reference"
  | "adjustment"
  | "subtotal"
  | "signed-adjustment"
  | "result";

export type ProfitLedgerLine = {
  id: IncomeStatementLineId;
  reportedAmount: number;
  reportedRole: IncomeStatementLineRole;
  semanticRole: ProfitLedgerSemanticRole;
  reportedSign: "negative" | "positive" | "zero";
  presentationShareOfRevenue: number;
  evidenceAvailability: "available";
  geometryKind: "context" | "filled" | "locator" | "reference";
  locatorPositionPercentOfRevenue?: number;
};

export type ProfitLedgerTransformation = {
  id:
    | "total-cost-of-sales"
    | "total-operating-expenses"
    | "other-income-expense-net"
    | "income-tax-provision";
  before: ProfitLedgerLine;
  adjustment: ProfitLedgerLine;
  after: ProfitLedgerLine;
  operation: "add-signed" | "subtract";
  effectSign: "negative" | "positive" | "zero";
};

export type ProfitLedgerPresentation = {
  lines: ProfitLedgerLine[];
  revenue: ProfitLedgerLine;
  composition: ProfitLedgerLine[];
  transformations: ProfitLedgerTransformation[];
  result: ProfitLedgerLine;
};

export type ProfitLearningStage = {
  lineIds: IncomeStatementLineId[];
};

export class ProfitLearningDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfitLearningDataError";
  }
}

export function visibleProfitLineIds(
  stages: ProfitLearningStage[],
  revealedStageIndex: number,
): IncomeStatementLineId[] {
  if (
    !Number.isInteger(revealedStageIndex) ||
    revealedStageIndex < 0 ||
    revealedStageIndex >= stages.length
  ) {
    throw new ProfitLearningDataError("Profit learning stage is out of range.");
  }

  return stages
    .slice(0, revealedStageIndex + 1)
    .flatMap((stage) => stage.lineIds);
}

export function validateProfitStatementForLesson(
  statement: CompanyIncomeStatement["statement"],
  expected: { fiscalYear: number; accession: string },
): void {
  if (
    statement.fiscalYear !== expected.fiscalYear ||
    statement.accession !== expected.accession
  ) {
    throw new ProfitLearningDataError(
      "The reviewed Profit lesson does not match this SEC filing.",
    );
  }
  if (statement.currency !== "USD") {
    throw new ProfitLearningDataError("The Profit lesson requires USD facts.");
  }

  validateProfitStatementStructure(statement);

  const lineMap = incomeStatementLineMap(statement.lines);
  const otherIncomeExpense = requiredValue(
    lineMap,
    "other-income-expense-net",
  );
  if (otherIncomeExpense >= 0) {
    throw new ProfitLearningDataError(
      "The reviewed FY2025 explanation expects Other income/(expense), net to be negative.",
    );
  }

  let sourceUrl: URL;
  try {
    sourceUrl = new URL(statement.sourceUrl);
  } catch {
    throw new ProfitLearningDataError("The SEC filing URL is invalid.");
  }
  if (
    sourceUrl.protocol !== "https:" ||
    !["sec.gov", "www.sec.gov"].includes(sourceUrl.hostname) ||
    !sourceUrl.pathname.includes("/Archives/edgar/data/") ||
    !sourceUrl.pathname.includes(statement.accession)
  ) {
    throw new ProfitLearningDataError(
      "The Profit statement does not have a matching official SEC filing URL.",
    );
  }
}

export function buildProfitLedgerPresentation(
  statement: CompanyIncomeStatement["statement"],
): ProfitLedgerPresentation {
  validateProfitStatementStructure(statement);

  const lineMap = incomeStatementLineMap(statement.lines);
  const revenue = requiredValue(lineMap, "total-net-sales");
  const operatingIncome = requiredValue(lineMap, "operating-income");

  const lines = PROFIT_LINE_ORDER.map((id): ProfitLedgerLine => {
    const reported = lineMap.get(id);
    if (!reported) {
      throw new ProfitLearningDataError(`The SEC response is missing ${id}.`);
    }

    const semanticRole = semanticRoleFor(reported.role);
    const line: ProfitLedgerLine = {
      id,
      reportedAmount: reported.value,
      reportedRole: reported.role,
      semanticRole,
      reportedSign: signOf(reported.value),
      presentationShareOfRevenue:
        (Math.abs(reported.value) / revenue) * 100,
      evidenceAvailability: "available",
      geometryKind:
        semanticRole === "reference"
          ? "reference"
          : semanticRole === "adjustment" || semanticRole === "result"
            ? "filled"
            : semanticRole === "signed-adjustment"
              ? "locator"
              : "context",
    };

    if (id === "other-income-expense-net") {
      line.locatorPositionPercentOfRevenue =
        ((revenue - operatingIncome) / revenue) * 100;
    }

    return line;
  });

  const byId = new Map(lines.map((line) => [line.id, line]));
  const requiredLine = (id: IncomeStatementLineId): ProfitLedgerLine => {
    const line = byId.get(id);
    if (!line) {
      throw new ProfitLearningDataError(`The Profit Ledger is missing ${id}.`);
    }
    return line;
  };

  const transformations: ProfitLedgerTransformation[] = [
    {
      id: "total-cost-of-sales",
      before: requiredLine("total-net-sales"),
      adjustment: requiredLine("total-cost-of-sales"),
      after: requiredLine("gross-margin"),
      operation: "subtract",
      effectSign: "negative",
    },
    {
      id: "total-operating-expenses",
      before: requiredLine("gross-margin"),
      adjustment: requiredLine("total-operating-expenses"),
      after: requiredLine("operating-income"),
      operation: "subtract",
      effectSign: "negative",
    },
    {
      id: "other-income-expense-net",
      before: requiredLine("operating-income"),
      adjustment: requiredLine("other-income-expense-net"),
      after: requiredLine("income-before-income-taxes"),
      operation: "add-signed",
      effectSign: signOf(
        requiredLine("other-income-expense-net").reportedAmount,
      ),
    },
    {
      id: "income-tax-provision",
      before: requiredLine("income-before-income-taxes"),
      adjustment: requiredLine("income-tax-provision"),
      after: requiredLine("net-income"),
      operation: "subtract",
      effectSign: "negative",
    },
  ];

  return {
    lines,
    revenue: requiredLine("total-net-sales"),
    composition: [
      requiredLine("total-cost-of-sales"),
      requiredLine("total-operating-expenses"),
      requiredLine("other-income-expense-net"),
      requiredLine("income-tax-provision"),
      requiredLine("net-income"),
    ],
    transformations,
    result: requiredLine("net-income"),
  };
}

function validateProfitStatementStructure(
  statement: CompanyIncomeStatement["statement"],
): void {
  if (statement.currency !== "USD") {
    throw new ProfitLearningDataError("The Profit lesson requires USD facts.");
  }

  const ids = statement.lines.map((line) => line.id);
  if (
    ids.length !== PROFIT_LINE_ORDER.length ||
    ids.some((id, index) => id !== PROFIT_LINE_ORDER[index])
  ) {
    throw new ProfitLearningDataError(
      "The SEC response does not contain the complete ordered Profit path.",
    );
  }

  const lineMap = incomeStatementLineMap(statement.lines);
  for (const id of PROFIT_LINE_ORDER) {
    const line = lineMap.get(id);
    if (!line || line.role !== EXPECTED_ROLES[id]) {
      throw new ProfitLearningDataError(
        `The SEC response has an unexpected role for ${id}.`,
      );
    }
    if (!Number.isSafeInteger(line.value)) {
      throw new ProfitLearningDataError(
        `The SEC response has an invalid value for ${id}.`,
      );
    }
  }

  const revenue = requiredValue(lineMap, "total-net-sales");
  const costOfSales = requiredValue(lineMap, "total-cost-of-sales");
  const grossMargin = requiredValue(lineMap, "gross-margin");
  const operatingExpenses = requiredValue(
    lineMap,
    "total-operating-expenses",
  );
  const operatingIncome = requiredValue(lineMap, "operating-income");
  const otherIncomeExpense = requiredValue(
    lineMap,
    "other-income-expense-net",
  );
  const incomeBeforeTax = requiredValue(
    lineMap,
    "income-before-income-taxes",
  );
  const incomeTaxProvision = requiredValue(
    lineMap,
    "income-tax-provision",
  );
  const netIncome = requiredValue(lineMap, "net-income");

  if (revenue <= 0) {
    throw new ProfitLearningDataError(
      "The Profit lesson requires positive Revenue as its 100% reference.",
    );
  }

  if (revenue - costOfSales !== grossMargin) {
    throw new ProfitLearningDataError(
      "Revenue and cost of sales do not reconcile to Gross margin.",
    );
  }
  if (grossMargin - operatingExpenses !== operatingIncome) {
    throw new ProfitLearningDataError(
      "Gross margin and operating expenses do not reconcile to Operating income.",
    );
  }
  if (operatingIncome + otherIncomeExpense !== incomeBeforeTax) {
    throw new ProfitLearningDataError(
      "Operating income and other income or expense do not reconcile to income before tax.",
    );
  }
  if (incomeBeforeTax - incomeTaxProvision !== netIncome) {
    throw new ProfitLearningDataError(
      "Income before tax and the tax provision do not reconcile to Net income.",
    );
  }
}

function semanticRoleFor(
  role: IncomeStatementLineRole,
): ProfitLedgerSemanticRole {
  if (role === "starting-line") return "reference";
  if (role === "deduction") return "adjustment";
  if (role === "subtotal") return "subtotal";
  if (role === "signed-adjustment") return "signed-adjustment";
  return "result";
}

function signOf(value: number): "negative" | "positive" | "zero" {
  if (value < 0) return "negative";
  if (value > 0) return "positive";
  return "zero";
}

export function incomeStatementLineMap(
  lines: IncomeStatementLine[],
): Map<IncomeStatementLineId, IncomeStatementLine> {
  const lineMap = new Map<IncomeStatementLineId, IncomeStatementLine>();
  for (const line of lines) {
    if (lineMap.has(line.id)) {
      throw new ProfitLearningDataError(
        `The SEC response contains a duplicate ${line.id} line.`,
      );
    }
    lineMap.set(line.id, line);
  }
  return lineMap;
}

function requiredValue(
  lineMap: Map<IncomeStatementLineId, IncomeStatementLine>,
  id: IncomeStatementLineId,
): number {
  const line = lineMap.get(id);
  if (!line) {
    throw new ProfitLearningDataError(`The SEC response is missing ${id}.`);
  }
  return line.value;
}
