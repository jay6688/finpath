"use client";

import { useMemo, useState } from "react";

import profitContent from "@/content/profit-lessons/aapl-profit-fy2025.json";
import type {
  CompanyIncomeStatement,
  IncomeStatementLine,
  IncomeStatementLineId,
} from "@/lib/api";
import {
  incomeStatementLineMap,
  visibleProfitLineIds,
} from "@/lib/profit-learning";

import styles from "./visual-prototype.module.css";

type StageZeroProfitProps = {
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
  helper: string;
  reportedLabel: string;
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
  const result = `${exactBillions.format(Math.abs(value) / 1_000_000_000)}B`;
  return value < 0 ? `(${result})` : result;
}

function operation(line: IncomeStatementLine): string {
  if (line.role === "deduction") return "−";
  if (line.role === "signed-adjustment") return line.value < 0 ? "−" : "+";
  if (line.role === "subtotal" || line.role === "final-total") return "=";
  return "";
}

function StageValue({ line }: { line: IncomeStatementLine }) {
  const copy = lineCopy[line.id];
  return (
    <div className={styles.profitLine} data-role={line.role}>
      <span className={styles.profitOperator} aria-hidden="true">
        {operation(line)}
      </span>
      <div>
        <strong>{copy.reportedLabel}</strong>
        <small>{copy.helper}</small>
      </div>
      <b>{formatBillions(line.value)}</b>
    </div>
  );
}

