"use client";

import { useState, type FormEvent } from "react";

import { EvidenceInspector } from "@/components/evidence-inspector";
import { useLearningProgress } from "@/components/learning-progress-provider";
import lessonContent from "@/content/cash-flow-lessons/aapl-investing-financing-fy2025.json";
import type { CashFlowStatementLineId, CompanyCashFlowStatement } from "@/lib/api";
import { cashFlowSections } from "@/lib/cash-flow-learning";
import {
  buildReportedEvidence,
  buildReviewedPresentation,
  reportedFactFromStatementLine,
  type FinancialStatementLineId,
} from "@/lib/evidence";

type Props = { cashFlowStatement: CompanyCashFlowStatement };
type LineCopy = { reportedLabel: string; helper: string };

const lineCopy = lessonContent.lines as Record<string, LineCopy>;
const reviewedLabels = Object.fromEntries(
  Object.entries(lineCopy).map(([id, copy]) => [id, copy.reportedLabel]),
) as Partial<Record<FinancialStatementLineId, string>>;

const exactBillions = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

function formatBillions(value: number, signed = false): string {
  const amount = `${exactBillions.format(Math.abs(value) / 1_000_000_000)}B`;
  if (!signed) return value < 0 ? `(${amount})` : amount;
  return value < 0 ? `−${amount}` : `+${amount}`;
}

