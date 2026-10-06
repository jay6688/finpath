"use client";

import { useState, type FormEvent } from "react";

import { EvidenceInspector } from "@/components/evidence-inspector";
import { useLearningProgress } from "@/components/learning-progress-provider";
import { ProfitToCashTrace } from "@/components/profit-to-cash-trace";
import cashFlowContent from "@/content/cash-flow-lessons/aapl-operating-cash-flow-fy2025.json";
import type {
  CashFlowStatementLineId,
  CompanyCashFlowStatement,
} from "@/lib/api";
import {
  buildReportedEvidence,
  buildReviewedPresentation,
  reportedFactFromStatementLine,
  type FinancialStatementLineId,
} from "@/lib/evidence";
import type {
  CashReconciliationGroupId,
  OperatingCashFlowPresentation,
} from "@/lib/operating-cash-flow";

import styles from "./operating-cash-flow-learning.module.css";

type OperatingCashFlowLearningProps = {
  cashFlowStatement: CompanyCashFlowStatement;
  presentation: OperatingCashFlowPresentation;
};

type LineCopy = { reportedLabel: string; helper: string };
type GroupCopy = { label: string; explanation: string };

const lineCopy = cashFlowContent.lines as Record<
  CashFlowStatementLineId,
  LineCopy
>;
const groupCopy = cashFlowContent.groups as Record<
  CashReconciliationGroupId,
  GroupCopy
>;
const reviewedLabels = Object.fromEntries(
  Object.entries(lineCopy).map(([id, copy]) => [id, copy.reportedLabel]),
) as Partial<Record<FinancialStatementLineId, string>>;

const exactBillions = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

function formatBillions(value: number): string {
  return `${exactBillions.format(Math.abs(value) / 1_000_000_000)}B`;
}

function formatSignedBillions(value: number): string {
  const sign = value < 0 ? "−" : value > 0 ? "+" : "";
  return `${sign}${formatBillions(value)}`;
}