export function StageZeroProfit({ incomeStatement }: StageZeroProfitProps) {
  const { statement } = incomeStatement;
  const linesById = useMemo(
    () => incomeStatementLineMap(statement.lines),
    [statement.lines],
  );
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [furthestStageIndex, setFurthestStageIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [reviewedAnswer, setReviewedAnswer] = useState<string | null>(null);
  const visibleIds = visibleProfitLineIds(stages, furthestStageIndex);
  const activeStage = stages[activeStageIndex];
  const revenue = linesById.get("total-net-sales");
  const costOfSales = linesById.get("total-cost-of-sales");
  const operatingExpenses = linesById.get("total-operating-expenses");
  const otherExpense = linesById.get("other-income-expense-net");
  const incomeTax = linesById.get("income-tax-provision");
  const netIncome = linesById.get("net-income");
  const allRevealed = furthestStageIndex === stages.length - 1;

  if (
    !revenue ||
    !costOfSales ||
    !operatingExpenses ||
    !otherExpense ||
    !incomeTax ||
    !netIncome
  ) {
    return null;
  }

  const visualSteps = [
    {
      id: "revenue",
      label: "Revenue",
      line: revenue,
      revealAt: 0,
      tone: "revenue",
    },
    {
      id: "cost",
      label: "Cost of sales",
      line: costOfSales,
      revealAt: 1,
      tone: "cost",
    },
    {
      id: "operating",
      label: "Operating expenses",
      line: operatingExpenses,
      revealAt: 2,
      tone: "operating",
    },
    {
      id: "other-expense",
      label: "Other income/(expense), net",
      line: otherExpense,
      revealAt: 3,
      tone: "other",
    },
    {
      id: "tax",
      label: "Provision for income taxes",
      line: incomeTax,
      revealAt: 4,
      tone: "tax",
    },
    {
      id: "net-income",
      label: "Net income",
      line: netIncome,
      revealAt: 4,
      tone: "net",
    },
  ] as const;

  function revealStage(index: number) {
    if (index > furthestStageIndex + 1) return;
    setFurthestStageIndex((current) => Math.max(current, index));
    setActiveStageIndex(index);
  }

  function continueLesson() {
    revealStage(Math.min(furthestStageIndex + 1, stages.length - 1));
  }

  return (
    <div className={styles.learnCanvas}>
      <div className={styles.lessonTopline}>
        <span>Company Analysis Basics</span>
        <span>Lesson 3 of 15</span>
      </div>

      <header className={styles.learnHeading}>
        <div>
          <p className={styles.kicker}>Profit · FY2025 income statement</p>
          <h1>Profit</h1>
          <p>{profitContent.title}</p>
        </div>
        <div className={styles.lessonProgress} aria-label={`${furthestStageIndex + 1} of 5 stages revealed`}>
          {stages.map((stage, index) => (
            <span data-revealed={index <= furthestStageIndex} key={stage.id} />
          ))}
          <strong>{furthestStageIndex + 1} / {stages.length}</strong>
        </div>
      </header>

      <section className={styles.profitOverview} aria-labelledby="profit-visual-heading">
        <div className={styles.profitVisualIntro}>
          <p className={styles.kicker}>Reported path</p>
          <h2 id="profit-visual-heading">From Revenue to Net Income</h2>
          <p>
            Follow Apple&apos;s reported lines. Each revealed step stays visible so
            the complete income-statement relationship can build in place.
          </p>
          <a href={statement.sourceUrl} rel="noreferrer" target="_blank">
            Open Apple FY{statement.fiscalYear} SEC {statement.form} filing <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className={styles.profitCascade}>
          <p className={styles.profitHandNote}>The final line is an accounting result, not cash.</p>
          {visualSteps.map((step) => {
            const stageVisible = step.revealAt <= furthestStageIndex;
            return (
              <div
                className={styles.profitBlock}
                data-tone={step.tone}
                data-visible={stageVisible}
                key={step.id}
              >
                <span>{step.label}</span>
                <strong>{stageVisible ? formatBillions(step.line.value) : "Reveal next"}</strong>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.profitJourney} aria-labelledby="profit-journey-heading">
        <header>
          <p className={styles.kicker}>One continuous journey</p>
          <h2 id="profit-journey-heading">Read the reported lines in order</h2>
          <p>
            Reported figures · USD billions · year ended {statement.endDate} · filed {statement.filedAt}
          </p>
        </header>

        <ol className={styles.stageList}>
          {stages.map((stage, stageIndex) => {
            const isRevealed = stageIndex <= furthestStageIndex;
            const isActive = stageIndex === activeStageIndex;
            return (
              <li data-active={isActive} data-revealed={isRevealed} key={stage.id}>
                <button
                  aria-expanded={isActive}
                  disabled={!isRevealed && stageIndex > furthestStageIndex + 1}
                  onClick={() => revealStage(stageIndex)}
                  type="button"
                >
                  <span>{stageIndex + 1}</span>
                  <div>
                    <strong>{stage.navigationLabel}</strong>
                    <small>{isRevealed ? "Reported lines visible" : "Reveal this stage"}</small>
                  </div>
                  <b>{isActive ? "Hide detail" : isRevealed ? "Review" : "Show"}</b>
                </button>

                {isActive && isRevealed ? (
                  <div className={styles.stageDetail}>
                    <div className={styles.stageLines}>
                      {stage.lineIds.map((lineId) => {
                        const line = linesById.get(lineId);
                        return line ? <StageValue key={lineId} line={line} /> : null;
                      })}
                    </div>

                    <aside className={styles.learningTrace}>
                      <p className={styles.kicker}>Learning Trace</p>
                      <h3>{activeStage.traceHeading}</h3>
                      <p>{activeStage.traceBody}</p>
                      <small>{activeStage.traceBoundary}</small>
                    </aside>

                    {!allRevealed && stageIndex === furthestStageIndex ? (
                      <button className={styles.continueButton} onClick={continueLesson} type="button">
                        {stage.continueLabel} <span aria-hidden="true">→</span>
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </section>

      {allRevealed ? (
        <section className={styles.profitFinish}>
          <div className={styles.conceptCheck}>
            <p className={styles.kicker}>Try the relationship</p>
            <h2>{profitContent.question.prompt}</h2>
            <p>{profitContent.question.hint}</p>
            <div>
              {profitContent.question.choices.map((choice) => (
                <label key={choice.id}>
                  <input
                    checked={answer === choice.id}
                    name="profit-prototype-check"
                    onChange={() => setAnswer(choice.id)}
                    type="radio"
                    value={choice.id}
                  />
                  <span>{choice.label}</span>
                </label>
              ))}
            </div>
            <button
              disabled={!answer}
              onClick={() => setReviewedAnswer(answer)}
              type="button"
            >
              Check my thinking
            </button>
            {reviewedAnswer ? (
              <p aria-live="polite" className={styles.checkFeedback}>
                {reviewedAnswer === profitContent.question.supportedChoiceId
                  ? profitContent.question.supportedFeedback
                  : profitContent.question.unsupportedFeedback}
              </p>
            ) : null}
          </div>

          <aside className={styles.profitTakeaway}>
            <p className={styles.kicker}>Key takeaway</p>
            <h2>Net Income is Apple&apos;s final Profit line here.</h2>
            <p>{profitContent.boundary}</p>
            <strong>{profitContent.nextPreview}</strong>
          </aside>
        </section>
      ) : null}

      <p className={styles.prototypeBoundary}>
        Visible reported lines: {visibleIds.length} of {statement.lines.length}. No financial values are supplied by this visual prototype.
      </p>
    </div>
  );
}