export function InvestingFinancingCashFlowLearning({ cashFlowStatement }: Props) {
  const { markExplored } = useLearningProgress();
  const { statement, dataStatus } = cashFlowStatement;
  const sections = cashFlowSections(statement);
  const operating = sections.get("operating") ?? [];
  const investing = sections.get("investing") ?? [];
  const financing = sections.get("financing") ?? [];
  const allLines = [...operating, ...investing, ...financing];
  const lines = new Map(allLines.map((line) => [line.id, line]));
  const operatingTotal = lines.get("cash-generated-by-operating-activities");
  const investingTotal = lines.get("cash-generated-by-investing-activities");
  const financingTotal = lines.get("cash-used-in-financing-activities");
  const netChange = statement.cashMovement.netChange;
  const [visibleSection, setVisibleSection] = useState(1);
  const [firstChoice, setFirstChoice] = useState<string | null>(null);
  const [reviewedFirst, setReviewedFirst] = useState<string | null>(null);
  const [finalChoice, setFinalChoice] = useState<string | null>(null);
  const [reviewedFinal, setReviewedFinal] = useState<string | null>(null);

  if (!operatingTotal || !investingTotal || !financingTotal) return null;

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

  function reviewFirst(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (firstChoice) setReviewedFirst(firstChoice);
  }

  function reviewFinal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!finalChoice) return;
    setReviewedFinal(finalChoice);
    markExplored(["investing-financing-cash-flow"]);
  }

  return (
    <section className="cash-lesson cash-module" aria-labelledby="cash-module-title">
      <header className="cash-lesson__header">
        <p className="eyebrow">Cash Flow Statement · three activity sections</p>
        <h2 id="cash-module-title">{lessonContent.title}</h2>
        <p>{lessonContent.introduction}</p>
        <p className="profit-lesson__period">
          FY{statement.fiscalYear} · {statement.currency} · year ended {statement.endDate} ·{" "}
          <a href={statement.sourceUrl} rel="noreferrer" target="_blank">SEC {statement.form} ↗</a>
        </p>
      </header>

      <p className="sr-only" aria-live="polite">{visibleSection} of 4 learning sections visible.</p>

      <section className="cash-section cash-section--question" data-cash-module-section="operating-only">
        <p className="cash-section__number">01 · Operating is only one part</p>
        <div className="cash-starting-value">
          <span>Operating Cash Flow</span>
          <strong>{formatBillions(operatingTotal.value)}</strong>
          <small>Apple reported · Operating activities</small>
        </div>
        <form onSubmit={reviewFirst}>
          <fieldset>
            <legend>{lessonContent.firstQuestion.prompt}</legend>
            <p>{lessonContent.firstQuestion.hint}</p>
            <div className="cash-choice-list">
              {lessonContent.firstQuestion.choices.map((choice) => (
                <label key={choice.id}>
                  <input
                    checked={firstChoice === choice.id}
                    name="operating-is-total-change"
                    onChange={() => { setFirstChoice(choice.id); setReviewedFirst(null); }}
                    type="radio"
                    value={choice.id}
                  />
                  <span>{choice.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <button disabled={!firstChoice} type="submit">Check my reasoning</button>
        </form>
        {reviewedFirst ? (
          <div className="cash-feedback" role="status">
            <p>{reviewedFirst === lessonContent.firstQuestion.supportedChoiceId
              ? lessonContent.firstQuestion.supportedFeedback
              : lessonContent.firstQuestion.unsupportedFeedback}</p>
            {visibleSection === 1 ? (
              <button onClick={() => setVisibleSection(2)} type="button">Meet the three sections</button>
            ) : null}
          </div>
        ) : null}
      </section>

      {visibleSection >= 2 ? (
        <section className="cash-section" data-cash-module-section="three-jobs">
          <p className="cash-section__number">02 · Three cash-flow jobs</p>
          <div className="cash-job-grid">
            <article><span>Operating</span><strong>{formatBillions(operatingTotal.value, true)}</strong><p>Cash connected to the main business operations.</p></article>
            <article><span>Investing</span><strong>{formatBillions(investingTotal.value, true)}</strong><p>Cash connected to long-term assets and investments.</p></article>
            <article><span>Financing</span><strong>{formatBillions(financingTotal.value, true)}</strong><p>Cash connected to creditors and owners.</p></article>
          </div>
          <aside className="cash-learning-trace" aria-label="Learning Trace">
            <p><span aria-hidden="true" /> Learning Trace</p>
            <h3>Each section answers a different cash question.</h3>
            <p>{lessonContent.boundaries.operating}</p>
          </aside>
          {visibleSection === 2 ? <button className="cash-continue" onClick={() => setVisibleSection(3)} type="button">See what moved cash</button> : null}
        </section>
      ) : null}

      {visibleSection >= 3 ? (
        <section className="cash-section" data-cash-module-section="reported-lines">
          <p className="cash-section__number">03 · What moved Apple’s cash?</p>
          <div className="cash-example-grid">
            {["maturities-of-marketable-securities", "payments-for-property-plant-and-equipment", "common-stock-repurchases", "dividends-and-dividend-equivalents"].map((id) => {
              const line = lines.get(id as CashFlowStatementLineId);
              if (!line) return null;
              return <article key={id}><span>{lineCopy[id].reportedLabel}</span><strong>{formatBillions(line.value, true)}</strong><p>{lineCopy[id].helper}</p></article>;
            })}
          </div>
          <div className="cash-boundary-notes">
            <p>{lessonContent.boundaries.investing}</p>
            <p>{lessonContent.boundaries.financing}</p>
          </div>
          <details className="cash-full-reconciliation">
            <summary>See all Investing and Financing lines</summary>
            <div>
              {[...investing, ...financing].map((line) => (
                <dl key={line.id}><div data-role={line.role}><dt><strong>{lineCopy[line.id].reportedLabel}</strong><small>{lineCopy[line.id].helper}</small></dt><dd>{formatBillions(line.value, true)}</dd></div></dl>
              ))}
              <a href={lessonContent.sources[0].url} rel="noreferrer" target="_blank">Open the filed statement ↗</a>
            </div>
          </details>
          {visibleSection === 3 ? <button className="cash-continue" onClick={() => setVisibleSection(4)} type="button">Put the statement together</button> : null}
        </section>
      ) : null}

      {visibleSection >= 4 ? (
        <section className="cash-section cash-section--question" data-cash-module-section="cash-change">
          <p className="cash-section__number">04 · Put the statement together</p>
          <dl className="cash-statement-equation">
            <div><dt>Operating</dt><dd>{formatBillions(operatingTotal.value, true)}</dd></div>
            <div><dt>Investing</dt><dd>{formatBillions(investingTotal.value, true)}</dd></div>
            <div><dt>Financing</dt><dd>{formatBillions(financingTotal.value, true)}</dd></div>
            <div className="cash-statement-equation__result"><dt>Net change in cash</dt><dd>{formatBillions(netChange.value, true)}</dd></div>
          </dl>
          <div className="cash-balance-bridge">
            <div><span>Beginning cash</span><strong>{formatBillions(statement.cashMovement.beginningCash.value)}</strong></div>
            <span aria-hidden="true">+</span>
            <div><span>Change</span><strong>{formatBillions(netChange.value, true)}</strong></div>
            <span aria-hidden="true">=</span>
            <div><span>Ending cash</span><strong>{formatBillions(statement.cashMovement.endingCash.value)}</strong></div>
          </div>
          <form onSubmit={reviewFinal}>
            <fieldset>
              <legend>{lessonContent.finalQuestion.prompt}</legend>
              <p>{lessonContent.finalQuestion.hint}</p>
              <div className="cash-choice-list">
                {lessonContent.finalQuestion.choices.map((choice) => (
                  <label key={choice.id}><input checked={finalChoice === choice.id} name="repurchase-section" onChange={() => { setFinalChoice(choice.id); setReviewedFinal(null); }} type="radio" value={choice.id} /><span>{choice.label}</span></label>
                ))}
              </div>
            </fieldset>
            <button disabled={!finalChoice} type="submit">Check my reasoning</button>
          </form>
          {reviewedFinal ? (
            <div className="cash-completion" role="status">
              <p>{reviewedFinal === lessonContent.finalQuestion.supportedChoiceId ? lessonContent.finalQuestion.supportedFeedback : lessonContent.finalQuestion.unsupportedFeedback}</p>
              <EvidenceInspector evidence={netChangeEvidence} id="cash-change-evidence" />
            </div>
          ) : null}
        </section>
      ) : null}

      <p className="profit-retrieved-note">Retrieved {new Date(dataStatus.retrievedAt).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}{dataStatus.state === "stale" ? " · SEC was unavailable, so FinPath is showing the last known public filing data." : ""}</p>
    </section>
  );
}
