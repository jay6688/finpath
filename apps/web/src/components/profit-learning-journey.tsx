"use client";

import { useState, type FormEvent } from "react";

import { LearningUpNext } from "@/components/learning-up-next";
import { useLearningProgress } from "@/components/learning-progress-provider";
import profitContent from "@/content/profit-lessons/aapl-profit-fy2025.json";
import type {
  CompanyIncomeStatement,
  IncomeStatementLine,
  IncomeStatementLineId,
} from "@/lib/api";
import { incomeStatementLineMap } from "@/lib/profit-learning";


type ProfitLearningJourneyProps = {
  incomeStatement: CompanyIncomeStatement;
};

type StageContent = {
  id: string;
  navigationLabel: string;
  continueLabel: string;
  lineIds: IncomeStatementLineId[];
  traceHeading: string;
  traceBody: string;
  traceBoundary: string;
};

type LineCopy = {
  reportedLabel: string;
  helper: string;
};

const stages = profitContent.stages as StageContent[];
const lineCopy = profitContent.lines as Record<IncomeStatementLineId, LineCopy>;

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

function operationFor(line: IncomeStatementLine): {
  symbol: string;
  accessible: string;
} {
  if (line.role === "deduction") {
    return { symbol: "−", accessible: "subtract" };
  }
  if (line.role === "signed-adjustment") {
    return line.value < 0
      ? { symbol: "−", accessible: "negative adjustment" }
      : { symbol: "+", accessible: "positive adjustment" };
  }
  if (line.role === "subtotal" || line.role === "final-total") {
    return { symbol: "=", accessible: "equals" };
  }
  return { symbol: "•", accessible: "starting amount" };
}

