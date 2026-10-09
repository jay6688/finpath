"use client";

import { useState, type CSSProperties } from "react";

import { EvidenceInspector } from "@/components/evidence-inspector";
import { useLearningProgress } from "@/components/learning-progress-provider";
import styles from "@/components/revenue-growth-explorer.module.css";
import type { AnnualFinancialFact, CompanyOverview } from "@/lib/api";
import {
  buildRevenueGrowthEvidence,
  type DerivedEvidence,
  type ReviewedPresentation,
} from "@/lib/evidence";
import {
  buildRevenueGrowthGeometry,
  buildRevenueGrowthRows,
  formatRevenueGrowthRate,
  type RevenueGrowthRow,
} from "@/lib/history-insight";

type Props = {
  company: CompanyOverview["company"];
  currency: string;
  dataStatus: CompanyOverview["dataStatus"];
  defaultFiscalYear: number;
  reviewedPresentation?: ReviewedPresentation | null;
  series: AnnualFinancialFact[];
  taxonomyTag: string;
};

const exactBillions = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

function formatBillions(value: number): string {
  return `${exactBillions.format(value / 1_000_000_000)}B`;
}

function formatSignedBillions(value: number): string {
  if (value === 0) return formatBillions(0);
  return `${value > 0 ? "+" : "−"}${formatBillions(Math.abs(value))}`;
}

function comparisonLabel(row: Extract<RevenueGrowthRow, { state: "available" }>) {
  return `FY${row.previous.fiscalYear} → FY${row.current.fiscalYear}`;
}

