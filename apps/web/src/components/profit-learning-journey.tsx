"use client";

import { useState, type FormEvent } from "react";

import { EvidenceInspector } from "@/components/evidence-inspector";
import { useLearningProgress } from "@/components/learning-progress-provider";
import { QuantitativeLedger } from "@/components/quantitative-ledger";
import profitContent from "@/content/profit-lessons/aapl-profit-fy2025.json";
import type {
  CompanyIncomeStatement,
  IncomeStatementLineId,
} from "@/lib/api";
import {
  buildReportedEvidence,
  buildReviewedPresentation,
  reportedFactFromStatementLine,
} from "@/lib/evidence";
import {
  buildProfitLedgerPresentation,
  type ProfitLedgerTransformation,
} from "@/lib/profit-learning";

import styles from "./profit-learning-journey.module.css";

type ProfitLearningJourneyProps = {
  incomeStatement: CompanyIncomeStatement;
};

type LineCopy = {
  helper: string;
  reportedLabel: string;
};

type TransformationCopy = {
  boundary: string;
  explanation: string;
  shortLabel: string;
  summary: string;
};

type LedgerContent = {
  defaultSelection: ProfitLedgerTransformation["id"];
  instruction: string;
  result: {
    boundary: string;
    label: string;
    summary: string;
  };
  scaleNote: string;
  title: string;
  transformations: Record<
    ProfitLedgerTransformation["id"],
    TransformationCopy
  >;
};

const lineCopy = profitContent.lines as Record<IncomeStatementLineId, LineCopy>;
const ledgerContent = profitContent.ledger as LedgerContent;
const reviewedLabels = Object.fromEntries(
  Object.entries(lineCopy).map(([id, copy]) => [id, copy.reportedLabel]),
) as Partial<Record<IncomeStatementLineId, string>>;

const exactBillions = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

function formatBillions(value: number): string {
  return `${exactBillions.format(Math.abs(value) / 1_000_000_000)}B`;
}

function formatReportedBillions(value: number): string {
  const formatted = formatBillions(value);
  return value < 0 ? `(${formatted})` : formatted;
}

