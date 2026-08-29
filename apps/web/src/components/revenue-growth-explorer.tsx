"use client";

import { useState, type CSSProperties } from "react";

import type { AnnualFinancialFact } from "@/lib/api";
import {
  buildRevenueGrowthRows,
  formatRevenueGrowthRate,
  type RevenueGrowthRow,
  type RevenueGrowthUnavailableReason,
} from "@/lib/history-insight";

type RevenueGrowthExplorerProps = {
  defaultFiscalYear: number;
  series: AnnualFinancialFact[];
};

const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const exactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const exactBillions = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const sixDecimals = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 6,
  maximumFractionDigits: 6,
});

function formatBillions(value: number): string {
  return `${exactBillions.format(value / 1_000_000_000)}B`;
}

function formatSignedBillions(value: number): string {
  if (value === 0) return formatBillions(0);
  return `${value > 0 ? "+" : "−"}${formatBillions(Math.abs(value))}`;
}

function formatDetailedRate(value: number): string {
  if (value === 0 || Object.is(value, -0)) return "0.000000%";
  return `${value > 0 ? "+" : "−"}${sixDecimals.format(Math.abs(value))}%`;
}

function unavailableCopy(reason: RevenueGrowthUnavailableReason): string {
  switch (reason) {
    case "invalid-fiscal-year":
      return "Not comparable — fiscal year is invalid";
    case "no-prior-year":
      return "No previous year in this history";
    case "missing-prior-year":
      return "Not comparable — previous fiscal year is missing";
    case "duplicate-current-year":
      return "Not comparable — duplicate records for this year";
    case "duplicate-prior-year":
      return "Not comparable — duplicate records in the base year";
    case "invalid-current-value":
      return "Not comparable — this Revenue value is invalid";
    case "invalid-prior-value":
      return "Not comparable — the base Revenue value is invalid";
    case "zero-base":
      return "Not comparable — the previous Revenue is zero";
  }
}

function directionCopy(row: Extract<RevenueGrowthRow, { state: "available" }>): string {
  if (row.direction === "increase") return "Up";
  if (row.direction === "decrease") return "Down";
  return "No change";
}

function changeVerb(row: Extract<RevenueGrowthRow, { state: "available" }>): string {
  if (row.direction === "increase") return "increased";
  if (row.direction === "decrease") return "decreased";
  return "did not change";
}

function accessibleRateCopy(percentageChange: number): string {
  const absoluteRate = Math.abs(percentageChange);
  if (absoluteRate > 0 && absoluteRate < 0.05) return "less than 0.1 percent";
  return `${absoluteRate.toFixed(1)} percent`;
}

