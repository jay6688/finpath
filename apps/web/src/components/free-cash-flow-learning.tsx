"use client";

import { useState, type CSSProperties, type FormEvent } from "react";

import { EvidenceInspector } from "@/components/evidence-inspector";
import { useLearningProgress } from "@/components/learning-progress-provider";
import lessonContent from "@/content/cash-flow-lessons/aapl-free-cash-flow-fy2025.json";
import type { CompanyCashFlowStatement } from "@/lib/api";
import type { FreeCashFlowPresentation } from "@/lib/cash-flow-learning";
import {
  buildFreeCashFlowEvidence,
  buildReviewedPresentation,
  type FinancialStatementLineId,
} from "@/lib/evidence";

import styles from "./free-cash-flow-learning.module.css";

type Props = {
  cashFlowStatement: CompanyCashFlowStatement;
  presentation: FreeCashFlowPresentation;
};

const reviewedLabels = Object.fromEntries(
  Object.entries(lessonContent.lines).map(([id, copy]) => [id, copy.reportedLabel]),
) as Partial<Record<FinancialStatementLineId, string>>;

const exactBillions = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

function formatSignedBillions(value: number): string {
  const sign = value < 0 ? "−" : value > 0 ? "+" : "";
  return `${sign}${exactBillions.format(Math.abs(value) / 1_000_000_000)}B`;
}

function formatMagnitudeBillions(value: number): string {
  return `${exactBillions.format(value / 1_000_000_000)}B`;
}

function barStyle(magnitudePercent: number): CSSProperties {
  return { "--fcf-magnitude": magnitudePercent } as CSSProperties;
}

