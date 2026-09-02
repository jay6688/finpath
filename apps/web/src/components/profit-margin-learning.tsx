"use client";

import { useState, type CSSProperties, type FormEvent } from "react";

import { EvidenceInspector } from "@/components/evidence-inspector";
import { LearningUpNext } from "@/components/learning-up-next";
import { useLearningProgress } from "@/components/learning-progress-provider";
import marginContent from "@/content/profit-margin-lessons/aapl-profit-margin-fy2025.json";
import profitContent from "@/content/profit-lessons/aapl-profit-fy2025.json";
import type { CompanyIncomeStatement, IncomeStatementLineId } from "@/lib/api";
import {
  buildNetProfitMarginEvidence,
  buildReviewedPresentation,
} from "@/lib/evidence";
import type { NetProfitMarginDerivation } from "@/lib/profit-margin";


type ProfitMarginLearningProps = {
  incomeStatement: CompanyIncomeStatement;
  derivation: NetProfitMarginDerivation;
};

const exactBillions = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

function formatBillions(value: number): string {
  return `${exactBillions.format(value / 1_000_000_000)}B`;
}

const reviewedLabels = Object.fromEntries(
  Object.entries(profitContent.lines).map(([id, line]) => [id, line.reportedLabel]),
) as Partial<Record<IncomeStatementLineId, string>>;

