"use client";

import { useState, type CSSProperties, type FormEvent } from "react";

import { EvidenceInspector } from "@/components/evidence-inspector";
import { useLearningProgress } from "@/components/learning-progress-provider";
import type { CompanyBalanceSheet } from "@/lib/api";
import {
  buildBalanceSheetEvidence,
  type CashDebtPresentation,
} from "@/lib/balance-sheet-learning";

import styles from "./cash-debt-learning.module.css";

type Props = {
  balanceSheet: CompanyBalanceSheet;
  presentation: CashDebtPresentation;
};

const billions = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

function formatBillions(value: number): string {
  return `${billions.format(value / 1_000_000_000)}B`;
}

function positionStyle(magnitudePercent: number): CSSProperties {
  return { "--position-magnitude": magnitudePercent } as CSSProperties;
}

export function CashDebtLearning({ balanceSheet, presentation }: Props) {
  const { markExplored } = useLearningProgress();
  const { company, statement, dataStatus } = balanceSheet;
  const evidence = buildBalanceSheetEvidence(balanceSheet);
  const [selectedPosition, setSelectedPosition] = useState<"cash" | "borrowings" | null>(
    null,
  );
  const [choice, setChoice] = useState<string | null>(null);
  const [reviewedChoice, setReviewedChoice] = useState<string | null>(null);

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!choice) return;
    setReviewedChoice(choice);
    markExplored(["cash-and-debt"]);
  }

  return (
    <section
      aria-labelledby="cash-debt-title"
      className={styles.lesson}
      id="cash-and-debt-lesson"
    >
      <header className={styles.introduction}>
        <p className="eyebrow">Cash &amp; Debt · balance comparison</p>
        <h2 id="cash-debt-title">
          How can a company have cash and debt at the same time?
        </h2>
        <p>
          Compare two different positions on {company.name}&apos;s Balance Sheet.
          One does not erase the accounting existence of the other.
        </p>
        <p className={styles.period}>
          FY{statement.fiscalYear} · {statement.currency} · as of{" "}
          {statement.asOfDate} · filed {statement.filedAt} ·{" "}
          <a href={statement.sourceUrl} rel="noreferrer" target="_blank">
            SEC {statement.form} ↗
          </a>
        </p>
      </header>

      <figure className={styles.comparison} aria-labelledby="cash-debt-comparison-heading">
        <figcaption>
          <p className="eyebrow">Two positions · one shared absolute scale</p>
          <h3 id="cash-debt-comparison-heading">
            Compare amounts without turning them into a score.
          </h3>
          <p>
            The longer bar is the larger amount on this reporting date. Both bars use
            {" "}{formatBillions(presentation.scale.referenceAmount)} as the same reference.
          </p>
        </figcaption>

        <div
          className={styles.position}
          data-position={presentation.cashPosition.kind}
        >
          <div className={styles.positionIdentity}>
            <span>{company.name} reported</span>
            <strong>Cash and cash equivalents</strong>
            <small>{presentation.cashPosition.label}</small>
          </div>
          <div className={styles.track} aria-hidden="true">
            <span style={positionStyle(presentation.cashPosition.magnitudePercent)} />
          </div>
          <strong className={styles.amount}>
            {formatBillions(presentation.cashPosition.amount)}
          </strong>
        </div>

        <div
          className={styles.position}
          data-position={presentation.borrowingPosition.kind}
        >
          <div className={styles.positionIdentity}>
            <span>FinPath-derived balance-sheet position</span>
            <strong>FinPath simple borrowings</strong>
            <small>{statement.simpleBorrowings.definition}</small>
          </div>
          <div className={styles.track} aria-hidden="true">
            <span style={positionStyle(presentation.borrowingPosition.magnitudePercent)} />
          </div>
          <strong className={styles.amount}>
            {formatBillions(presentation.borrowingPosition.amount)}
          </strong>
        </div>
      </figure>

      <section className={styles.derivation} aria-labelledby="borrowings-heading">
        <header>
          <p className="eyebrow">Company-reported borrowing components</p>
          <h3 id="borrowings-heading">See what FinPath groups as simple borrowings.</h3>
        </header>
        <div className={styles.components}>
          {statement.simpleBorrowings.inputs.map((line) => (
            <div key={line.id}>
              <span>{line.reportedLabel}</span>
              <strong>{formatBillions(line.value)}</strong>
            </div>
          ))}
        </div>
        <div className={styles.derivedTotal}>
          <span>{statement.simpleBorrowings.formula}</span>
          <strong>= {formatBillions(statement.simpleBorrowings.value)}</strong>
        </div>
        <p>
          This lesson excludes lease obligations from FinPath simple borrowings.
          Debt definitions can vary.
        </p>
      </section>

      <section className={styles.inspection} aria-labelledby="cash-debt-inspection-heading">
        <header>
          <p className="eyebrow">Inspect meaning and source</p>
          <h3 id="cash-debt-inspection-heading">These positions have different evidence status.</h3>
        </header>
        <div className={styles.positionButtons}>
          <button
            aria-pressed={selectedPosition === "cash"}
            onClick={() => setSelectedPosition("cash")}
            type="button"
          >
            <span>Cash and cash equivalents</span>
            <strong>{formatBillions(presentation.cashPosition.amount)}</strong>
          </button>
          <button
            aria-pressed={selectedPosition === "borrowings"}
            onClick={() => setSelectedPosition("borrowings")}
            type="button"
          >
            <span>FinPath simple borrowings</span>
            <strong>{formatBillions(presentation.borrowingPosition.amount)}</strong>
          </button>
        </div>
        <div aria-live="polite" className={styles.inspector}>
          {selectedPosition === "cash" ? (
            <>
              <p className="eyebrow">Company reported · instant fact</p>
              <h4>Cash and cash equivalents</h4>
              <p>
                This exact Balance Sheet concept is narrower than every financial
                resource the company may hold.
              </p>
              <EvidenceInspector
                evidence={evidence.cashAndCashEquivalents}
                id="cash-debt-cash-evidence"
              />
            </>
          ) : selectedPosition === "borrowings" ? (
            <>
              <p className="eyebrow">FinPath-derived · same-date reported inputs</p>
              <h4>FinPath simple borrowings</h4>
              <p>
                This is the sum of the reviewed borrowing lines shown above, not a
                company-reported Total Debt line.
              </p>
              <EvidenceInspector
                evidence={evidence.simpleBorrowings}
                id="simple-borrowings-evidence"
              />
            </>
          ) : (
            <>
              <p className="eyebrow">Reported vs derived</p>
              <h4>Choose a position to inspect it.</h4>
              <p>
                Selection adds source detail. It does not change either amount,
                the shared scale, or lesson progress.
              </p>
            </>
          )}
        </div>
      </section>

      <details className={styles.context}>
        <summary>Keep Total Liabilities and other financial assets in context</summary>
        <div>
          <section>
            <h3>Borrowings are not Total Liabilities</h3>
            <p>
              Total Liabilities is {formatBillions(statement.liabilities.value)}.
              Liabilities can include accounts payable, accrued obligations, taxes,
              leases, and other obligations beyond this borrowing group.
            </p>
            <EvidenceInspector
              evidence={evidence.liabilities}
              id="cash-debt-liabilities-evidence"
            />
          </section>
          <section>
            <h3>Cash is not every financial asset</h3>
            {statement.supplementalFinancialAssets.length > 0 ? (
              <div className={styles.supplemental}>
                {statement.supplementalFinancialAssets.map((line, index) => (
                  <div key={line.id}>
                    <span>{line.reportedLabel}</span>
                    <strong>{formatBillions(line.value)}</strong>
                    <EvidenceInspector
                      evidence={evidence.supplementalFinancialAssets[index]}
                      id={`cash-debt-${line.id}-evidence`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p>
                FinPath adds no supplemental financial-asset line because this
                reviewed profile has no supplemental financial-asset line selected.
              </p>
            )}
          </section>
        </div>
      </details>

      <aside className={styles.boundaries} aria-labelledby="cash-debt-boundaries">
        <p className="eyebrow" id="cash-debt-boundaries">Amount is not judgement</p>
        <p><strong>Debt is not automatically distress.</strong> Terms, timing, purpose, and repayment capacity matter.</p>
        <p><strong>Cash does not automatically imply strength.</strong> The amount alone does not explain obligations, liquidity needs, or strategy.</p>
        <p><strong>No financial-strength score.</strong> This comparison does not provide an investment verdict or rank the company.</p>
      </aside>

      <section className={styles.application} aria-labelledby="cash-debt-check">
        <p className="eyebrow">One coexistence check</p>
        <form onSubmit={review}>
          <fieldset>
            <legend id="cash-debt-check">
              Can a company report both cash and cash equivalents and borrowings on
              the same Balance Sheet date?
            </legend>
            <p>Choose one. This is practice, not a score.</p>
            <div className={styles.choices}>
              {[
                ["yes", "Yes — they are different positions"],
                ["no", "No — one must erase the other"],
              ].map(([id, label]) => (
                <label key={id}>
                  <input
                    checked={choice === id}
                    name="cash-debt-coexistence"
                    onChange={() => {
                      setChoice(id);
                      setReviewedChoice(null);
                    }}
                    type="radio"
                    value={id}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <button disabled={!choice} type="submit">Check my reasoning</button>
        </form>
        {reviewedChoice ? (
          <p aria-live="polite" className={styles.feedback} role="status">
            {reviewedChoice === "yes"
              ? "Yes. Cash and cash equivalents and borrowings can coexist as different Balance Sheet positions."
              : "One does not erase the other. The Balance Sheet can report both positions on the same date."}
          </p>
        ) : null}
      </section>

      <p className={styles.retrievedNote}>
        Retrieved{" "}
        {new Date(dataStatus.retrievedAt).toLocaleString("en-MY", {
          timeZone: "Asia/Kuala_Lumpur",
        })}
        {dataStatus.state === "stale"
          ? " · SEC was unavailable, so FinPath is showing the last known public filing data."
          : ""}
      </p>
    </section>
  );
}