export function FreeCashFlowLearning({
  cashFlowStatement,
  presentation,
}: Props) {
  const { markExplored } = useLearningProgress();
  const { statement, dataStatus } = cashFlowStatement;
  const [choice, setChoice] = useState<string | null>(null);
  const [reviewedChoice, setReviewedChoice] = useState<string | null>(null);
  const presentationContent = {
    fiscalYear: lessonContent.fiscalYear,
    startDate: lessonContent.startDate,
    endDate: lessonContent.endDate,
    form: lessonContent.form as "10-K",
    filedAt: lessonContent.filedAt,
    accession: lessonContent.accession,
    statementName: lessonContent.verification.statementName,
    labels: reviewedLabels,
  };
  const evidence = buildFreeCashFlowEvidence({
    cashFlowStatement,
    derivation: presentation.derivation,
    reviewedOperatingCashFlow: buildReviewedPresentation({
      statement,
      content: presentationContent,
      lineId: "cash-generated-by-operating-activities",
      contextLineIds: ["cash-generated-by-operating-activities"],
    }),
    reviewedPropertyPlantEquipment: buildReviewedPresentation({
      statement,
      content: presentationContent,
      lineId: "payments-for-property-plant-and-equipment",
      contextLineIds: ["payments-for-property-plant-and-equipment"],
    }),
  });

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!choice) return;
    setReviewedChoice(choice);
    markExplored(["free-cash-flow"]);
  }

  const textEquivalent = [
    `Reported Operating Cash Flow ${formatSignedBillions(presentation.operatingCashFlow.amount)}`,
    `reported PP&E statement cash effect ${formatSignedBillions(presentation.propertyPlantEquipment.statementCashEffect)}`,
    `formula deduction magnitude ${formatMagnitudeBillions(presentation.propertyPlantEquipment.deductionMagnitude)}`,
    `FinPath-derived Free Cash Flow ${formatSignedBillions(presentation.freeCashFlow.amount)}`,
  ].join("; ");

  return (
    <section
      aria-labelledby="fcf-title"
      className={styles.lesson}
      id="free-cash-flow-lesson"
    >
      <header className={styles.introduction}>
        <p className="eyebrow">Free Cash Flow · signed derivation bridge</p>
        <h2 id="fcf-title">{lessonContent.title}</h2>
        <p>{lessonContent.introduction}</p>
        <p className={styles.period}>
          FY{statement.fiscalYear} · {statement.currency} · year ended{" "}
          {statement.endDate} · filed {statement.filedAt} ·{" "}
          <a href={statement.sourceUrl} rel="noreferrer" target="_blank">
            SEC {statement.form} ↗
          </a>
        </p>
      </header>

      <figure className={styles.bridge} aria-labelledby="fcf-bridge-heading">
        <figcaption>
          <p className="eyebrow">One formula · one shared absolute scale</p>
          <h3 id="fcf-bridge-heading">Reported inputs become one transparent derivation.</h3>
          <p>{textEquivalent}.</p>
        </figcaption>

        <div className={styles.scaleLegend} aria-hidden="true">
          <span>Negative ←</span>
          <span>0</span>
          <span>→ Positive</span>
        </div>

        <div className={styles.term} data-kind={presentation.operatingCashFlow.kind}>
          <div className={styles.termIdentity}>
            <span>START WITH · Apple reported</span>
            <strong>Operating Cash Flow</strong>
          </div>
          <div className={styles.quantitativeArea} aria-hidden="true">
            <span className={styles.zeroAxis} />
            <span
              className={styles.bar}
              data-direction={presentation.operatingCashFlow.direction}
              style={barStyle(presentation.operatingCashFlow.magnitudePercent)}
            />
          </div>
          <strong className={styles.amount}>
            {formatSignedBillions(presentation.operatingCashFlow.amount)}
          </strong>
        </div>

        <div className={styles.operator} aria-hidden="true">LESS</div>

        <div className={styles.term} data-kind={presentation.propertyPlantEquipment.kind}>
          <div className={styles.termIdentity}>
            <span>Apple reported · Investing activity</span>
            <strong>PP&amp;E payment magnitude</strong>
            <small>
              Statement cash effect{" "}
              {formatSignedBillions(presentation.propertyPlantEquipment.statementCashEffect)}
            </small>
          </div>
          <div className={styles.quantitativeArea} aria-hidden="true">
            <span className={styles.zeroAxis} />
            <span
              className={styles.bar}
              data-direction={presentation.propertyPlantEquipment.direction}
              style={barStyle(presentation.propertyPlantEquipment.magnitudePercent)}
            />
          </div>
          <strong className={styles.amount}>
            {formatMagnitudeBillions(presentation.propertyPlantEquipment.deductionMagnitude)}
          </strong>
        </div>

        <div className={styles.operator} aria-hidden="true">EQUALS</div>

        <div
          className={`${styles.term} ${styles.result}`}
          data-kind={presentation.freeCashFlow.kind}
        >
          <div className={styles.termIdentity}>
            <span>FinPath-derived</span>
            <strong>FinPath simple Free Cash Flow</strong>
          </div>
          <div className={styles.quantitativeArea} aria-hidden="true">
            <span className={styles.zeroAxis} />
            <span
              className={styles.bar}
              data-direction={presentation.freeCashFlow.direction}
              style={barStyle(presentation.freeCashFlow.magnitudePercent)}
            />
          </div>
          <strong className={styles.amount}>
            {formatSignedBillions(presentation.freeCashFlow.amount)}
          </strong>
        </div>
      </figure>

      <aside className={styles.boundaries} aria-labelledby="fcf-boundaries">
        <p className="eyebrow" id="fcf-boundaries">Read the definition before the result</p>
        <p><strong>Reported vs derived.</strong> {lessonContent.definition}</p>
        <p><strong>The word “Free.”</strong> {lessonContent.freeNameBoundary}</p>
        <p><strong>Definition boundary.</strong> {lessonContent.definitionBoundary}</p>
      </aside>

      <section className={styles.application} aria-labelledby="fcf-check">
        <p className="eyebrow">One evidence check</p>
        <form onSubmit={review}>
          <fieldset>
            <legend id="fcf-check">
              {formatSignedBillions(presentation.freeCashFlow.amount)} ·{" "}
              {lessonContent.question.prompt}
            </legend>
            <p>{lessonContent.question.hint}</p>
            <div className={styles.choices}>
              {lessonContent.question.choices.map((option) => (
                <label key={option.id}>
                  <input
                    checked={choice === option.id}
                    name="free-cash-flow-meaning"
                    onChange={() => {
                      setChoice(option.id);
                      setReviewedChoice(null);
                    }}
                    type="radio"
                    value={option.id}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <button disabled={!choice} type="submit">Check my reasoning</button>
        </form>
        {reviewedChoice ? (
          <>
            <p aria-live="polite" className={styles.feedback} role="status">
              {reviewedChoice === lessonContent.question.supportedChoiceId
                ? lessonContent.question.supportedFeedback
                : lessonContent.question.unsupportedFeedback}
            </p>
            <EvidenceInspector evidence={evidence} id="free-cash-flow-evidence" />
          </>
        ) : null}
      </section>

      <aside className={styles.limitation} aria-labelledby="fcf-limit">
        <p className="eyebrow" id="fcf-limit">What this derivation cannot tell you</p>
        <p>{lessonContent.limitation}</p>
      </aside>

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