export function ProfitMarginLearning({
  incomeStatement,
  derivation,
}: ProfitMarginLearningProps) {
  const { markExplored } = useLearningProgress();
  const { statement, dataStatus } = incomeStatement;
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [reviewedChoice, setReviewedChoice] = useState<string | null>(null);
  const percentDisplay = derivation.displayPercent.toFixed(1);
  const perHundredDisplay = derivation.perHundredRevenue.toFixed(2);
  const outsideShareDisplay = (100 - derivation.perHundredRevenue).toFixed(2);
  const supportedAnswer =
    reviewedChoice === marginContent.question.supportedChoiceId;
  const scaleStyle = {
    "--net-income-share": `${derivation.displayPercent}%`,
  } as CSSProperties;
  const reviewedContent = {
    fiscalYear: marginContent.fiscalYear,
    startDate: marginContent.startDate,
    endDate: marginContent.endDate,
    form: marginContent.form as "10-K" | "10-K/A",
    filedAt: marginContent.filedAt,
    accession: marginContent.accession,
    statementName: marginContent.verification.statementName,
    labels: reviewedLabels,
  };
  const marginEvidence = buildNetProfitMarginEvidence({
    incomeStatement,
    derivation,
    reviewedRevenue: buildReviewedPresentation({
      statement,
      content: reviewedContent,
      lineId: "total-net-sales",
      contextLineIds: ["total-net-sales"],
    }),
    reviewedNetIncome: buildReviewedPresentation({
      statement,
      content: reviewedContent,
      lineId: "net-income",
      contextLineIds: ["net-income"],
    }),
  });

  function revealCalculation() {
    setIsRevealed(true);
  }

  function reviewUnderstanding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedChoice) {
      setReviewedChoice(selectedChoice);
      markExplored(["net-profit-margin"]);
    }
  }

  function selectChoice(choiceId: string) {
    setSelectedChoice(choiceId);
    setReviewedChoice(null);
  }

  return (
    <section
      className="profit-margin-lesson"
      id="profit-margin-lesson"
      aria-labelledby="profit-margin-title"
    >
      <header className="profit-margin-lesson__header">
        <p className="eyebrow">Net Profit Margin · guided ratio</p>
        <h2 id="profit-margin-title">{marginContent.title}</h2>
        <p className="profit-margin-lesson__introduction">
          {marginContent.introduction}
        </p>
        <p className="profit-margin-lesson__period">
          FY{statement.fiscalYear} · {statement.currency} · year ended{" "}
          {statement.endDate} · filed {statement.filedAt} ·{" "}
          <a href={statement.sourceUrl} rel="noreferrer" target="_blank">
            SEC {statement.form} ↗
          </a>
        </p>
      </header>

      <section className="profit-margin-reported" aria-labelledby="reported-values-heading">
        <div className="profit-margin-section-heading">
          <p className="eyebrow" id="reported-values-heading">Apple reported</p>
          <span>FY{statement.fiscalYear} · USD billions</span>
        </div>
        <dl>
          <div>
            <dt>Revenue</dt>
            <dd>{formatBillions(derivation.revenue)}</dd>
            <small>Apple label: Total net sales</small>
          </div>
          <div>
            <dt>Net Income</dt>
            <dd>{formatBillions(derivation.netIncome)}</dd>
            <small>Apple label: Net income</small>
          </div>
        </dl>
      </section>

      <p className="sr-only" aria-live="polite">
        {isRevealed ? "Net Profit Margin calculation revealed." : ""}
      </p>

      {!isRevealed ? (
        <section className="profit-margin-discovery" aria-labelledby="margin-discovery-heading">
          <p className="eyebrow" id="margin-discovery-heading">
            {marginContent.discovery.heading}
          </p>
          <h3>{marginContent.discovery.prompt}</h3>
          <p>{marginContent.discovery.support}</p>
          <button onClick={revealCalculation} type="button">
            {marginContent.discovery.revealLabel}
          </button>
        </section>
      ) : (
        <div className="profit-margin-reveal">
          <section className="profit-margin-calculation" aria-labelledby="margin-calculation-heading">
            <p className="eyebrow" id="margin-calculation-heading">
              {marginContent.formula.heading}
            </p>
            <div className="profit-margin-formula">
              <div>
                <span>{marginContent.formula.expression}</span>
                <strong>
                  {formatBillions(derivation.netIncome)} ÷{" "}
                  {formatBillions(derivation.revenue)} × 100
                </strong>
              </div>
              <div className="profit-margin-result">
                <span>{marginContent.formula.resultLabel}</span>
                <strong>≈ {percentDisplay}%</strong>
              </div>
            </div>
          </section>

          <div className="profit-margin-understanding-grid">
            <figure className="profit-margin-scale" style={scaleStyle}>
              <figcaption>On a $100 Revenue scale</figcaption>
              <strong>${perHundredDisplay} Net Income</strong>
              <div
                className="profit-margin-scale__visual"
                role="img"
                aria-label={`Static ratio visualization: about $${perHundredDisplay} of Net Income for every $100 of Revenue`}
              >
                <span aria-hidden="true" />
              </div>
              <div className="profit-margin-scale__labels" aria-hidden="true">
                <span>$0</span>
                <span>$100 Revenue</span>
              </div>
              <small>Static ratio visualization · not a slider</small>
            </figure>

            <aside className="profit-margin-trace" aria-labelledby="margin-trace-heading">
              <p className="profit-margin-trace__label">
                <span aria-hidden="true" /> Learning Trace
              </p>
              <h3 id="margin-trace-heading">
                About ${perHundredDisplay} of Net Income for every $100 of Revenue.
              </h3>
              <p>{marginContent.ratioBoundary}</p>
            </aside>
          </div>

          <p className="profit-margin-terminology">
            <strong>Keep the terms separate</strong>
            {marginContent.terminology}
          </p>

          <section className="profit-margin-application" aria-labelledby="margin-check-title">
            <form onSubmit={reviewUnderstanding}>
              <fieldset>
                <legend id="margin-check-title">{marginContent.question.prompt}</legend>
                <p>{marginContent.question.hint}</p>
                <div className="profit-margin-application__choices">
                  <label>
                    <input
                      checked={selectedChoice === "net-income-share"}
                      name="profit-margin-understanding"
                      onChange={() => selectChoice("net-income-share")}
                      type="radio"
                      value="net-income-share"
                    />
                    <span>${perHundredDisplay}</span>
                  </label>
                  <label>
                    <input
                      checked={selectedChoice === "outside-share"}
                      name="profit-margin-understanding"
                      onChange={() => selectChoice("outside-share")}
                      type="radio"
                      value="outside-share"
                    />
                    <span>${outsideShareDisplay}</span>
                  </label>
                </div>
              </fieldset>
              <button disabled={!selectedChoice} type="submit">
                Check my reasoning
              </button>
            </form>

            {reviewedChoice ? (
              <p className="profit-margin-application__feedback" role="status">
                <strong>{supportedAnswer ? `About $${perHundredDisplay}. ` : "Not quite. "}</strong>
                {supportedAnswer
                  ? marginContent.question.supportedFeedback
                  : marginContent.question.unsupportedFeedback}
              </p>
            ) : null}
          </section>

          <EvidenceInspector evidence={marginEvidence} id="profit-margin-evidence" />

          <aside className="profit-margin-limitation" aria-labelledby="margin-limitation-heading">
            <p className="eyebrow" id="margin-limitation-heading">What this cannot tell you</p>
            <p>{marginContent.limitation}</p>
          </aside>
        </div>
      )}

      <LearningUpNext currentConceptId="net-profit-margin" />

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