export function OperatingCashFlowLearning({
  cashFlowStatement,
  presentation,
}: OperatingCashFlowLearningProps) {
  const { markExplored } = useLearningProgress();
  const { statement, dataStatus } = cashFlowStatement;
  const operatingLines = statement.sections.find(
    (section) => section.id === "operating",
  )?.lines ?? [];
  const [selectedGroupId, setSelectedGroupId] =
    useState<CashReconciliationGroupId | null>(null);
  const [finalChoice, setFinalChoice] = useState<string | null>(null);
  const [reviewedFinalChoice, setReviewedFinalChoice] = useState<string | null>(null);

  const reviewedOperatingCash = buildReviewedPresentation({
    statement,
    content: {
      fiscalYear: cashFlowContent.fiscalYear,
      startDate: cashFlowContent.startDate,
      endDate: cashFlowContent.endDate,
      form: cashFlowContent.form as "10-K" | "10-K/A",
      filedAt: cashFlowContent.filedAt,
      accession: cashFlowContent.accession,
      statementName: cashFlowContent.verification.statementName,
      labels: reviewedLabels,
    },
    lineId: "cash-generated-by-operating-activities",
    contextLineIds: operatingLines.map((line) => line.id),
  });
  const operatingCashEvidence = buildReportedEvidence({
    metric: { id: "operating-cash-flow", label: "Operating Cash Flow" },
    company: cashFlowStatement.company,
    currency: statement.currency,
    fact: reportedFactFromStatementLine(
      statement,
      "cash-generated-by-operating-activities",
    ),
    dataStatus,
    reviewedPresentation: reviewedOperatingCash,
  });

  function reviewFinalQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!finalChoice) return;
    setReviewedFinalChoice(finalChoice);
    markExplored(["operating-cash-flow"]);
  }

  function selectFinalChoice(choiceId: string) {
    setFinalChoice(choiceId);
    setReviewedFinalChoice(null);
  }

  function finalFeedback(choice: string): string {
    if (choice === cashFlowContent.finalQuestion.supportedChoiceId) {
      return cashFlowContent.finalQuestion.supportedFeedback;
    }
    return choice === "net-income"
      ? cashFlowContent.finalQuestion.netIncomeFeedback
      : cashFlowContent.finalQuestion.cashBalanceFeedback;
  }

  return (
    <section
      aria-labelledby="cash-lesson-title"
      className={styles.lesson}
      id="operating-cash-flow-lesson"
    >
      <header className={styles.introduction}>
        <p className="eyebrow">Profit → Cash from Operations</p>
        <h2 id="cash-lesson-title">{cashFlowContent.title}</h2>
        <p>{cashFlowContent.introduction}</p>
        <p className={styles.period}>
          FY{statement.fiscalYear} · {statement.currency} · year ended{" "}
          {statement.endDate} · filed {statement.filedAt} ·{" "}
          <a href={statement.sourceUrl} rel="noreferrer" target="_blank">
            SEC {statement.form} ↗
          </a>
        </p>
      </header>

      <ProfitToCashTrace
        groupCopy={groupCopy}
        lineCopy={lineCopy}
        onSelect={setSelectedGroupId}
        presentation={presentation}
        selectedGroupId={selectedGroupId}
      />

      <aside className={styles.boundaries} aria-labelledby="cash-boundaries-heading">
        <p className="eyebrow" id="cash-boundaries-heading">Read this bridge carefully</p>
        <p>{cashFlowContent.nearCancellation}</p>
        <p><strong>Keep the endpoint clear.</strong> {cashFlowContent.boundary}</p>
      </aside>

      <details className={styles.reconciliation}>
        <summary>See the complete Apple reconciliation</summary>
        <div>
          <p>
            Apple-reported lines · FY{statement.fiscalYear} · USD billions.
            Signed amounts reconcile Net Income to operating cash. FinPath’s two
            group totals are derived from these lines; Apple did not report the
            grouped totals as separate statement lines.
          </p>
          <dl>
            {operatingLines.map((line) => (
              <div data-role={line.role} key={line.id}>
                <dt>
                  <strong>{lineCopy[line.id].reportedLabel}</strong>
                  <small>{lineCopy[line.id].helper}</small>
                </dt>
                <dd>{formatSignedBillions(line.value)}</dd>
              </div>
            ))}
          </dl>
          <p>{cashFlowContent.verification.displayNote}</p>
          <a href={cashFlowContent.sources[0].url} rel="noreferrer" target="_blank">
            Open the filed statement ↗
          </a>
        </div>
      </details>

      <section className={styles.application} aria-labelledby="cash-final-check-title">
        <dl className={styles.comparison}>
          <div>
            <dt>Net Income</dt>
            <dd>{formatBillions(presentation.startingPoint.amount)}</dd>
          </div>
          <div>
            <dt>Operating Cash Flow</dt>
            <dd>{formatBillions(presentation.result.amount)}</dd>
          </div>
        </dl>
        <form onSubmit={reviewFinalQuestion}>
          <fieldset>
            <legend id="cash-final-check-title">
              {cashFlowContent.finalQuestion.prompt}
            </legend>
            <p>{cashFlowContent.finalQuestion.hint}</p>
            <div className={styles.choices}>
              {cashFlowContent.finalQuestion.choices.map((choice) => (
                <label key={choice.id}>
                  <input
                    checked={finalChoice === choice.id}
                    name="operating-cash-meaning"
                    onChange={() => selectFinalChoice(choice.id)}
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
            {finalFeedback(reviewedFinalChoice)}
          </p>
        ) : null}
      </section>

      {reviewedFinalChoice ? (
        <EvidenceInspector
          evidence={operatingCashEvidence}
          id="operating-cash-flow-evidence"
        />
      ) : null}

      <aside className={styles.limitation} aria-labelledby="cash-limit-heading">
        <p className="eyebrow" id="cash-limit-heading">What this cannot tell you</p>
        <p>{cashFlowContent.limitation}</p>
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
