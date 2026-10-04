import type { CSSProperties } from "react";

import type { CompanyRevenueRecord } from "@/lib/company-revenue-data";
import { moveRevenueSelection } from "@/lib/revenue-dossier";

import styles from "./metric-dossier.module.css";

const compactBillions = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function formatBillions(value: number): string {
  return `${compactBillions.format(value / 1_000_000_000)}B`;
}

export function PeriodSelector({
  onSelect,
  records,
  selectedFiscalYear,
}: {
  onSelect: (fiscalYear: number) => void;
  records: CompanyRevenueRecord[];
  selectedFiscalYear: number;
}) {
  const maximum = Math.max(...records.map((record) => record.fact.value), 1);

  return (
    <fieldset className={styles.periodSelector}>
      <legend>Annual Revenue trace</legend>
      <p id="revenue-scale" className={styles.scaleNote}>
        Scale: USD billions · baseline $0B · maximum {formatBillions(maximum)}
      </p>

      <div className={styles.chart} aria-describedby="revenue-scale">
        <div className={styles.axis} aria-hidden="true">
          <span>{formatBillions(maximum)}</span>
          <span>$0B</span>
        </div>
        <div className={styles.plotScroller}>
          <div className={styles.plots}>
            {records.map((record) => {
              const { fact } = record;
              const isSelected = fact.fiscalYear === selectedFiscalYear;
              const barStyle = {
                "--bar-height": `${(fact.value / maximum) * 100}%`,
              } as CSSProperties;

              return (
                <label
                  className={styles.period}
                  data-selected={isSelected}
                  key={fact.fiscalYear}
                >
                  <input
                    checked={isSelected}
                    name="revenue-period"
                    onChange={() => onSelect(fact.fiscalYear)}
                    onKeyDown={(event) => {
                      if (event.key === " " || event.key === "Enter") {
                        event.preventDefault();
                        onSelect(fact.fiscalYear);
                        return;
                      }
                      const direction =
                        event.key === "ArrowRight" || event.key === "ArrowDown"
                          ? 1
                          : event.key === "ArrowLeft" || event.key === "ArrowUp"
                            ? -1
                            : null;
                      if (direction === null) return;
                      event.preventDefault();
                      const nextFiscalYear = moveRevenueSelection(
                        records,
                        fact.fiscalYear,
                        direction,
                      );
                      const fieldset = event.currentTarget.closest("fieldset");
                      fieldset
                        ?.querySelector<HTMLInputElement>(
                          `input[value="${nextFiscalYear}"]`,
                        )
                        ?.focus();
                      onSelect(nextFiscalYear);
                    }}
                    type="radio"
                    value={fact.fiscalYear}
                  />
                  <span className={styles.barTrack} aria-hidden="true">
                    <i style={barStyle} />
                  </span>
                  <strong>FY{fact.fiscalYear}</strong>
                  <small>{formatBillions(fact.value)}</small>
                  <span className={styles.selectedMarker}>
                    {isSelected ? "Selected" : "Select"}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </fieldset>
  );
}
