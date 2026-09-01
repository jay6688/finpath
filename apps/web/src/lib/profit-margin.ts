import type { CompanyIncomeStatement } from "@/lib/api";


export type NetProfitMarginDerivation = {
  revenue: number;
  netIncome: number;
  exactPercent: number;
  verificationPercent: number;
  displayPercent: number;
  perHundredRevenue: number;
};

export class ProfitMarginDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfitMarginDataError";
  }
}

export function deriveNetProfitMargin(
  statement: CompanyIncomeStatement["statement"],
): NetProfitMarginDerivation {
  const revenueLines = statement.lines.filter(
    (line) => line.id === "total-net-sales",
  );
  const netIncomeLines = statement.lines.filter(
    (line) => line.id === "net-income",
  );

  if (revenueLines.length !== 1 || netIncomeLines.length !== 1) {
    throw new ProfitMarginDataError(
      "Net Profit Margin requires exactly one Revenue line and one Net Income line.",
    );
  }

  const revenue = revenueLines[0].value;
  const netIncome = netIncomeLines[0].value;

  if (!Number.isSafeInteger(revenue) || revenue <= 0) {
    throw new ProfitMarginDataError(
      "Net Profit Margin requires a positive, validated Revenue denominator.",
    );
  }
  if (!Number.isSafeInteger(netIncome) || netIncome < 0) {
    throw new ProfitMarginDataError(
      "The reviewed Apple lesson requires a non-negative, validated Net Income numerator.",
    );
  }
  if (netIncome > revenue) {
    throw new ProfitMarginDataError(
      "The reviewed $100 Revenue scale does not support Net Income above Revenue.",
    );
  }

  const exactPercent = (netIncome / revenue) * 100;
  if (!Number.isFinite(exactPercent)) {
    throw new ProfitMarginDataError(
      "FinPath could not derive a finite Net Profit Margin.",
    );
  }

  const displayPercent = roundTo(exactPercent, 1);

  return {
    revenue,
    netIncome,
    exactPercent,
    verificationPercent: roundTo(exactPercent, 3),
    displayPercent,
    perHundredRevenue: displayPercent,
  };
}

function roundTo(value: number, decimalPlaces: number): number {
  const factor = 10 ** decimalPlaces;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
