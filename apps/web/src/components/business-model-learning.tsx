"use client";

import { useState, type FormEvent } from "react";

import { BusinessModelEvidence } from "@/components/business-model-evidence";
import { useLearningProgress } from "@/components/learning-progress-provider";
import {
  buildRevenueOriginTrace,
  type BusinessModelProfile,
} from "@/content/business-models";

import styles from "./business-model-learning.module.css";

type Props = { profile: BusinessModelProfile };
type MappingAnswer = "origin-sequence" | "reporting-sequence";

export function BusinessModelLearning({ profile }: Props) {
  const { markExplored } = useLearningProgress();
  const trace = buildRevenueOriginTrace(profile);
  const [selectedPathId, setSelectedPathId] = useState(trace.paths[0].id);
  const [mappingAnswer, setMappingAnswer] = useState<MappingAnswer | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const selectedPath =
    trace.paths.find((path) => path.id === selectedPathId) ?? trace.paths[0];

  function submitMapping(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mappingAnswer) return;
    markExplored(["business-model"]);
    setIsSubmitted(true);
  }

  return (
    <article className={styles.lesson} aria-labelledby="business-model-question">
      <header className={styles.hero}>
        <p className="eyebrow">Revenue Origin Trace</p>
        <h2 id="business-model-question">
          How does this company turn what it offers into Revenue?
        </h2>
        <p>{profile.summary}</p>
        <p className={styles.sourceBoundary}>
          Reviewed SEC narrative · FinPath paraphrase
        </p>
        <p className={styles.filingLine}>
          {profile.company.name} · FY{profile.filing.fiscalYear} · Form {profile.filing.form} · {profile.filing.primarySection}
        </p>
      </header>

      <section className={styles.originWorkspace} aria-labelledby="origin-trace-heading">
        <div className={styles.tracePanel}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>All reviewed Revenue paths</p>
              <h3 id="origin-trace-heading">Follow each exchange to Revenue.</h3>
            </div>
            <p>
              Equal visual weight means no contribution percentages were reviewed.
              The paths are relationships, not a size comparison.
            </p>
          </div>

          <div className={styles.traceLabels} aria-hidden="true">
            <span>What is offered</span>
            <span>Who receives / pays</span>
            <span>What exchange occurs</span>
            <span>Result</span>
          </div>

          <div className={styles.paths}>
            {trace.paths.map((path) => (
              <button
                aria-pressed={selectedPath.id === path.id}
                className={styles.path}
                key={path.id}
                onClick={() => setSelectedPathId(path.id)}
                type="button"
              >
                <span><small>Offering</small><strong>{path.offering}</strong></span>
                <b aria-hidden="true">→</b>
                <span><small>Counterparty</small><strong>{path.counterparty}</strong></span>
                <b aria-hidden="true">→</b>
                <span><small>Exchange</small><strong>{path.exchange}</strong></span>
                <b aria-hidden="true">→</b>
                <span className={styles.revenue}><small>Result</small><strong>Revenue</strong></span>
              </button>
            ))}
          </div>
        </div>

        <aside className={styles.evidenceRail} aria-label="Selected Revenue path evidence">
          <p className={styles.kicker}>Selected path</p>
          <h3>{selectedPath.offering}</h3>
          <dl>
            <div><dt>Counterparty</dt><dd>{selectedPath.counterparty}</dd></div>
            <div><dt>Exchange</dt><dd>{selectedPath.exchange}</dd></div>
            <div><dt>Destination</dt><dd>Revenue</dd></div>
            <div><dt>Contribution size</dt><dd>Unknown · not reviewed</dd></div>
          </dl>
          <BusinessModelEvidence
            evidenceIds={selectedPath.evidenceIds}
            profile={profile}
          />
        </aside>
      </section>

      <section className={styles.structure} aria-labelledby="reporting-structure-heading">
        <div>
          <p className={styles.kicker}>Reporting structure is separate</p>
          <h3 id="reporting-structure-heading">{profile.businessStructure.heading}</h3>
          <p>{profile.businessStructure.explanation}</p>
        </div>
        <div className={styles.structureGroups}>
          {profile.businessStructure.groups.map((group) => (
            <article key={group.id}>
              <h4>{group.title}</h4>
              <p>{group.description}</p>
            </article>
          ))}
        </div>
        <p className={styles.structureBoundary}>{profile.businessStructure.boundary}</p>
        <ul className={styles.distinctions}>
          <li><strong>Offering ≠ reportable segment.</strong> One segment can contain several offerings.</li>
          <li><strong>Customer / user ≠ payer in every case.</strong> A counterparty may pay while someone else uses the offering.</li>
          <li><strong>Distribution channel ≠ Revenue mechanism.</strong> How an offering reaches someone is separate from the exchange that produces Revenue.</li>
        </ul>
      </section>

      <section className={styles.checkSection} aria-labelledby="mapping-check-heading">
        <div>
          <p className={styles.kicker}>Low-pressure mapping check</p>
          <h3 id="mapping-check-heading">Which sequence traces Revenue to its origin?</h3>
          <p>Choose one and submit. This is practice, not a score.</p>
        </div>
        <form onSubmit={submitMapping}>
          <fieldset>
            <legend className="sr-only">Choose the Revenue origin sequence</legend>
            <label>
              <input
                checked={mappingAnswer === "origin-sequence"}
                name="revenue-origin-sequence"
                onChange={() => setMappingAnswer("origin-sequence")}
                required
                type="radio"
              />
              <span>Offering → counterparty receives value → exchange / payment → Revenue</span>
            </label>
            <label>
              <input
                checked={mappingAnswer === "reporting-sequence"}
                name="revenue-origin-sequence"
                onChange={() => setMappingAnswer("reporting-sequence")}
                type="radio"
              />
              <span>Reportable segment → share-price movement → Revenue</span>
            </label>
          </fieldset>
          <button className={styles.submitButton} type="submit">Submit mapping</button>
        </form>

        {isSubmitted ? (
          <div className={styles.feedback} role="status">
            <strong>Lesson explored.</strong>
            <p>
              {mappingAnswer === "origin-sequence"
                ? "That sequence follows the reviewed business relationship without inventing contribution size."
                : "A reportable segment and a market price are different concepts. Start with the offering, counterparty and exchange."}
            </p>
          </div>
        ) : null}
      </section>

      {profile.company.ticker !== "AAPL" ? (
        <aside className={styles.capstoneTransition} aria-label="Capstone company transition">
          <strong>You reviewed {profile.company.name} here.</strong>
          <p>
            The current Capstone uses Apple because Apple is the reviewed company
            with the complete financial evidence chain.
          </p>
        </aside>
      ) : null}

      <section className={styles.boundaries} aria-labelledby="business-boundaries-heading">
        <h3 id="business-boundaries-heading">What this trace does not establish</h3>
        <ul>{profile.boundaries.map((boundary) => <li key={boundary}>{boundary}</li>)}</ul>
      </section>
    </article>
  );
}
