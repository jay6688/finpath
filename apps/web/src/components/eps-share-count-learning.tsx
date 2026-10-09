"use client";

import { useState, type FormEvent } from "react";

import { EpsEvidenceInspector } from "@/components/eps-evidence-inspector";
import { useLearningProgress } from "@/components/learning-progress-provider";
import { SharesOutstandingEvidenceInspector } from "@/components/shares-outstanding-evidence-inspector";
import styles from "@/components/eps-share-count-learning.module.css";
import type {
  CompanyEarningsPerShare,
  CompanySharesOutstanding,
} from "@/lib/api";

type Basis = "basic" | "diluted";
type Props = {
  response: CompanyEarningsPerShare;
  sharesOutstanding: CompanySharesOutstanding;
};

const exactInteger = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const exactBillions = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

function formatUsdBillions(value: number): string {
  return `$${exactBillions.format(value / 1_000_000_000)}B`;
}

function formatShares(value: number): string {
  return `${exactInteger.format(value)} shares`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function EpsShareCountLearning({ response, sharesOutstanding }: Props) {
  const { markExplored } = useLearningProgress();
  const [basis, setBasis] = useState<Basis>("diluted");
  const [answer, setAnswer] = useState<"period" | "instant" | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { statement } = response;
  const shareFact = basis === "basic"
    ? statement.basicWeightedAverageShares
    : statement.dilutedWeightedAverageShares;
  const epsFact = basis === "basic" ? statement.basicEps : statement.dilutedEps;
  const verification = basis === "basic"
    ? statement.basicVerification
    : statement.dilutedVerification;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!answer || submitted) return;
    setSubmitted(true);
    markExplored(["eps-and-share-count"]);
  };

  return (
    <article className={styles.lesson} aria-labelledby="eps-question">
      <header className={styles.introduction}>
        <p className="eyebrow">Earnings denominator lens</p>
        <h2 id="eps-question">What does earnings per share actually divide?</h2>
        <p>
          EPS relates company earnings to a weighted-average share count across
          the reporting period. Not every share count answers that question.
        </p>
      </header>

      <div className={styles.basisControls} role="group" aria-label="EPS basis">
        <button aria-pressed={basis === "diluted"} onClick={() => setBasis("diluted")} type="button">
          Diluted EPS
        </button>
        <button aria-pressed={basis === "basic"} onClick={() => setBasis("basic")} type="button">
          Basic EPS
        </button>
      </div>

      <section className={styles.fraction} aria-labelledby="eps-fraction-heading">
        <div className={styles.fractionHeading}>
          <div>
            <span>Reported facts · FY{statement.fiscalYear}</span>
            <h3 id="eps-fraction-heading">{basis === "diluted" ? "Diluted" : "Basic"} EPS</h3>
          </div>
          <strong>${epsFact.value}<small>per share</small></strong>
        </div>

        <div className={styles.equation} aria-label={`${basis} earnings per share verification`}>
          <div className={styles.numerator}>
            <span>Reported numerator · Net Income</span>
            <strong>{formatUsdBillions(statement.earningsNumerator.value)}</strong>
            <small>{statement.earningsNumerator.reportedLabel}</small>
          </div>
          <b aria-hidden="true">÷</b>
          <div className={styles.denominator}>
            <span>Reported denominator</span>
            <strong>{formatShares(shareFact.value)}</strong>
            <small>{basis} weighted-average shares · {statement.startDate} to {statement.endDate}</small>
          </div>
          <b aria-hidden="true">→</b>
          <div className={styles.result}>
            <span>Company-reported result</span>
            <strong>${epsFact.value}</strong>
            <small>FinPath verification before rounding: ${verification.unroundedResult}</small>
          </div>
        </div>

        <p className={styles.relationship}>
          Net Income ÷ {basis} weighted-average shares → {basis === "diluted" ? "Diluted" : "Basic"} EPS.
          With the same earnings, if the weighted-average share count increased,
          EPS would decrease. This is an accounting relationship, not an investment verdict.
        </p>
        <p className={styles.relationship}>
          The default relationship is Net Income ÷ diluted weighted-average shares
          → Diluted EPS. Basic EPS instead uses weighted-average basic shares.
        </p>
      </section>

      <section className={styles.instantContrast} aria-labelledby="instant-shares-heading">
        <div>
          <p className="eyebrow">A different share-count object</p>
          <h3 id="instant-shares-heading">Point-in-time shares outstanding</h3>
          <strong>{formatShares(sharesOutstanding.fact.value)}</strong>
          <p>Reported as of {formatDate(sharesOutstanding.fact.asOfDate)}</p>
        </div>
        <div className={styles.notDenominator}>
          <strong>Separate on purpose</strong>
          <p>
            This instant share count is not the EPS denominator. It supports the
            Market Cap lesson; it must not silently replace weighted-average shares
            measured across FY{statement.fiscalYear}.
          </p>
        </div>
        <SharesOutstandingEvidenceInspector response={sharesOutstanding} />
      </section>

      <section className={styles.boundaries} aria-labelledby="eps-boundaries-heading">
        <h3 id="eps-boundaries-heading">Keep the object boundaries intact</h3>
        <p>
          EPS is not the same as a share price, dividend, cash per share or Market
          Cap. Shares outstanding is not automatically the share count used for EPS,
          and it is not fixed throughout the year.
        </p>
      </section>

      <EpsEvidenceInspector basis={basis} response={response} />

      <form className={styles.completion} onSubmit={submit}>
        <fieldset disabled={submitted}>
          <legend>Which share count belongs in an annual EPS denominator?</legend>
          <p>Choose one, then submit. Participation—not correctness—records completion.</p>
          <label>
            <input checked={answer === "period"} name="eps-denominator" onChange={() => setAnswer("period")} type="radio" />
            <span>Weighted-average shares across the reporting period</span>
          </label>
          <label>
            <input checked={answer === "instant"} name="eps-denominator" onChange={() => setAnswer("instant")} type="radio" />
            <span>Point-in-time shares outstanding on one date</span>
          </label>
        </fieldset>
        <button disabled={!answer || submitted} type="submit">
          {submitted ? "Lesson explored" : "Submit understanding"}
        </button>
        {submitted ? (
          <p className={styles.feedback} role="status">
            {answer === "period"
              ? "That is the accounting denominator: weighted-average shares for the period."
              : "Keep the dates visible: an instant share count supports Market Cap, not annual EPS."}
          </p>
        ) : null}
      </form>
    </article>
  );
}
