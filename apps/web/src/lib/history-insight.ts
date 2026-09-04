import type { AnnualFinancialFact } from "@/lib/api";

export type RevenueGrowthUnavailableReason =
  | "invalid-fiscal-year"
  | "no-prior-year"
  | "missing-prior-year"
  | "duplicate-current-year"
  | "duplicate-prior-year"
  | "invalid-current-value"
  | "invalid-prior-value"
  | "zero-base";

export type RevenueGrowthRow =
  | {
      state: "available";
      fiscalYear: number;
      current: AnnualFinancialFact;
      previous: AnnualFinancialFact;
      absoluteChange: number;
      percentageChange: number;
      direction: "increase" | "decrease" | "unchanged";
    }
  | {
      state: "unavailable";
      fiscalYear: number | null;
      current?: AnnualFinancialFact;
      reason: RevenueGrowthUnavailableReason;
    };

function directionFor(change: number): "increase" | "decrease" | "unchanged" {
  if (change > 0) return "increase";
  if (change < 0) return "decrease";
  return "unchanged";
}

const oneDecimalRate = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  roundingMode: "halfExpand",
});

function hasValidFiscalYear(fact: AnnualFinancialFact): boolean {
  return Number.isSafeInteger(fact.fiscalYear) && fact.fiscalYear > 0;
}

function compareText(left: string, right: string): number {
  return String(left ?? "").localeCompare(String(right ?? ""));
}

function compareFacts(left: AnnualFinancialFact, right: AnnualFinancialFact): number {
  const leftHasValidYear = hasValidFiscalYear(left);
  const rightHasValidYear = hasValidFiscalYear(right);

  if (leftHasValidYear !== rightHasValidYear) return leftHasValidYear ? 1 : -1;

  return (
    (leftHasValidYear ? left.fiscalYear - right.fiscalYear : 0) ||
    compareText(left.endDate, right.endDate) ||
    compareText(left.filedAt, right.filedAt) ||
    compareText(left.accession, right.accession)
  );
}

function hasValidRevenueValue(fact: AnnualFinancialFact): boolean {
  return (
    typeof fact.value === "number" &&
    Number.isFinite(fact.value) &&
    Number.isSafeInteger(fact.value) &&
    fact.value >= 0
  );
}

export function orderRevenueSeries(
  series: AnnualFinancialFact[],
): AnnualFinancialFact[] {
  return [...series].sort(compareFacts);
}

export function buildRevenueGrowthRows(
  series: AnnualFinancialFact[],
): RevenueGrowthRow[] {
  const orderedSeries = orderRevenueSeries(series);
  const invalidYearRows: RevenueGrowthRow[] = orderedSeries
    .filter((fact) => !hasValidFiscalYear(fact))
    .map((current) => ({
      state: "unavailable",
      fiscalYear: null,
      current,
      reason: "invalid-fiscal-year",
    }));
  const groupedByYear = new Map<number, AnnualFinancialFact[]>();

  for (const fact of orderedSeries.filter(hasValidFiscalYear)) {
    const group = groupedByYear.get(fact.fiscalYear) ?? [];
    group.push(fact);
    groupedByYear.set(fact.fiscalYear, group);
  }

  const fiscalYears = [...groupedByYear.keys()].sort((left, right) => left - right);

  const validYearRows = fiscalYears.map((fiscalYear, index): RevenueGrowthRow => {
    const currentGroup = groupedByYear.get(fiscalYear) ?? [];
    const current = currentGroup[0];

    if (currentGroup.length > 1) {
      return { state: "unavailable", fiscalYear, reason: "duplicate-current-year" };
    }

    if (!hasValidRevenueValue(current)) {
      return {
        state: "unavailable",
        fiscalYear,
        current,
        reason: "invalid-current-value",
      };
    }

    const previousGroup = groupedByYear.get(fiscalYear - 1);
    if (!previousGroup) {
      return {
        state: "unavailable",
        fiscalYear,
        current,
        reason: index === 0 ? "no-prior-year" : "missing-prior-year",
      };
    }

    if (previousGroup.length > 1) {
      return {
        state: "unavailable",
        fiscalYear,
        current,
        reason: "duplicate-prior-year",
      };
    }

    const previous = previousGroup[0];
    if (!hasValidRevenueValue(previous)) {
      return {
        state: "unavailable",
        fiscalYear,
        current,
        reason: "invalid-prior-value",
      };
    }

    if (previous.value === 0) {
      return { state: "unavailable", fiscalYear, current, reason: "zero-base" };
    }

    const absoluteChange = current.value - previous.value;

    return {
      state: "available",
      fiscalYear,
      current,
      previous,
      absoluteChange,
      percentageChange: (absoluteChange / previous.value) * 100,
      direction: directionFor(absoluteChange),
    };
  });

  return [...invalidYearRows, ...validYearRows];
}

export function formatRevenueGrowthRate(percentageChange: number): string {
  if (percentageChange === 0 || Object.is(percentageChange, -0)) return "0.0%";

  const absoluteRate = Math.abs(percentageChange);
  if (absoluteRate < 0.05) {
    return percentageChange > 0 ? "+<0.1%" : "−<0.1%";
  }

  const sign = percentageChange > 0 ? "+" : "−";
  return `${sign}${oneDecimalRate.format(absoluteRate)}%`;
}
