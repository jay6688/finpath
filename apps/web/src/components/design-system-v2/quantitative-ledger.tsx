"use client";

import { useId, type CSSProperties } from "react";

import styles from "./quantitative-ledger.module.css";

export type LedgerLine = {
  id: string;
  label: string;
  displayValue: string;
  percentOfRevenue: number;
  role: "revenue" | "deduction" | "subtotal" | "signed-adjustment" | "final-total";
  sign?: "positive" | "negative";
  before?: { label: string; displayValue: string };
  after?: { label: string; displayValue: string };
};

function validatePercent(percent: number) {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new RangeError("percentOfRevenue must be validated presentation geometry from 0 to 100");
  }
}

export function SignedAdjustmentMarker({ percentOfRevenue, sign, label }: { percentOfRevenue: number; sign: "positive" | "negative"; label: string }) {
  validatePercent(percentOfRevenue);
  return (
    <span className={styles.adjustmentMarker} data-sign={sign} style={{ "--ledger-percent": percentOfRevenue } as CSSProperties}>
      <i aria-hidden="true" />
      <span>{label}: {sign} {percentOfRevenue.toFixed(2)}% of Revenue</span>
    </span>
  );
}

export function QuantitativeLedger({ title, context, lines, selectedId, onSelect }: {
  title: string;
  context: string;
  lines: LedgerLine[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const headingId = useId();
  const selected = lines.find((line) => line.id === selectedId);
  if (!selected) throw new RangeError(`QuantitativeLedger selectedId ${selectedId} is not present in lines`);
  lines.forEach((line) => validatePercent(line.percentOfRevenue));

  return (
    <section className={styles.ledger} aria-labelledby={headingId}>
      <header><div><p>100% Ledger</p><h2 id={headingId}>{title}</h2></div><span>{context}</span></header>
      <p className={styles.scaleNote}>Every quantitative length uses Revenue as the same 100% reference.</p>
      <ol className={styles.lines}>
        {lines.map((line) => {
          const style = { "--ledger-percent": line.percentOfRevenue } as CSSProperties;
          return (
            <li key={line.id} data-role={line.role} data-selected={line.id === selectedId}>
              <button type="button" aria-pressed={line.id === selectedId} onClick={() => onSelect(line.id)}>
                <span className={styles.lineLabel}><strong>{line.label}</strong><small>{line.role === "signed-adjustment" ? "Signed adjustment" : `${line.percentOfRevenue.toFixed(line.percentOfRevenue < 1 ? 2 : 1)}% of Revenue`}</small></span>
                <span className={styles.measure} style={style}>
                  {line.role === "signed-adjustment" ? <SignedAdjustmentMarker percentOfRevenue={line.percentOfRevenue} sign={line.sign ?? "positive"} label={line.label} /> : <i aria-hidden="true" />}
                </span>
                <b>{line.displayValue}</b>
              </button>
            </li>
          );
        })}
      </ol>
      <div className={styles.transformation} aria-live="polite">
        <p>Selected trace</p>
        {selected.before && selected.after ? (
          <div>
            <span><small>Before</small><strong>{selected.before.displayValue}</strong><em>{selected.before.label}</em></span>
            <i aria-hidden="true">→</i>
            <span data-role={selected.role}><small>Adjustment</small><strong>{selected.displayValue}</strong><em>{selected.label}</em></span>
            <i aria-hidden="true">→</i>
            <span><small>After</small><strong>{selected.after.displayValue}</strong><em>{selected.after.label}</em></span>
          </div>
        ) : <strong>{selected.label}: {selected.displayValue}</strong>}
      </div>
    </section>
  );
}