export function RevenueGrowthExplorer({
  defaultFiscalYear,
  series,
}: RevenueGrowthExplorerProps) {
  const rows = buildRevenueGrowthRows(series);
  const availableRows = rows.filter(
    (row): row is Extract<RevenueGrowthRow, { state: "available" }> =>
      row.state === "available",
  );
  const defaultRow =
    availableRows.find((row) => row.fiscalYear === defaultFiscalYear) ??
    availableRows[0];
  const [selectedFiscalYear, setSelectedFiscalYear] = useState(
    defaultRow?.fiscalYear ?? null,
  );
  const selectedRow =
    availableRows.find((row) => row.fiscalYear === selectedFiscalYear) ?? defaultRow;
  const validValues = rows.flatMap((row) =>
    row.current && Number.isFinite(row.current.value) && row.current.value >= 0
      ? [row.current.value]
      : [],
  );
  const largestValue = validValues.length > 0 ? Math.max(...validValues) : 0;

  return (
    <section className="growth-explorer" aria-labelledby="growth-explorer-heading">
      <header className="revenue-chart__heading">
        <div>
          <h3 id="growth-explorer-heading">Revenue, year by year</h3>
          <p>
            Year-over-year (YoY) Revenue Growth is the percentage change from the
            previous fiscal year.
          </p>
        </div>
        <span>USD billions</span>
      </header>

      <div
        aria-label="Annual Revenue and year-over-year growth"
        className="growth-periods"
        role="group"
        style={{ "--growth-column-count": Math.max(rows.length, 1) } as CSSProperties}
      >
        {rows.map((row, index) => {
          const currentValue = row.current?.value;
          const canShowValue =
            typeof currentValue === "number" &&
            Number.isFinite(currentValue) &&
            currentValue >= 0;
          const relativeHeight =
            canShowValue && largestValue > 0 ? currentValue / largestValue : 0;
          const style = {
            "--bar-height": `${
              canShowValue && currentValue > 0
                ? Math.max(relativeHeight * 100, 8)
                : 0
            }%`,
          } as CSSProperties;
          const content = (
            <>
              <span className="growth-period__value">
                {canShowValue ? compactCurrency.format(currentValue) : "Unavailable"}
              </span>
              <span className="growth-period__bar-track" aria-hidden="true">
                <span className="growth-period__bar" style={style} />
              </span>
              <span className="growth-period__year">
                {row.fiscalYear === null ? "FY unavailable" : `FY${row.fiscalYear}`}
              </span>
              <span className="growth-period__rate">
                {row.state === "available" ? (
                  <>
                    <strong>{directionCopy(row)}</strong>{" "}
                    {formatRevenueGrowthRate(row.percentageChange).replace(/^[+−]/, "")}
                  </>
                ) : (
                  unavailableCopy(row.reason)
                )}
              </span>
            </>
          );

          return row.state === "available" ? (
            <button
              aria-label={`FY${row.fiscalYear}: Revenue ${compactCurrency.format(row.current.value)}, ${directionCopy(row).toLowerCase()} ${accessibleRateCopy(row.percentageChange)} year over year. Show this calculation.`}
              aria-pressed={selectedRow?.fiscalYear === row.fiscalYear}
              className="growth-period growth-period--available"
              key={`${row.fiscalYear}-${index}`}
              onClick={() => setSelectedFiscalYear(row.fiscalYear)}
              type="button"
            >
              {content}
            </button>
          ) : (
            <div
              className="growth-period growth-period--unavailable"
              key={`${row.fiscalYear}-${index}`}
            >
              {content}
            </div>
          );
        })}
      </div>

      {selectedRow ? (
        <section
          aria-labelledby="growth-calculation-heading"
          className="growth-calculation"
        >
          <p className="sr-only" aria-live="polite">
            Showing the Revenue Growth calculation from FY
            {selectedRow.previous.fiscalYear} to FY{selectedRow.current.fiscalYear}.
          </p>
          <div className="growth-calculation__heading">
            <div>
              <p className="eyebrow">
                Compare FY{selectedRow.previous.fiscalYear} → FY
                {selectedRow.current.fiscalYear}
              </p>
              <h4 id="growth-calculation-heading">
                Revenue {changeVerb(selectedRow)} by{" "}
                {formatBillions(Math.abs(selectedRow.absoluteChange))}
              </h4>
            </div>
            <strong data-direction={selectedRow.direction}>
              {formatRevenueGrowthRate(selectedRow.percentageChange)}
              <small>YoY Growth</small>
            </strong>
          </div>

          <dl className="growth-calculation__values">
            <div>
              <dt>Previous Revenue · base</dt>
              <dd>{formatBillions(selectedRow.previous.value)}</dd>
            </div>
            <div>
              <dt>Current Revenue</dt>
              <dd>{formatBillions(selectedRow.current.value)}</dd>
            </div>
            <div>
              <dt>Dollar change</dt>
              <dd>{formatSignedBillions(selectedRow.absoluteChange)}</dd>
            </div>
          </dl>

          <p className="growth-calculation__explanation">
            FY{selectedRow.previous.fiscalYear} is the base. The percentage measures
            the change against that earlier Revenue. It does not show Profit or explain
            why Revenue changed.
          </p>

          <details className="growth-formula">
            <summary>
              How FinPath calculated {formatRevenueGrowthRate(selectedRow.percentageChange)}
            </summary>
            <p className="growth-formula__rule">
              (Current Revenue − Previous Revenue) ÷ Previous Revenue × 100
            </p>
            <p className="growth-formula__numbers">
              ({exactCurrency.format(selectedRow.current.value)} −{" "}
              {exactCurrency.format(selectedRow.previous.value)}) ÷{" "}
              {exactCurrency.format(selectedRow.previous.value)} × 100 ={" "}
              {formatDetailedRate(selectedRow.percentageChange)}
            </p>
            <small>
              Calculated from the reported values. The history rounds growth to one
              decimal place; exact source records remain below.
            </small>
          </details>
        </section>
      ) : (
        <p className="growth-calculation growth-calculation--unavailable" role="status">
          No valid year-over-year Revenue comparison is available in this history.
        </p>
      )}
    </section>
  );
}