export function ProfitLearningJourney({
  incomeStatement,
}: ProfitLearningJourneyProps) {
  const { markExplored } = useLearningProgress();
  const { statement, dataStatus } = incomeStatement;
  const linesById = incomeStatementLineMap(statement.lines);
  const revenue = linesById.get("total-net-sales");
  const netIncome = linesById.get("net-income");
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [furthestRevealedStageIndex, setFurthestRevealedStageIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [reviewedChoice, setReviewedChoice] = useState<string | null>(null);

  if (!revenue || !netIncome) return null;

  const visibleStages = stages.slice(0, furthestRevealedStageIndex + 1);
  const activeStage = stages[activeStageIndex];
  const isComplete = furthestRevealedStageIndex === stages.length - 1;
  const supportedAnswer =
    reviewedChoice === profitContent.question.supportedChoiceId;

  function selectStage(stageIndex: number) {
    if (stageIndex > furthestRevealedStageIndex + 1) return;
    setFurthestRevealedStageIndex((current) => Math.max(current, stageIndex));
    setActiveStageIndex(stageIndex);
    if (stageIndex === stages.length - 1) markExplored(["profit"]);
  }

  function continueJourney() {
    const nextIndex = Math.min(
      furthestRevealedStageIndex + 1,
      stages.length - 1,
    );
    setFurthestRevealedStageIndex(nextIndex);
    setActiveStageIndex(nextIndex);
    if (nextIndex === stages.length - 1) markExplored(["profit"]);
  }

  function reviewUnderstanding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedChoice) setReviewedChoice(selectedChoice);
  }

  return (
    <section className="profit-lesson" id="profit-lesson" aria-labelledby="profit-title">
      <header className="profit-lesson__header">
        <p className="eyebrow">Profit · guided income statement</p>
        <h2 id="profit-title">{profitContent.title}</h2>
        <p className="profit-lesson__introduction">
          Apple reported {formatBillions(revenue.value)} of Revenue and{" "}
          {formatBillions(netIncome.value)} of Net Income for FY
          {statement.fiscalYear}. Read the reported income-statement lines that
          connect the two figures.
        </p>
        <p className="profit-lesson__period">
          FY{statement.fiscalYear} · {statement.currency} · year ended{" "}
          {statement.endDate} · filed {statement.filedAt} ·{" "}
          <a href={statement.sourceUrl} rel="noreferrer" target="_blank">
            SEC {statement.form} ↗
          </a>
        </p>
        <p className="profit-lesson__boundary">{profitContent.boundary}</p>
      </header>

      <nav className="profit-stage-navigation" aria-label="Profit learning stages">
        {stages.map((stage, stageIndex) => (
          <button
            aria-pressed={activeStageIndex === stageIndex}
            disabled={stageIndex > furthestRevealedStageIndex + 1}
            key={stage.id}
            onClick={() => selectStage(stageIndex)}
            type="button"
          >
            <span>{String(stageIndex + 1).padStart(2, "0")}</span>
            {stage.navigationLabel}
          </button>
        ))}
      </nav>

      <div className="profit-mobile-progress" aria-label={`Learning stage ${activeStageIndex + 1} of ${stages.length}`}>
        <p>
          <span>Learning stage {activeStageIndex + 1} of {stages.length}</span>
          <strong>{activeStage.navigationLabel}</strong>
        </p>
        <div>
          {stages.map((stage, stageIndex) => (
            <button
              aria-label={
                stageIndex <= furthestRevealedStageIndex + 1
                  ? `Show ${stage.navigationLabel}`
                  : `${stage.navigationLabel} is not revealed yet`
              }
              aria-pressed={activeStageIndex === stageIndex}
              disabled={stageIndex > furthestRevealedStageIndex + 1}
              key={stage.id}
              onClick={() => selectStage(stageIndex)}
              type="button"
            >
              <span aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        Showing {activeStage.navigationLabel}. {visibleStages.length} of{" "}
        {stages.length} learning stages are visible.
      </p>

      <div className="profit-journey">
        <div className="profit-journey__heading">
          <strong>Apple-reported line</strong>
          <strong>FY{statement.fiscalYear} · USD billions</strong>
        </div>

        {visibleStages.map((stage, stageIndex) => (
          <section
            className="profit-stage"
            data-active={activeStageIndex === stageIndex}
            data-profit-stage={stage.id}
            data-revealed="true"
            key={stage.id}
          >
            <div className="profit-stage__lines">
              <p className="profit-stage__label">
                Learning stage {stageIndex + 1} · {stage.navigationLabel}
              </p>
              {stage.lineIds.map((lineId) => {
                const line = linesById.get(lineId);
                if (!line) return null;
                const copy = lineCopy[lineId];
                const operation = operationFor(line);

                return (
                  <div
                    className="profit-line"
                    data-line-id={line.id}
                    data-role={line.role}
                    key={line.id}
                  >
                    <span className="profit-line__operator" aria-hidden="true">
                      {operation.symbol}
                    </span>
                    <span className="sr-only">{operation.accessible} </span>
                    <div className="profit-line__label">
                      <strong>{copy.reportedLabel}</strong>
                      <small>{copy.helper}</small>
                    </div>
                    <strong className="profit-line__value">
                      {formatBillions(line.value)}
                    </strong>
                  </div>
                );
              })}
            </div>

            {activeStageIndex === stageIndex ? (
              <aside className="profit-learning-trace" aria-label="Current Learning Trace">
                <p className="profit-learning-trace__label">
                  <span aria-hidden="true" /> Learning Trace
                </p>
                <h3>{stage.traceHeading}</h3>
                <p>{stage.traceBody}</p>
                <p className="profit-learning-trace__boundary">
                  <strong>Boundary</strong>
                  {stage.traceBoundary}
                </p>
              </aside>
            ) : null}
          </section>
        ))}

        <p className="profit-journey__display-note">
          {profitContent.verification.displayNote}
        </p>
      </div>

      {!isComplete ? (
        <button
          className="profit-continue"
          onClick={continueJourney}
          type="button"
        >
          {stages[furthestRevealedStageIndex].continueLabel}
        </button>
      ) : (
        <div className="profit-completion">
          <section className="profit-understanding" aria-labelledby="profit-check-title">
            <form onSubmit={reviewUnderstanding}>
              <fieldset>
                <legend id="profit-check-title">
                  {profitContent.question.prompt}
                </legend>
                <p>{profitContent.question.hint}</p>
                <div className="profit-understanding__choices">
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
              <p className="profit-understanding__feedback" role="status">
                {supportedAnswer
                  ? profitContent.question.supportedFeedback
                  : profitContent.question.unsupportedFeedback}
              </p>
            ) : null}
          </section>

          <details className="profit-exact-record">
            <summary>Verify Apple’s exact record and SEC provenance</summary>
            <div className="profit-exact-record__meta">
              <dl>
                <div><dt>Statement</dt><dd>{profitContent.verification.statementName}</dd></div>
                <div><dt>Location</dt><dd>{profitContent.verification.location}</dd></div>
                <div><dt>Period ended</dt><dd>{statement.endDate}</dd></div>
                <div><dt>Filed</dt><dd>{statement.filedAt}</dd></div>
                <div><dt>Form</dt><dd>{statement.form}</dd></div>
                <div><dt>Accession</dt><dd>{statement.accession}</dd></div>
              </dl>
              <p>{profitContent.verification.unitNote}</p>
            </div>

            <table className="profit-record-table">
              <caption className="sr-only">
                Apple FY{statement.fiscalYear} income statement values used in the
                Profit lesson
              </caption>
              <thead><tr><th scope="col">Apple-reported line</th><th scope="col">Value</th></tr></thead>
              <tbody>
                {statement.lines.map((line) => (
                  <tr key={line.id}>
                    <th scope="row">{lineCopy[line.id].reportedLabel}</th>
                    <td>{formatReportedBillions(line.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="profit-mobile-records" aria-label="Exact Apple income statement values">
              {statement.lines.map((line) => (
                <div key={line.id}>
                  <span>{lineCopy[line.id].reportedLabel}</span>
                  <strong>{formatReportedBillions(line.value)}</strong>
                </div>
              ))}
            </div>

            <div className="profit-source-links">
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
      )}

      <LearningUpNext currentConceptId="profit" />

      <p className="profit-retrieved-note">
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
