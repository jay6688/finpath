"use client";

import { useState, type CSSProperties, type FormEvent } from "react";

import { EvidenceInspector } from "@/components/evidence-inspector";
import { useLearningProgress } from "@/components/learning-progress-provider";
import type { CompanyBalanceSheet } from "@/lib/api";
import {
  buildBalanceSheetEvidence,
  cashAndSecuritiesLabel,
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
  const cashAndSecurities = presentation.cashAndSecuritiesPosition;
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  // Match by line id: unclassified lines are listed separately, so list
  // positions do not line up with the evidence array.
  const selectedSecurityPosition = presentation.securityPositions.find(
    (security) => security.id === selectedPosition,
  );
  const selectedSecurityEvidence = evidence.supplementalFinancialAssets.find(
    (line) => line.metric.id === selectedSecurityPosition?.id,
  );
  const selectedSecurity =
    selectedSecurityPosition && selectedSecurityEvidence
      ? { position: selectedSecurityPosition, evidence: selectedSecurityEvidence }
      : null;
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
          Compare different positions on {company.name}&apos;s Balance Sheet.
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
          <p className="eyebrow">Cash, securities and borrowings · one shared absolute scale</p>
          <h3 id="cash-debt-comparison-heading">
            Compare amounts without turning them into a score.
          </h3>
          <p>
            The longer bar is the larger amount on this reporting date. Every bar uses
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

        {presentation.securityPositions.map((security) => (
          <div
            className={styles.position}
            data-horizon={security.horizon}
            data-position={security.kind}
            key={security.id}
          >
            <div className={styles.positionIdentity}>
              <span>{company.name} reported</span>
              <strong>{security.label}</strong>
              <small>
                {security.horizon === "non-current"
                  ? "Non-current: the company does not expect to turn these into cash within a year."
                  : "Current: the company classifies these as assets it expects to realise within a year."}
              </small>
            </div>
            <div className={styles.track} aria-hidden="true">
              <span style={positionStyle(security.magnitudePercent)} />
            </div>
            <strong className={styles.amount}>{formatBillions(security.amount)}</strong>
          </div>
        ))}

        {cashAndSecurities ? (
          <div
            className={styles.position}
            data-position={cashAndSecurities.kind}
            data-total="cash-and-securities"
          >
            <div className={styles.positionIdentity}>
              <span>FinPath-derived balance-sheet position</span>
              <strong>{cashAndSecurities.label}</strong>
              <small>
                Cash and cash equivalents +{" "}
                {presentation.securityPositions.map((security) => security.label).join(" + ")}
              </small>
            </div>
            <div className={styles.track} aria-hidden="true">
              <span style={positionStyle(cashAndSecurities.magnitudePercent)} />
            </div>
            <strong className={styles.amount}>
              {formatBillions(cashAndSecurities.amount)}
            </strong>
          </div>
        ) : presentation.cashAndSecuritiesStatus === "unavailable-unclassified-line" ? (
          <>
            {presentation.unclassifiedPositions.map((line) => (
              <div
                className={styles.position}
                data-position={line.kind}
                data-unclassified="true"
                key={line.id}
              >
                <div className={styles.positionIdentity}>
                  <span>{company.name} reported</span>
                  <strong>{line.label}</strong>
                  <small>
                    Not a reviewed marketable-securities or short-term-investment
                    line, so FinPath does not add it to a total.
                  </small>
                </div>
                <div className={styles.track} aria-hidden="true">
                  <span style={positionStyle(line.magnitudePercent)} />
                </div>
                <strong className={styles.amount}>{formatBillions(line.amount)}</strong>
              </div>
            ))}
            <p className={styles.comparisonNote} data-securities="unavailable">
              {cashAndSecuritiesLabel} unavailable. A reported financial-asset line
              here is not one FinPath has reviewed as securities, so FinPath shows
              each reported line but does not calculate a total.
            </p>
          </>
        ) : (
          <p className={styles.comparisonNote} data-securities="none">
            For {company.name}, only cash and cash equivalents are counted. This
            reviewed profile has no marketable-securities or short-term-investment
            line selected, so FinPath adds no securities total.
          </p>
        )}

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

        {cashAndSecurities?.includesNoncurrent ? (
          <p className={styles.comparisonNote} data-securities="includes-noncurrent">
            The total includes non-current marketable securities. {company.name}{" "}
            does not expect to turn that portion into cash within a year, so it is
            not the same as money available right now.
          </p>
        ) : null}
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
          {presentation.securityPositions.map((security) => (
            <button
              aria-pressed={selectedPosition === security.id}
              key={security.id}
              onClick={() => setSelectedPosition(security.id)}
              type="button"
            >
              <span>{security.label}</span>
              <strong>{formatBillions(security.amount)}</strong>
            </button>
          ))}
          {cashAndSecurities ? (
            <button
              aria-pressed={selectedPosition === "cash-and-securities"}
              onClick={() => setSelectedPosition("cash-and-securities")}
              type="button"
            >
              <span>{cashAndSecurities.label}</span>
              <strong>{formatBillions(cashAndSecurities.amount)}</strong>
            </button>
          ) : null}
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
          ) : selectedSecurity ? (
            <>
              <p className="eyebrow">Company reported · instant fact</p>
              <h4>{selectedSecurity.position.label}</h4>
              <p>
                {selectedSecurity.position.horizon === "non-current"
                  ? "The company classifies these securities as non-current, so it does not expect to turn them into cash within a year."
                  : "The company classifies these as current assets, separate from cash and cash equivalents."}
              </p>
              <EvidenceInspector
                evidence={selectedSecurity.evidence}
                id={`cash-debt-${selectedSecurity.position.id}-evidence`}
              />
            </>
          ) : selectedPosition === "cash-and-securities" && evidence.cashAndSecurities ? (
            <>
              <p className="eyebrow">FinPath-derived · same-date reported inputs</p>
              <h4>{evidence.cashAndSecurities.metric.label}</h4>
              <p>
                This is cash and cash equivalents plus the reviewed securities lines
                shown above, not a company-reported total.
              </p>
              <EvidenceInspector
                evidence={evidence.cashAndSecurities}
                id="cash-and-securities-evidence"
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
                Selection adds source detail. It does not change any amount,
                the shared scale, or lesson progress.
              </p>
            </>
          )}
        </div>
      </section>

      <details className={styles.context}>
        <summary>Keep Total Liabilities and other resources in context</summary>
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
            <h3>The comparison is not every resource</h3>
            <p>
              {cashAndSecurities
                ? "The comparison counts cash and cash equivalents and the reviewed securities lines only."
                : presentation.cashAndSecuritiesStatus === "unavailable-unclassified-line"
                  ? "The comparison lists the reported lines but withholds a combined total."
                  : "The comparison counts cash and cash equivalents only."}{" "}
              Receivables, inventory, other assets and future cash flows sit outside
              it, and debt repayment timing is not shown here.
            </p>
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