export function ProfitLearningJourney({
  incomeStatement,
}: ProfitLearningJourneyProps) {
  const { markExplored } = useLearningProgress();
  const { statement, dataStatus } = incomeStatement;
  const model = buildProfitLedgerPresentation(statement);
  const [selectedId, setSelectedId] =
    useState<ProfitLedgerTransformation["id"]>(
      "total-cost-of-sales",
    );
  const [inspectedIds, setInspectedIds] = useState<
    ProfitLedgerTransformation["id"][]
  >(["total-cost-of-sales"]);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [reviewedChoice, setReviewedChoice] = useState<string | null>(null);

  const reviewedNetIncome = buildReviewedPresentation({
    statement,
    content: {
      fiscalYear: profitContent.fiscalYear,
      startDate: profitContent.startDate,
      endDate: profitContent.endDate,
      form: profitContent.form as "10-K" | "10-K/A",
      filedAt: profitContent.filedAt,
      accession: profitContent.accession,
      statementName: profitContent.verification.statementName,
      labels: reviewedLabels,
    },
    lineId: "net-income",
    contextLineIds: [
      "income-before-income-taxes",
      "income-tax-provision",
      "net-income",
    ],
  });
  const netIncomeEvidence = buildReportedEvidence({
    metric: { id: "net-income", label: "Net Income" },
    company: incomeStatement.company,
    currency: statement.currency,
    fact: reportedFactFromStatementLine(statement, "net-income"),
    dataStatus,
    reviewedPresentation: reviewedNetIncome,
  });

  const allTransformationsInspected = model.transformations.every(
    (transformation) => inspectedIds.includes(transformation.id),
  );
  const supportedAnswer =
    reviewedChoice === profitContent.question.supportedChoiceId;

  function selectLine(id: ProfitLedgerTransformation["id"]) {
    setSelectedId(id);
    setInspectedIds((current) =>
      current.includes(id) ? current : [...current, id],
    );
  }

  function completeLesson() {
    if (!allTransformationsInspected) return;
    setIsComplete(true);
    markExplored(["profit"]);
  }

  function reviewUnderstanding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedChoice) setReviewedChoice(selectedChoice);
  }

  return (
    <section
      aria-labelledby="profit-title"
      className={styles.lesson}
      id="profit-lesson"
    >
      <header className={styles.introduction}>
        <p className="eyebrow">Profit · guided income statement</p>
        <h2 id="profit-title">{profitContent.title}</h2>
        <p>
          Apple reported {formatBillions(model.revenue.reportedAmount)} of
          Revenue and {formatBillions(model.result.reportedAmount)} of Net
          Income for FY{statement.fiscalYear}. Follow the exact reported path
          between them on one Revenue = 100% scale.
        </p>
        <p className={styles.period}>
          FY{statement.fiscalYear} · {statement.currency} · year ended{" "}
          {statement.endDate} · filed {statement.filedAt} ·{" "}
          <a href={statement.sourceUrl} rel="noreferrer" target="_blank">
            SEC {statement.form} ↗
          </a>
        </p>
        <p className={styles.introductionBoundary}>{profitContent.boundary}</p>
      </header>

      <QuantitativeLedger
        context={`Apple Inc. · FY${statement.fiscalYear} · USD billions`}
        inspectedIds={inspectedIds}
        lineCopy={lineCopy}
        model={model}
        onSelect={selectLine}
        scaleNote={ledgerContent.scaleNote}
        selectedId={selectedId}
        title={ledgerContent.title}
        transformationCopy={ledgerContent.transformations}
      />

      <div className={styles.completionGate}>
        <div>
          <p className="eyebrow">Complete the accounting path</p>
          <strong>{ledgerContent.instruction}</strong>
          <span aria-live="polite" role="status">
            {inspectedIds.length} of {model.transformations.length}
            {" "}transformations inspected.
          </span>
        </div>
        <button
          disabled={!allTransformationsInspected || isComplete}
          onClick={completeLesson}
          type="button"
        >
          {isComplete ? "Profit lesson complete" : "Review evidence and finish"}
        </button>
      </div>

      {isComplete ? (
        <div className={styles.completion}>
          <section
            aria-labelledby="profit-result-title"
            className={styles.resultExplanation}
          >
            <p className="eyebrow">Result / remainder</p>
            <h3 id="profit-result-title">{ledgerContent.result.label}</h3>
            <p>{ledgerContent.result.summary}</p>
            <p>{ledgerContent.result.boundary}</p>
          </section>

          <EvidenceInspector
            evidence={netIncomeEvidence}
            id="net-income-evidence"
          />

          <section
            aria-labelledby="profit-check-title"
            className={styles.understanding}
          >
            <form onSubmit={reviewUnderstanding}>
              <fieldset>
                <legend id="profit-check-title">
                  {profitContent.question.prompt}
                </legend>
                <p>{profitContent.question.hint}</p>
                <div className={styles.choices}>
                  {profitContent.question.choices.map((choice) => (
                    <label key={choice.id}>
                      <input
                        checked={selectedChoice === choice.id}
                        name="profit-understanding"
                        onChange={() => setSelectedChoice(choice.id)}
                        type="radio"
                        value={choice.id}
                      />
                      <span>{choice.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <button disabled={!selectedChoice} type="submit">
                Check my reasoning
              </button>
            </form>

            {reviewedChoice ? (
              <p className={styles.feedback} role="status">
                {supportedAnswer
                  ? profitContent.question.supportedFeedback
                  : profitContent.question.unsupportedFeedback}
              </p>
            ) : null}
          </section>

          <details className={styles.exactRecord}>
            <summary>Verify Apple’s exact record and SEC provenance</summary>
            <div className={styles.recordMeta}>
              <dl>
                <div>
                  <dt>Statement</dt>
                  <dd>{profitContent.verification.statementName}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>{profitContent.verification.location}</dd>
                </div>
                <div>
                  <dt>Period ended</dt>
                  <dd>{statement.endDate}</dd>
                </div>
                <div>
                  <dt>Filed</dt>
                  <dd>{statement.filedAt}</dd>
                </div>
                <div>
                  <dt>Form</dt>
                  <dd>{statement.form}</dd>
                </div>
                <div>
                  <dt>Accession</dt>
                  <dd>{statement.accession}</dd>
                </div>
              </dl>
              <p>{profitContent.verification.unitNote}</p>
            </div>

            <table className={styles.recordTable}>
              <caption className="sr-only">
                Apple FY{statement.fiscalYear} income statement values used in
                the Profit lesson
              </caption>
              <thead>
                <tr>
                  <th scope="col">Apple-reported line</th>
                  <th scope="col">Value</th>
                </tr>
              </thead>
              <tbody>
                {statement.lines.map((line) => (
                  <tr key={line.id}>
                    <th scope="row">{lineCopy[line.id].reportedLabel}</th>
                    <td>{formatReportedBillions(line.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div
              aria-label="Exact Apple income statement values"
              className={styles.mobileRecords}
            >
              {statement.lines.map((line) => (
                <div key={line.id}>
                  <span>{lineCopy[line.id].reportedLabel}</span>
                  <strong>{formatReportedBillions(line.value)}</strong>
                </div>
              ))}
            </div>

            <div className={styles.sourceLinks}>
              <a href={statement.sourceUrl} rel="noreferrer" target="_blank">
                Open official SEC filing index ↗
              </a>
              <a
                href={profitContent.sources[0].url}
                rel="noreferrer"
                target="_blank"
              >
                Open the filed statement ↗
              </a>
            </div>
          </details>
        </div>
      ) : null}

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
