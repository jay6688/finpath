"use client";

import { useId, type CSSProperties } from "react";

import type { IncomeStatementLineId } from "@/lib/api";
import type {
  ProfitLedgerLine,
  ProfitLedgerPresentation,
  ProfitLedgerTransformation,
} from "@/lib/profit-learning";

import styles from "./quantitative-ledger.module.css";

type LineCopy = Record<
  IncomeStatementLineId,
  { helper: string; reportedLabel: string }
>;

type TransformationCopy = Record<
  ProfitLedgerTransformation["id"],
  {
    boundary: string;
    explanation: string;
    shortLabel: string;
    summary: string;
  }
>;

type QuantitativeLedgerProps = {
  context: string;
  inspectedIds: readonly ProfitLedgerTransformation["id"][];
  lineCopy: LineCopy;
  model: ProfitLedgerPresentation;
  onSelect: (id: ProfitLedgerTransformation["id"]) => void;
  scaleNote: string;
  selectedId: ProfitLedgerTransformation["id"];
  title: string;
  transformationCopy: TransformationCopy;
};

const exactBillions = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

function formatBillions(value: number): string {
  return `${exactBillions.format(Math.abs(value) / 1_000_000_000)}B`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(value < 1 ? 2 : 1)}%`;
}

function formatAdjustment(
  transformation: ProfitLedgerTransformation,
): string {
  const formatted = formatBillions(transformation.adjustment.reportedAmount);
  if (transformation.effectSign === "negative") return `(${formatted})`;
  if (transformation.effectSign === "positive") return `+${formatted}`;
  return formatted;
}

export function SignedAdjustmentMarker({
  line,
  onSelect,
  selected,
}: {
  line: ProfitLedgerLine;
  onSelect: () => void;
  selected: boolean;
}) {
  const position = line.locatorPositionPercentOfRevenue;
  if (position === undefined) return null;

  return (
    <button
      aria-label={`${line.reportedSign} signed adjustment, ${formatPercent(line.presentationShareOfRevenue)} of Revenue`}
      aria-pressed={selected}
      className={styles.markerTarget}
      data-selected={selected}
      onClick={onSelect}
      style={{ "--ledger-position": position } as CSSProperties}
      type="button"
    >
      <span className={styles.markerRule} aria-hidden="true" />
    </button>
  );
}

export function QuantitativeLedger({
  context,
  inspectedIds,
  lineCopy,
  model,
  onSelect,
  scaleNote,
  selectedId,
  title,
  transformationCopy,
}: QuantitativeLedgerProps) {
  const headingId = useId();
  const summaryId = useId();
  const selected = model.transformations.find(
    (transformation) => transformation.id === selectedId,
  );
  const other = model.composition.find(
    (line) => line.id === "other-income-expense-net",
  );

  if (!selected || !other) {
    throw new RangeError("The Profit Ledger requires its selected and signed lines.");
  }

  const selectedCopy = transformationCopy[selected.id];

  return (
    <section className={styles.ledger} aria-labelledby={headingId}>
      <header className={styles.heading}>
        <div>
          <p>100% Ledger</p>
          <h2 id={headingId}>{title}</h2>
        </div>
        <span>{context}</span>
      </header>

      <p className={styles.scaleNote}>{scaleNote}</p>
      <p className="sr-only" id={summaryId}>
        Revenue is 100%. Cost of Sales, Operating Expenses, the signed Other
        adjustment, Tax and the Net Income remainder are all shown relative to
        that same Revenue amount.
      </p>

      <figure className={styles.figure} aria-describedby={summaryId}>
        <figcaption className={styles.reference}>
          <span>
            <small>Common reference</small>
            <strong>Revenue</strong>
          </span>
          <span>
            <strong>{formatBillions(model.revenue.reportedAmount)}</strong>
            <small>100% of Revenue</small>
          </span>
        </figcaption>

        <div className={styles.referenceBar} aria-hidden="true" />
        <div className={styles.compositionCanvas}>
          <div className={styles.composition} aria-hidden="true">
            {model.composition.map((line) => (
              <span
                className={
                  line.geometryKind === "locator"
                    ? styles.locatorSpace
                    : styles.segment
                }
                data-line-id={line.id}
                data-selected={line.id === selectedId}
                key={line.id}
                style={
                  {
                    "--ledger-share": line.presentationShareOfRevenue,
                  } as CSSProperties
                }
              />
            ))}
          </div>
          <SignedAdjustmentMarker
            line={other}
            onSelect={() => onSelect("other-income-expense-net")}
            selected={selectedId === "other-income-expense-net"}
          />
        </div>

        <div className={styles.legend}>
          {model.transformations.map((transformation) => {
            const copy = transformationCopy[transformation.id];
            const inspected = inspectedIds.includes(transformation.id);
            return (
              <button
                aria-pressed={selectedId === transformation.id}
                className={styles.lineControl}
                data-inspected={inspected}
                data-line-id={transformation.id}
                data-selected={selectedId === transformation.id}
                key={transformation.id}
                onClick={() => onSelect(transformation.id)}
                type="button"
              >
                <span>
                  <strong>{copy.shortLabel}</strong>
                  <small>
                    {transformation.adjustment.semanticRole ===
                    "signed-adjustment"
                      ? `${formatPercent(transformation.adjustment.presentationShareOfRevenue)} · ${transformation.effectSign} signed adjustment`
                      : `${formatPercent(transformation.adjustment.presentationShareOfRevenue)} of Revenue`}
                  </small>
                </span>
                <b>
                  {transformation.adjustment.semanticRole === "signed-adjustment"
                    ? formatAdjustment(transformation)
                    : formatBillions(transformation.adjustment.reportedAmount)}
                </b>
                <em>{inspected ? "Inspected" : "Inspect"}</em>
              </button>
            );
          })}

          <div className={styles.result} data-line-id={model.result.id}>
            <span>
              <strong>{lineCopy[model.result.id].reportedLabel}</strong>
              <small>Result / remainder</small>
            </span>
            <b>{formatBillions(model.result.reportedAmount)}</b>
            <em>{formatPercent(model.result.presentationShareOfRevenue)} of Revenue</em>
          </div>
        </div>
      </figure>

      <aside
        aria-label="Selected accounting transformation"
        aria-live="polite"
        className={styles.transformation}
      >
        <header>
          <div>
            <p>Selected transformation</p>
            <h3>{selectedCopy.summary}</h3>
          </div>
          <span>
            {selected.operation === "add-signed"
              ? `Signed adjustment · ${selected.effectSign}`
              : "Deduction"}
          </span>
        </header>

        <div className={styles.equation}>
          <span>
            <small>Before</small>
            <strong>{formatBillions(selected.before.reportedAmount)}</strong>
            <em>{lineCopy[selected.before.id].reportedLabel}</em>
          </span>
          <i aria-hidden="true">→</i>
          <span data-role={selected.adjustment.semanticRole}>
            <small>Adjustment</small>
            <strong>{formatAdjustment(selected)}</strong>
            <em>{lineCopy[selected.adjustment.id].reportedLabel}</em>
          </span>
          <i aria-hidden="true">→</i>
          <span>
            <small>After</small>
            <strong>{formatBillions(selected.after.reportedAmount)}</strong>
            <em>{lineCopy[selected.after.id].reportedLabel}</em>
          </span>
        </div>

        <p>{selectedCopy.explanation}</p>
        <p className={styles.boundary}>
          <strong>Boundary</strong>
          {selectedCopy.boundary}
        </p>
      </aside>
    </section>
  );
}
