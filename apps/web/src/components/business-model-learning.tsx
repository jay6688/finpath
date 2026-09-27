"use client";

import { useState } from "react";

import { BusinessModelProfileStages } from "@/components/business-model-profile-stages";
import { useLearningProgress } from "@/components/learning-progress-provider";
import { businessModelTeachingReference } from "@/content/business-models/references";
import type { BusinessModelProfile } from "@/content/business-models/types";

import styles from "./business-model-learning.module.css";

type Props = { profile: BusinessModelProfile };

export function BusinessModelLearning({ profile }: Props) {
  const { markExplored } = useLearningProgress();
  const [visibleStage, setVisibleStage] = useState(1);
  const [sourceAnswer, setSourceAnswer] = useState<"item-1" | "price-chart" | null>(null);
  const [comparisonAnswer, setComparisonAnswer] = useState<"no" | "yes" | null>(null);

  const reveal = (stage: number) =>
    setVisibleStage((current) => Math.max(current, stage));

  return (
    <article className={styles.lesson} aria-labelledby="business-model-question">
      <header className={styles.hero}>
        <p className="eyebrow">From reported numbers to the operating business</p>
        <h2 id="business-model-question">
          Before you analyze the numbers, what does this company actually sell,
          who pays, and how does money reach the business?
        </h2>
        <p>{profile.summary}</p>
        <p className={styles.filingLine}>
          Reviewed example · {profile.company.name} · FY{profile.filing.fiscalYear} ·
          Form {profile.filing.form} · {profile.filing.primarySection}
        </p>
      </header>

      <p className="sr-only" aria-live="polite">
        {visibleStage} of 6 learning stages visible.
      </p>

      <ol className={styles.stages} aria-label="Business Model learning stages">
        <li className={styles.stage} data-current={visibleStage === 1}>
          <p className={styles.stageNumber}>01 · Numbers come from a business</p>
          <h3>Revenue does not appear by itself.</h3>
          <p className={styles.stageIntro}>
            A business first has to sell or provide something that customers,
            users or partners value. Revenue, Profit, Cash Flow, EPS, Market Cap
            and P/E each describe a different aspect of that operating business.
          </p>
          <div className={styles.conceptChain} aria-label="How prior concepts connect">
            {[
              "Business model",
              "Revenue",
              "Profit",
              "Cash Flow",
              "Financial position",
              "EPS",
              "Valuation concepts",
            ].map((concept, index) => (
              <span key={concept}>
                {concept}{index < 6 ? <b aria-hidden="true">→</b> : null}
              </span>
            ))}
          </div>
          <p className={styles.learningTrace}>
            <strong>Core question:</strong> What actually creates the Revenue we
            have been analyzing?
          </p>
          <details className={styles.teachingReference}>
            <summary>Why start with Item 1?</summary>
            <p>{businessModelTeachingReference.supports}</p>
            <a href={businessModelTeachingReference.url} rel="noreferrer" target="_blank">
              {businessModelTeachingReference.publisher} · {businessModelTeachingReference.title} ↗
            </a>
          </details>
          <button className={styles.continueButton} onClick={() => reveal(2)} type="button">
            See what {profile.company.name.replace(/ (Inc\.|Corporation)$/, "")} offers <span aria-hidden="true">→</span>
          </button>
        </li>

        <BusinessModelProfileStages
          profile={profile}
          reveal={reveal}
          visibleStage={visibleStage}
        />

        {visibleStage >= 6 ? (
          <li className={`${styles.stage} ${styles.finalStage}`} data-current>
            <p className={styles.stageNumber}>06 · Connect the business back to the numbers</p>
            <h3>The business model gives the numbers context, not a verdict.</h3>
            <p className={styles.stageIntro}>
              An activity may first affect Revenue, then flow through costs and
              Profit, cash movement, financial position, per-share results and
              valuation concepts. The path is not automatic or one-step.
            </p>

            <fieldset className={styles.check}>
              <legend>Where would you start in a 10-K to understand what the company does?</legend>
              <p>Choose one. This is practice, not a score.</p>
              <div>
                <button aria-pressed={sourceAnswer === "item-1"} onClick={() => setSourceAnswer("item-1")} type="button">Item 1 · Business</button>
                <button aria-pressed={sourceAnswer === "price-chart"} onClick={() => setSourceAnswer("price-chart")} type="button">A share-price chart</button>
              </div>
            </fieldset>
            {sourceAnswer ? (
              <p className={styles.feedback} role="status">
                {sourceAnswer === "item-1"
                  ? "Right. Item 1 is a primary starting point for what the company offers and how it operates."
                  : "A price chart shows market prices, not what the company offers or how it operates. Start with Item 1 · Business."}
              </p>
            ) : null}

            {sourceAnswer ? (
              <fieldset className={styles.check}>
                <legend>Do two companies with the same Revenue necessarily make money in the same way?</legend>
                <p>Use the money paths you just reviewed.</p>
                <div>
                  <button aria-pressed={comparisonAnswer === "no"} onClick={() => {
                    setComparisonAnswer("no");
                    markExplored(["business-model"]);
                  }} type="button">No</button>
                  <button aria-pressed={comparisonAnswer === "yes"} onClick={() => {
                    setComparisonAnswer("yes");
                    markExplored(["business-model"]);
                  }} type="button">Yes</button>
                </div>
              </fieldset>
            ) : null}
            {comparisonAnswer ? (
              <p className={styles.feedback} role="status">
                {comparisonAnswer === "no"
                  ? "Right. The same Revenue total can come from different products, services, customers and payment mechanisms."
                  : "Not necessarily. Revenue is a total; it does not reveal whether it came from product sales, subscriptions, usage, advertising, memberships or services."}
              </p>
            ) : null}

            <div className={styles.boundaries}>
              <h4>What this profile cannot prove</h4>
              <ul>{profile.boundaries.map((boundary) => <li key={boundary}>{boundary}</li>)}</ul>
            </div>
            {comparisonAnswer ? (
              <p className={styles.complete}>
                <strong>Lesson explored.</strong> Continue to the Capstone to put the reviewed evidence together.
              </p>
            ) : null}
          </li>
        ) : null}
      </ol>
    </article>
  );
}
