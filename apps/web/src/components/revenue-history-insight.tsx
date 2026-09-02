"use client";

import { useState, type FormEvent } from "react";

import { useLearningProgress } from "@/components/learning-progress-provider";
import type { YearOverYearObservation } from "@/lib/history-insight";
import insightContent from "@/content/history-insights/aapl-revenue-fy2023.json";

type RevenueHistoryInsightProps = {
  observation: YearOverYearObservation;
};

const oneDecimal = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function RevenueHistoryInsight({
  observation,
}: RevenueHistoryInsightProps) {
  const { markExplored } = useLearningProgress();
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [reviewedChoice, setReviewedChoice] = useState<string | null>(null);

  const isSupported = reviewedChoice === insightContent.question.supportedChoiceId;
  const source = insightContent.sources[0];
  const hasReviewedContext = Boolean(
    source?.url && source?.title && insightContent.sourcedContext.trim(),
  );
  const percentageDecrease = Math.abs(observation.percentageChange);

  function reviewObservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedChoice) {
      setReviewedChoice(selectedChoice);
      markExplored(["revenue", "revenue-growth"]);
    }
  }

  return (
    <section className="history-insight" aria-labelledby="history-insight-heading">
      <header className="history-insight__header">
        <div>
          <p className="eyebrow">FY2023 evidence check</p>
          <h3 id="history-insight-heading">What can this decline actually prove?</h3>
        </div>
        <p>
          This check returns to FY2022 → FY2023. The calculation shows what changed,
          but not why Revenue changed or what happened to Profit.
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
                The two reported annual totals support this statement. They do not
                support a conclusion about the cause or about Profit.
              </p>
            </section>

            {hasReviewedContext ? (
              <>
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
              </>
            ) : (
              <section>
                <p className="evidence-label">Context unavailable</p>
                <h4>FinPath is not presenting a cause.</h4>
                <p>
                  The reviewed source or its context is missing. The Revenue change is
                  still visible, but a cause should not be inferred from the chart.
                </p>
              </section>
            )}

            <section>
              <p className="evidence-label">Still unknown</p>
              <h4>The chart cannot prove why—or what happened to Profit.</h4>
              <p>{insightContent.unknown}</p>
            </section>
          </div>

        </div>
      ) : null}
    </section>
  );
}