export function RevenueGrowthExplorer({
  company,
  currency,
  dataStatus,
  defaultFiscalYear,
  reviewedPresentation,
  series,
  taxonomyTag,
}: Props) {
  const { markExplored } = useLearningProgress();
  const rows = buildRevenueGrowthRows(series);
  const availableRows = rows.filter(
    (row): row is Extract<RevenueGrowthRow, { state: "available" }> =>
      row.state === "available",
  );
  const geometry = buildRevenueGrowthGeometry(rows);
  const initialRow =
    availableRows.find((row) => row.fiscalYear === defaultFiscalYear) ??
    availableRows.at(-1);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState(
    initialRow?.fiscalYear ?? null,
  );
  const [finished, setFinished] = useState(false);
  const selectedRow =
    availableRows.find((row) => row.fiscalYear === selectedFiscalYear) ?? initialRow;
  const selectedBridge = geometry.bridges.find(
    (bridge) => bridge.fiscalYear === selectedRow?.fiscalYear,
  );
  let growthEvidence: DerivedEvidence | null = null;

  if (selectedRow) {
    try {
      growthEvidence = buildRevenueGrowthEvidence({
        row: selectedRow,
        company,
        currency,
        taxonomyTag,
        dataStatus,
        reviewedPresentation,
      });
    } catch {
      // Withhold a calculation trail when either reported input fails validation.
    }
  }

  if (!selectedRow || !selectedBridge) {
    return (
      <p className={styles.unavailable} role="status">
        No valid year-over-year Revenue comparison is available. FinPath will
        not invent a prior-period denominator.
      </p>
    );
  }

  return (
    <article className={styles.lesson} id="revenue-growth" aria-labelledby="growth-question">
      <header className={styles.introduction}>
        <p className="eyebrow">Two-period growth bridge</p>
        <h2 id="growth-question">How much did Revenue change relative to the earlier period?</h2>
        <p>
          Year-over-year (YoY) Revenue Growth is the percentage change from the
          previous fiscal year. The dollar change and the percentage answer
          different questions.
        </p>
      </header>

      <div className={styles.periodControls} role="group" aria-label="Revenue comparison period">
        {availableRows.map((row) => (
          <button
            aria-pressed={selectedRow.fiscalYear === row.fiscalYear}
            key={row.fiscalYear}
            onClick={() => setSelectedFiscalYear(row.fiscalYear)}
            type="button"
          >
            {comparisonLabel(row)}
          </button>
        ))}
      </div>

      <section className={styles.bridge} aria-labelledby="growth-bridge-heading" aria-live="polite">
        <div className={styles.bridgeHeading}>
          <div>
            <span className={styles.derived}>FinPath-derived comparison</span>
            <h3 id="growth-bridge-heading">{comparisonLabel(selectedRow)}</h3>
          </div>
          <strong data-direction={selectedRow.direction}>
            {formatRevenueGrowthRate(selectedRow.percentageChange)}
          </strong>
        </div>

        <dl className={styles.amounts}>
          <div>
            <dt>Previous Revenue · denominator</dt>
            <dd>{formatBillions(selectedRow.previous.value)}</dd>
            <small>Reported · FY{selectedRow.previous.fiscalYear}</small>
          </div>
          <div>
            <dt>Current Revenue</dt>
            <dd>{formatBillions(selectedRow.current.value)}</dd>
            <small>Reported · FY{selectedRow.current.fiscalYear}</small>
          </div>
          <div>
            <dt>Dollar change</dt>
            <dd>{formatSignedBillions(selectedRow.absoluteChange)}</dd>
            <small>FinPath-derived</small>
          </div>
          <div>
            <dt>Growth rate</dt>
            <dd>{formatRevenueGrowthRate(selectedRow.percentageChange)}</dd>
            <small>FinPath-derived</small>
          </div>
        </dl>

        <div className={styles.signedScale}>
          <div className={styles.scaleLabels}>
            <span>Decrease</span><span>0%</span><span>Increase</span>
          </div>
          <div
            className={styles.scaleTrack}
            data-direction={selectedBridge.direction}
            style={{ "--change-extent": `${selectedBridge.extentPercent}%` } as CSSProperties}
          >
            <span className={styles.zeroLine} aria-hidden="true" />
            <span className={styles.changeBar} aria-hidden="true" />
            <span className={styles.changeMarker} aria-hidden="true" />
          </div>
          <p>
            Shared history scale: ±{formatRevenueGrowthRate(geometry.referencePercent).replace("+", "")};
            selected raw growth is {formatRevenueGrowthRate(selectedBridge.rawPercent)}.
          </p>
        </div>

        <div className={styles.formula} aria-label="Revenue Growth formula">
          <span>Current Revenue − Previous Revenue</span>
          <span>÷ Previous Revenue × 100</span>
          <strong>= {formatRevenueGrowthRate(selectedRow.percentageChange)}</strong>
        </div>

        <p className={styles.misconception}>
          Learners sometimes read “{formatRevenueGrowthRate(selectedRow.percentageChange)} growth”
          as that percentage of current Revenue. It is not: the earlier Revenue is
          the denominator and reference. It does not show Profit or explain why
          Revenue changed.
        </p>
      </section>

      {growthEvidence ? (
        <EvidenceInspector
          evidence={growthEvidence}
          id={`revenue-growth-evidence-${selectedRow.current.fiscalYear}`}
        />
      ) : null}

      <details className={styles.sourceNote}>
        <summary>Comparison filing identities</summary>
        <div>
          <p>
            Each reported amount retains its SEC fact and accession. Comparative
            figures may be presented again in a later filing; FinPath does not
            pretend every fiscal year necessarily comes from a separate filing.
          </p>
          <dl>
            <div><dt>Previous accession</dt><dd>{selectedRow.previous.accession}</dd></div>
            <div><dt>Current accession</dt><dd>{selectedRow.current.accession}</dd></div>
          </dl>
        </div>
      </details>

      <section className={styles.completion} aria-labelledby="growth-completion-heading">
        <div>
          <p className="eyebrow">Complete the comparison</p>
          <h3 id="growth-completion-heading">Name both the dollar change and its prior-period reference.</h3>
          <p>Changing the selected periods does not write learning progress.</p>
        </div>
        <button
          disabled={finished}
          onClick={() => {
            markExplored(["revenue-growth"]);
            setFinished(true);
          }}
          type="button"
        >
          {finished ? "Comparison explored" : "I understand the two-period bridge"}
        </button>
      </section>
    </article>
  );
}
