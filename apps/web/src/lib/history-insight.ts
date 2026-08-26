import type { AnnualFinancialFact } from "@/lib/api";

export type YearOverYearObservation = {
  previous: AnnualFinancialFact;
  current: AnnualFinancialFact;
  absoluteChange: number;
  percentageChange: number;
  direction: "increase" | "decrease" | "unchanged";
  selectionRule: "largest-decline-in-mixed-series" | "largest-absolute-change";
};

function directionFor(change: number): YearOverYearObservation["direction"] {
  if (change > 0) return "increase";
  if (change < 0) return "decrease";
  return "unchanged";
}

export function buildYearOverYearObservations(
  series: AnnualFinancialFact[],
): Omit<YearOverYearObservation, "selectionRule">[] {
  const orderedSeries = [...series].sort(
    (left, right) => left.fiscalYear - right.fiscalYear,
  );

  return orderedSeries.slice(1).map((current, index) => {
    const previous = orderedSeries[index];
    const absoluteChange = current.value - previous.value;

    return {
      previous,
      current,
      absoluteChange,
      percentageChange:
        previous.value === 0 ? 0 : (absoluteChange / previous.value) * 100,
      direction: directionFor(absoluteChange),
    };
  });
}

export function selectGuidedRevenueObservation(
  series: AnnualFinancialFact[],
): YearOverYearObservation | null {
  const observations = buildYearOverYearObservations(series);
  if (observations.length === 0) return null;

  const declines = observations.filter(
    (observation) => observation.direction === "decrease",
  );
  const hasIncrease = observations.some(
    (observation) => observation.direction === "increase",
  );

  if (hasIncrease && declines.length > 0) {
    const largestDecline = declines.reduce((selected, candidate) =>
      candidate.percentageChange < selected.percentageChange ? candidate : selected,
    );

    return {
      ...largestDecline,
      selectionRule: "largest-decline-in-mixed-series",
    };
  }

  const largestAbsoluteChange = observations.reduce((selected, candidate) =>
    Math.abs(candidate.percentageChange) > Math.abs(selected.percentageChange)
      ? candidate
      : selected,
  );

  return {
    ...largestAbsoluteChange,
    selectionRule: "largest-absolute-change",
  };
}
