"use client";

import { useState, type FormEvent } from "react";

import {
  CashActivityLineBar,
  CashActivityTrace,
} from "@/components/cash-activity-trace";
import { EvidenceInspector } from "@/components/evidence-inspector";
import { useLearningProgress } from "@/components/learning-progress-provider";
import lessonContent from "@/content/cash-flow-lessons/aapl-investing-financing-fy2025.json";
import type { CashFlowStatementLineId, CompanyCashFlowStatement } from "@/lib/api";
import type { CashActivityPresentation } from "@/lib/cash-flow-learning";
import {
  buildReportedEvidence,
  buildReviewedPresentation,
  reportedFactFromStatementLine,
  type FinancialStatementLineId,
} from "@/lib/evidence";

import styles from "./investing-financing-cash-flow-learning.module.css";

type Props = {
  cashFlowStatement: CompanyCashFlowStatement;
  presentation: CashActivityPresentation;
};
type LineCopy = { reportedLabel: string; helper: string };

const lineCopy = lessonContent.lines as Record<CashFlowStatementLineId, LineCopy>;
const reviewedLabels = Object.fromEntries(
  Object.entries(lineCopy).map(([id, copy]) => [id, copy.reportedLabel]),
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

export function InvestingFinancingCashFlowLearning({
  cashFlowStatement,
  presentation,
}: Props) {
  const { markExplored } = useLearningProgress();
  const { statement, dataStatus } = cashFlowStatement;
  const [selectedLineId, setSelectedLineId] =
    useState<CashFlowStatementLineId | null>(null);
  const [finalChoice, setFinalChoice] = useState<string | null>(null);
  const [reviewedFinalChoice, setReviewedFinalChoice] = useState<string | null>(null);

  const reviewedNetChange = buildReviewedPresentation({
    statement,
    content: {
      fiscalYear: lessonContent.fiscalYear,
      startDate: lessonContent.startDate,
      endDate: lessonContent.endDate,
      form: lessonContent.form as "10-K",
      filedAt: lessonContent.filedAt,
      accession: lessonContent.accession,
      statementName: lessonContent.verification.statementName,
      labels: reviewedLabels,
    },
    lineId: "net-change-in-cash",
    contextLineIds: [
      "cash-generated-by-operating-activities",
      "cash-generated-by-investing-activities",
      "cash-used-in-financing-activities",
      "net-change-in-cash",
    ],
  });
  const netChangeEvidence = buildReportedEvidence({
    metric: { id: "net-change-in-cash", label: "Net change in cash" },
    company: cashFlowStatement.company,
    currency: statement.currency,
    fact: reportedFactFromStatementLine(statement, "net-change-in-cash"),
    dataStatus,
    reviewedPresentation: reviewedNetChange,
  });

  function reviewFinalQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!finalChoice) return;
    setReviewedFinalChoice(finalChoice);
    markExplored(["investing-financing-cash-flow"]);
  }

  return (
    <section
      aria-labelledby="cash-activity-lesson-title"
      className={styles.lesson}
      id="investing-financing-cash-flow-lesson"
    >
      <header className={styles.introduction}>
        <p className="eyebrow">Cash Flow Statement · three activity sections</p>
        <h2 id="cash-activity-lesson-title">{lessonContent.title}</h2>
        <p>{lessonContent.introduction}</p>
        <p className={styles.period}>
          FY{statement.fiscalYear} · {statement.currency} · year ended{" "}
          {statement.endDate} · filed {statement.filedAt} ·{" "}
          <a href={statement.sourceUrl} rel="noreferrer" target="_blank">
            SEC {statement.form} ↗
          </a>
        </p>
      </header>

      <CashActivityTrace
        onSelect={setSelectedLineId}
        presentation={presentation}
        selectedLineId={selectedLineId}
      />

      <aside className={styles.boundaries} aria-labelledby="cash-activity-boundaries">
        <p className="eyebrow" id="cash-activity-boundaries">Read the signs carefully</p>
        <p><strong>Direction is not quality.</strong> {lessonContent.signBoundary}</p>
        <p><strong>Reported vs teaching.</strong> {lessonContent.presentationBoundary}</p>
        <p>{lessonContent.remainingBoundary}</p>
        <p><strong>Reported change boundary.</strong> {lessonContent.fxBoundary}</p>
      </aside>

      <details className={styles.fullLines}>
        <summary>See all Investing and Financing lines</summary>
        <div>
          <p>
            Apple-reported lines · FY{statement.fiscalYear} · USD billions. Each
            line uses one shared child scale whose reference is the largest reviewed
            line. The section totals remain on the primary activity scale above.
          </p>
          {presentation.activities.slice(1).map((activity) => (
            <section key={activity.id}>
              <h3>{activity.id === "investing" ? "Investing" : "Financing"}</h3>
              <dl>
                {activity.lines.map((line) => (
                  <div data-role={line.role} key={line.id}>
                    <dt>
                      <strong>{lineCopy[line.id].reportedLabel}</strong>
                      <small>{lineCopy[line.id].helper}</small>
                      <CashActivityLineBar line={line} />
                    </dt>
                    <dd>{formatSignedBillions(line.amount)}</dd>
                  </div>
                ))}
                <div className={styles.sectionTotal}>
                  <dt>
                    {activity.id === "investing"
                      ? lineCopy["cash-generated-by-investing-activities"].reportedLabel
                      : lineCopy["cash-used-in-financing-activities"].reportedLabel}
                  </dt>
                  <dd>{formatSignedBillions(activity.amount)}</dd>
                </div>
              </dl>
            </section>
          ))}
          <p>{lessonContent.verification.unitNote}</p>
          <a href={lessonContent.sources[0].url} rel="noreferrer" target="_blank">
            Open the filed statement ↗
          </a>
        </div>
      </details>

      <section className={styles.application} aria-labelledby="cash-activity-check">
        <p className="eyebrow">One final classification</p>
        <form onSubmit={reviewFinalQuestion}>
          <fieldset>
            <legend id="cash-activity-check">{lessonContent.finalQuestion.prompt}</legend>
            <p>{lessonContent.finalQuestion.hint}</p>
            <div className={styles.choices}>
              {lessonContent.finalQuestion.choices.map((choice) => (
                <label key={choice.id}>
                  <input
                    checked={finalChoice === choice.id}
                    name="ppe-and-share-repurchases"
                    onChange={() => {
                      setFinalChoice(choice.id);
                      setReviewedFinalChoice(null);
                    }}
                    type="radio"
                    value={choice.id}
                  />
                  <span>{choice.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <button disabled={!finalChoice} type="submit">Check my reasoning</button>
        </form>
        {reviewedFinalChoice ? (
          <p aria-live="polite" className={styles.feedback} role="status">
            {reviewedFinalChoice === lessonContent.finalQuestion.supportedChoiceId
              ? lessonContent.finalQuestion.supportedFeedback
              : lessonContent.finalQuestion.unsupportedFeedback}
          </p>
        ) : null}
      </section>

      {reviewedFinalChoice ? (
        <EvidenceInspector evidence={netChangeEvidence} id="cash-change-evidence" />
      ) : null}

      <aside className={styles.limitation} aria-labelledby="cash-activity-limit">
        <p className="eyebrow" id="cash-activity-limit">What this trace cannot tell you</p>
        <p>
          This classification and reconciliation do not tell you whether Apple is a
          good investment. They do not replace analysis of strategy, sustainability,
          valuation, or the reasons behind each cash movement.
        </p>
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
