"use client";

import { useState, type FormEvent } from "react";

import type { YearOverYearObservation } from "@/lib/history-insight";
import insightContent from "@/content/history-insights/aapl-revenue-fy2023.json";

type RevenueHistoryInsightProps = {
  observation: YearOverYearObservation;
};

const exactBillions = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const oneDecimal = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const sixDecimals = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 6,
  maximumFractionDigits: 6,
});

function formatBillions(value: number): string {
  return `${exactBillions.format(value / 1_000_000_000)} billion`;
}

function formatBillionsFormula(value: number): string {
  return `${exactBillions.format(value / 1_000_000_000)}B`;
}

export function RevenueHistoryInsight({
  observation,
}: RevenueHistoryInsightProps) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [reviewedChoice, setReviewedChoice] = useState<string | null>(null);

  const isSupported = reviewedChoice === insightContent.question.supportedChoiceId;
  const source = insightContent.sources[0];
  const decrease = Math.abs(observation.absoluteChange);
  const percentageDecrease = Math.abs(observation.percentageChange);

  function reviewObservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedChoice) setReviewedChoice(selectedChoice);
  }

  return (
    <section className="history-insight" aria-labelledby="history-insight-heading">
      <header className="history-insight__header">
        <div>
          <p className="eyebrow">Guided history insight</p>
          <h3 id="history-insight-heading">Notice first. Explain second.</h3>
        </div>
        <p>
          Start with what the five reported numbers can support. Context comes after the
          observation.
        </p>
      </header>

      <form className="observation-question" onSubmit={reviewObservation}>
        <fieldset>
          <legend>{insightContent.question.prompt}</legend>
          <p className="observation-question__hint">Choose one. This is practice, not a score.</p>
          <div className="observation-choices">
            {insightContent.question.choices.map((choice) => (
              <label key={choice.id}>
                <input
                  checked={selectedChoice === choice.id}
                  name="history-observation"
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
          Check my observation
        </button>
      </form>

      {reviewedChoice ? (
        <div className="history-insight__result">
          <p className="observation-feedback" role="status">
            {isSupported
              ? insightContent.question.supportedFeedback
              : insightContent.question.unsupportedFeedback}
          </p>

          <div className="evidence-layers">
            <section>
              <p className="evidence-label">Observable fact</p>
              <h4>
                Revenue fell {oneDecimal.format(percentageDecrease)}% in FY
                {observation.current.fiscalYear}.
              </h4>
              <p>
                Apple Revenue decreased by {formatBillions(decrease)}, from{" "}
                {formatBillions(observation.previous.value)} in FY
                {observation.previous.fiscalYear} to {formatBillions(observation.current.value)} in
                FY{observation.current.fiscalYear}. The calculation is ({formatBillionsFormula(
                  observation.current.value,
                )} − {formatBillionsFormula(observation.previous.value)}) ÷{" "}
                {formatBillionsFormula(observation.previous.value)} × 100 = −
                {sixDecimals.format(percentageDecrease)}%, shown as down{" "}
                {oneDecimal.format(percentageDecrease)}%.
              </p>
            </section>

            <section>
              <p className="evidence-label">Apple reported</p>
              <h4>Currency and business mix added context.</h4>
              <p>{insightContent.sourcedContext}</p>
              <a href={source.url} rel="noreferrer" target="_blank">
                Read the FY2023 10-K context ↗
              </a>
              <small>
                {source.location} · filed {source.filedAt}
              </small>
            </section>

            <section>
              <p className="evidence-label">FinPath interpretation</p>
              <h4>This was not a one-cause story.</h4>
              <p>{insightContent.interpretation}</p>
            </section>

            <section>
              <p className="evidence-label">Still unknown</p>
              <h4>The chart cannot prove why—or what happened to Profit.</h4>
              <p>{insightContent.unknown}</p>
            </section>
          </div>

          <aside className="next-concept-preview" aria-label="Next learning preview">
            <span aria-hidden="true" />
            <div>
              <p className="eyebrow">Continue</p>
              <p>{insightContent.nextPreview}</p>
              <small>Preview only. The Profit lesson is not available yet.</small>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
