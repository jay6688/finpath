"use client";

import { useId, type CSSProperties } from "react";

import type {
  MarginPresentation,
  MarginSemanticAnchor,
} from "@/lib/profit-margin";

import styles from "./revenue-ruler.module.css";

type AnchorCopy = Record<
  MarginSemanticAnchor["id"],
  { label: string; meaning: string }
>;

type RevenueRulerProps = {
  anchorCopy: AnchorCopy;
  context: string;
  normalizedLabel: string;
  onSelect: (id: MarginSemanticAnchor["id"]) => void;
  presentation: MarginPresentation;
  remainingBoundary: string;
  selectedAnchorId: MarginSemanticAnchor["id"];
  title: string;
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

export function RevenueRuler({
  anchorCopy,
  context,
  normalizedLabel,
  onSelect,
  presentation,
  remainingBoundary,
  selectedAnchorId,
  title,
}: RevenueRulerProps) {
  const headingId = useId();
  const explanationId = useId();
  const percentDisplay = presentation.ratio.displayPercent.toFixed(1);
  const perHundredDisplay =
    presentation.normalizedPerHundred.displayAmount.toFixed(2);
  const selectedCopy = anchorCopy[selectedAnchorId];
  const textualEquivalent = `Revenue is the 100 percent reference. Net Income of ${formatBillions(presentation.netIncome.amount)} is ${percentDisplay} percent of Revenue of ${formatBillions(presentation.revenue.amount)}, or about $${perHundredDisplay} of Net Income for every normalized $100 of Revenue.`;

  return (
    <section className={styles.ruler} aria-labelledby={headingId}>
      <header className={styles.heading}>
        <div>
          <p>Revenue Ruler · measured share</p>
          <h2 id={headingId}>{title}</h2>
        </div>
        <span>{context}</span>
      </header>

      <div className={styles.meaning}>
        <div>
          <small>Net Profit Margin · FinPath-derived</small>
          <strong>{percentDisplay}%</strong>
        </div>
        <p>
          For every <strong>$100 of Revenue</strong>, Net Income was about{" "}
          <strong>${perHundredDisplay}</strong>.
        </p>
      </div>

      {presentation.ruler.state === "supported" ? (
        <figure className={styles.figure}>
          <figcaption>
            <span>{normalizedLabel}</span>
            <strong>Revenue = 100%</strong>
          </figcaption>

          <div
            aria-label={textualEquivalent}
            className={styles.scale}
            data-selected-anchor={selectedAnchorId}
            role="img"
            style={
              {
                "--margin-geometry": presentation.ruler.geometryPercent,
              } as CSSProperties
            }
          >
            <span className={styles.measuredShare} aria-hidden="true" />
            <span className={styles.endpoint} aria-hidden="true" />
          </div>

          <div
            aria-hidden="true"
            className={styles.scaleLabels}
            style={
              {
                "--margin-geometry": presentation.ruler.geometryPercent,
              } as CSSProperties
            }
          >
            <span>$0</span>
            <span className={styles.endpointLabel}>${perHundredDisplay}</span>
            <span>$100</span>
          </div>

          <div className={styles.scaleKey}>
            <span><i data-kind="measured" />Net Income share</span>
            <span><i data-kind="outside" />{remainingBoundary}</span>
          </div>
        </figure>
      ) : (
        <div className={styles.unsupported} role="status">
          <strong>This ratio is outside this 0–100% teaching ruler.</strong>
          <p>
            The exact derived margin remains available, but FinPath does not
            clamp or invent geometry for this range.
          </p>
        </div>
      )}

      <div className={styles.anchorGrid} aria-label="Inspect the margin relationship">
        {presentation.anchors.map((anchor) => {
          const selected = anchor.id === selectedAnchorId;
          return (
            <button
              aria-describedby={selected ? explanationId : undefined}
              aria-pressed={selected}
              data-anchor-id={anchor.id}
              data-selected={selected}
              key={anchor.id}
              onClick={() => onSelect(anchor.id)}
              type="button"
            >
              <span>{anchorCopy[anchor.id].label}</span>
              <em>{selected ? "Selected" : "Inspect"}</em>
            </button>
          );
        })}
      </div>

      <aside
        aria-live="polite"
        className={styles.explanation}
        id={explanationId}
      >
        <p>Selected relationship</p>
        <h3>{selectedCopy.label}</h3>
        <span>{selectedCopy.meaning}</span>
      </aside>

      <section className={styles.derivation} aria-labelledby={`${headingId}-derivation`}>
        <header>
          <p id={`${headingId}-derivation`}>Derivation trace</p>
          <span>Reported inputs → FinPath-derived ratio</span>
        </header>
        <div>
          <span>
            <small>Net Income</small>
            <strong>{formatBillions(presentation.netIncome.amount)}</strong>
            <em>Reported</em>
          </span>
          <i aria-hidden="true">÷</i>
          <span>
            <small>Revenue</small>
            <strong>{formatBillions(presentation.revenue.amount)}</strong>
            <em>Reported</em>
          </span>
          <i aria-hidden="true">× 100 =</i>
          <span>
            <small>Net Profit Margin</small>
            <strong>{percentDisplay}%</strong>
            <em>FinPath-derived</em>
          </span>
        </div>
      </section>
    </section>
  );
}
