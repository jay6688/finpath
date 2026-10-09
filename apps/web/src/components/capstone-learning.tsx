"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { BusinessModelEvidence } from "@/components/business-model-evidence";
import { EpsEvidenceInspector } from "@/components/eps-evidence-inspector";
import { EvidenceInspector } from "@/components/evidence-inspector";
import { useLearningProgress } from "@/components/learning-progress-provider";
import { SharesOutstandingEvidenceInspector } from "@/components/shares-outstanding-evidence-inspector";
import type {
  CapstoneData,
  CapstoneEvidenceRecord,
} from "@/lib/capstone-data";
import {
  buildCapstoneDraftKey,
  buildLearnerAnalysisNote,
  clearCapstoneDraft,
  createEmptyCapstoneDraft,
  deriveScenarioValuation,
  readCapstoneDraft,
  validateCapstoneCompletion,
  writeCapstoneDraft,
  type CapstoneDraft,
  type JudgmentStance,
  type LearnerJudgment,
} from "@/lib/capstone-draft";

import styles from "./capstone-learning.module.css";

const provenanceLabels = {
  reported: "Reported",
  reviewed: "Reviewed",
  "finpath-derived": "FinPath-derived",
} as const;

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatScenarioMarketCap(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function EvidenceDetails({
  data,
  record,
}: {
  data: CapstoneData;
  record: CapstoneEvidenceRecord;
}) {
  const inspection = record.inspection;
  if (inspection.kind === "narrative") {
    return (
      <BusinessModelEvidence
        evidenceIds={inspection.evidenceIds}
        profile={data.business.profile}
      />
    );
  }
  if (inspection.kind === "eps") {
    return <EpsEvidenceInspector basis="diluted" response={inspection.response} />;
  }
  if (inspection.kind === "shares") {
    return <SharesOutstandingEvidenceInspector response={inspection.response} />;
  }
  return <EvidenceInspector evidence={inspection.evidence} id={`casebook-${record.id}`} />;
}

function currentQuestionJudgment(
  draft: CapstoneDraft,
  questionId: string,
): LearnerJudgment | undefined {
  return draft.judgments.find((item) => item.questionId === questionId);
}

export function CapstoneLearning({ data }: { data: CapstoneData }) {
  const { markExplored } = useLearningProgress();
  const draftKey = buildCapstoneDraftKey({
    company: data.company.slug,
    accession: data.filing.accession,
  });
  const [activeQuestionId, setActiveQuestionId] = useState(data.casebook[0].id);
  const [draft, setDraft] = useState(() =>
    createEmptyCapstoneDraft({
      company: data.company.slug,
      accession: data.filing.accession,
    }),
  );
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [draftStatus, setDraftStatus] = useState<
    "loading" | "empty" | "restored" | "session-only" | "saved"
  >("loading");
  const [canPersist, setCanPersist] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const restored = readCapstoneDraft(browserStorage(), draftKey);
    setDraft(restored.draft);
    setCanPersist(restored.persistence === "local-browser");
    setDraftStatus(
      restored.status === "restored"
        ? "restored"
        : restored.persistence === "session-only"
          ? "session-only"
          : "empty",
    );
    setDraftHydrated(true);
  }, [draftKey]);

  useEffect(() => {
    if (!draftHydrated || !canPersist) return;
    if (writeCapstoneDraft(browserStorage(), draftKey, draft)) {
      setDraftStatus("saved");
    } else {
      setCanPersist(false);
      setDraftStatus("session-only");
    }
  }, [canPersist, draft, draftHydrated, draftKey]);

  const activeQuestion =
    data.casebook.find((question) => question.id === activeQuestionId) ??
    data.casebook[0];
  const judgment = currentQuestionJudgment(draft, activeQuestion.id);
  const completion = validateCapstoneCompletion(draft);
  const note = buildLearnerAnalysisNote(draft, data.evidenceCatalog);
  const scenario = useMemo(() => {
    if (draft.valuation.state !== "scenario") return null;
    try {
      return deriveScenarioValuation({
        price: Number(draft.valuation.priceInput),
        sharesOutstanding: data.perShare.sharesOutstanding.value,
        dilutedEps: data.perShare.dilutedEps.value,
      });
    } catch {
      return null;
    }
  }, [data.perShare, draft.valuation]);

  function updateDraft(update: (current: CapstoneDraft) => CapstoneDraft) {
    setDraft((current) => ({ ...update(current), noteReviewed: false }));
    setIsSubmitted(false);
  }

  function toggleEvidence(record: CapstoneEvidenceRecord) {
    updateDraft((current) => {
      const selected = new Set(current.selectedEvidenceIds);
      selected.has(record.id) ? selected.delete(record.id) : selected.add(record.id);
      const selectedForQuestion = activeQuestion.evidence
        .map((item) => item.id)
        .filter((id) => selected.has(id));
      return {
        ...current,
        selectedEvidenceIds: [...selected],
        judgments: current.judgments.map((item) =>
          item.questionId === activeQuestion.id
            ? { ...item, evidenceIds: selectedForQuestion }
            : item,
        ),
      };
    });
  }

  function updateJudgment(update: Partial<LearnerJudgment>) {
    updateDraft((current) => {
      const existing = currentQuestionJudgment(current, activeQuestion.id);
      const selectedForQuestion = activeQuestion.evidence
        .map((item) => item.id)
        .filter((id) => current.selectedEvidenceIds.includes(id));
      const next: LearnerJudgment = {
        id: `judgment-${activeQuestion.id}`,
        questionId: activeQuestion.id,
        stance: "uncertain",
        interpretation: "",
        basis: "",
        evidenceIds: selectedForQuestion,
        ...existing,
        ...update,
      };
      return {
        ...current,
        judgments: [
          ...current.judgments.filter((item) => item.questionId !== activeQuestion.id),
          next,
        ],
      };
    });
  }

  function resetDraft() {
    const storageCleared = clearCapstoneDraft(browserStorage(), draftKey);
    setDraft(createEmptyCapstoneDraft({
      company: data.company.slug,
      accession: data.filing.accession,
    }));
    setCanPersist(storageCleared);
    setDraftStatus(storageCleared ? "empty" : "session-only");
    setIsSubmitted(false);
  }

  return (
    <article className={styles.lesson} aria-labelledby="capstone-question">
      <header className={styles.hero}>
        <p className="eyebrow">Evidence Casebook · Apple only</p>
        <h2 id="capstone-question">Build your own qualified Analysis Note.</h2>
        <p>
          Move from reviewed evidence, to connections, to your judgment, then
          state the limitation. FinPath structures the evidence; it does not rate
          the company or generate your conclusion.
        </p>
        <p>This is synthesis practice, not a score.</p>
        <p className={styles.filingLine}>
          {data.company.name} · FY{data.filing.fiscalYear} · Form {data.filing.form} · filed {formatDate(data.filing.filedAt)} · accession {data.filing.accession}
        </p>
        <div className={styles.grammar} aria-label="Capstone synthesis grammar">
          {[
            ["Evidence", "What do reviewed facts show?"],
            ["Connection", "How do the pieces relate?"],
            ["Learner judgment", "What might be strong, weak or uncertain?"],
            ["Limitation", "What remains unsupported?"],
          ].map(([label, description], index) => (
            <span key={label}>
              <small>{label}</small><strong>{description}</strong>
              {index < 3 ? <b aria-hidden="true">→</b> : null}
            </span>
          ))}
        </div>
      </header>

      <div className={styles.draftBar} role="status">
        <div>
          <strong>Versioned local draft</strong>
          <span>
            {draftStatus === "loading" && "Loading this browser's draft…"}
            {draftStatus === "restored" && "Draft restored from this browser."}
            {draftStatus === "saved" && "Draft saved in this browser."}
            {draftStatus === "empty" && "No saved draft yet."}
            {draftStatus === "session-only" && "Browser storage is unavailable or corrupt; this draft is session-only."}
          </span>
        </div>
        <button onClick={resetDraft} type="button">Clear local draft</button>
        <p>
          Stored only in this browser for Apple and this filing accession. It is
          separate from learning progress, is not sent to a server, and is not synced or used for telemetry.
        </p>
      </div>

      <nav className={styles.questionNav} aria-label="Casebook questions">
        {data.casebook.map((question) => (
          <button
            aria-current={activeQuestion.id === question.id ? "step" : undefined}
            key={question.id}
            onClick={() => setActiveQuestionId(question.id)}
            type="button"
          >
            <span>{String(question.number).padStart(2, "0")}</span>
            <strong>{question.question}</strong>
          </button>
        ))}
      </nav>

      <div className={styles.workspace}>
        <section className={styles.casebook} aria-labelledby={`question-${activeQuestion.id}`}>
          <header className={styles.questionHeader}>
            <p>Research question {activeQuestion.number} of {data.casebook.length}</p>
            <h3 id={`question-${activeQuestion.id}`}>{activeQuestion.question}</h3>
            <span>{activeQuestion.prompt}</span>
          </header>

          <div className={styles.evidenceList}>
            {activeQuestion.evidence.map((record) => {
              const selected = draft.selectedEvidenceIds.includes(record.id);
              return (
                <article className={styles.evidenceRecord} data-selected={selected} key={record.id}>
                  <label>
                    <input
                      checked={selected}
                      onChange={() => toggleEvidence(record)}
                      type="checkbox"
                    />
                    <span>
                      <small data-provenance={record.provenance}>{provenanceLabels[record.provenance]}</small>
                      <strong>{record.label}</strong>
                      <b>{record.displayValue}</b>
                      <em>{record.recordType}</em>
                    </span>
                  </label>
                  <details>
                    <summary>Inspect evidence</summary>
                    <EvidenceDetails data={data} record={record} />
                  </details>
                </article>
              );
            })}
          </div>

          {activeQuestion.id === "profit-to-cash" ? (
            <details className={styles.connections}>
              <summary>Inspect statement connections</summary>
              <ul>
                {data.connections.map((connection) => (
                  <li key={connection.id}>
                    <strong>{connection.label}</strong>
                    <span>{connection.boundary}</span>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          <section className={styles.unknowns} aria-labelledby={`unknowns-${activeQuestion.id}`}>
            <p data-provenance="unknown">Unknown / not assessed</p>
            <h4 id={`unknowns-${activeQuestion.id}`}>This evidence package does not establish:</h4>
            <ul>{activeQuestion.unknowns.map((item) => <li key={item.id}>{item.label}</li>)}</ul>
          </section>

          {activeQuestion.id === "per-share-valuation" ? (
            <fieldset className={styles.valuation}>
              <legend>Resolve the optional valuation scenario</legend>
              <p>Both choices are valid. A scenario is teaching normalization, not current market data.</p>
              <label>
                <input
                  checked={draft.valuation.state === "unassessed"}
                  name="valuation-resolution"
                  onChange={() => updateDraft((current) => ({ ...current, valuation: { state: "unassessed", priceInput: "" } }))}
                  type="radio"
                />
                Leave valuation intentionally unassessed
              </label>
              <label>
                <input
                  checked={draft.valuation.state === "scenario"}
                  name="valuation-resolution"
                  onChange={() => updateDraft((current) => ({ ...current, valuation: { state: "scenario", priceInput: "" } }))}
                  type="radio"
                />
                Enter a new educational price scenario
              </label>
              {draft.valuation.state === "scenario" ? (
                <div className={styles.priceScenario}>
                  <label htmlFor="capstone-price">Educational price per share</label>
                  <div><span>$</span><input
                    id="capstone-price"
                    inputMode="decimal"
                    min="0.01"
                    onChange={(event) => updateDraft((current) => ({
                      ...current,
                      valuation: { state: "scenario", priceInput: event.target.value },
                    }))}
                    step="0.01"
                    type="number"
                    value={draft.valuation.priceInput}
                  /></div>
                  {scenario ? (
                    <dl>
                      <div><dt>Price</dt><dd>${scenario.price.toFixed(2)} <small>Learner scenario</small></dd></div>
                      <div><dt>Shares</dt><dd>{data.casebook[4].evidence[1].displayValue} <small>Reported</small></dd></div>
                      <div><dt>Diluted EPS</dt><dd>${data.perShare.dilutedEps.value} <small>Reported</small></dd></div>
                      <div><dt>Hypothetical Market Cap</dt><dd>{formatScenarioMarketCap(scenario.marketCap)} <small>Scenario-derived</small></dd></div>
                      <div><dt>Hypothetical annual P/E</dt><dd>{scenario.annualPE.toFixed(2)}× <small>Scenario-derived</small></dd></div>
                    </dl>
                  ) : <p role="status">Enter a positive educational price to derive both scenario measures.</p>}
                  <strong>Scenario Record · not current market data</strong>
                </div>
              ) : null}
            </fieldset>
          ) : null}

          <fieldset className={styles.judgment}>
            <legend>Your judgment · not a reported fact or FinPath recommendation</legend>
            <p>Select evidence above, then record your interpretation. Strong or weak requires a stated basis; uncertain does not force a conclusion.</p>
            <div className={styles.stanceChoices}>
              {(["strong", "weak", "uncertain"] as JudgmentStance[]).map((stance) => (
                <label key={stance}>
                  <input
                    checked={judgment?.stance === stance}
                    name={`stance-${activeQuestion.id}`}
                    onChange={() => updateJudgment({ stance })}
                    type="radio"
                  />
                  {stance[0].toUpperCase() + stance.slice(1)}
                </label>
              ))}
            </div>
            <label htmlFor={`interpretation-${activeQuestion.id}`}>Your interpretation</label>
            <textarea
              id={`interpretation-${activeQuestion.id}`}
              onChange={(event) => updateJudgment({ interpretation: event.target.value })}
              placeholder="State only what you can support from the selected evidence."
              rows={3}
              value={judgment?.interpretation ?? ""}
            />
            <label htmlFor={`basis-${activeQuestion.id}`}>
              Judgment basis {judgment?.stance === "strong" || judgment?.stance === "weak" ? "(required)" : "(optional for uncertain)"}
            </label>
            <textarea
              id={`basis-${activeQuestion.id}`}
              onChange={(event) => updateJudgment({ basis: event.target.value })}
              placeholder="Prior-year comparison, relationship between reviewed metrics, or your stated criterion."
              rows={2}
              value={judgment?.basis ?? ""}
            />
            <p className={styles.citationStatus}>
              Judgment Citation · {judgment?.evidenceIds.length ?? 0} selected evidence record(s) linked
            </p>
          </fieldset>
        </section>

        <aside className={styles.note} aria-labelledby="analysis-note-heading">
          <p className={styles.noteOwner}>Learner-owned synthesis</p>
          <h3 id="analysis-note-heading">Analysis Note</h3>
          <p>Your choices populate this note. FinPath does not create a strength, weakness, score or recommendation for you.</p>

          <section>
            <h4>What appears strong</h4>
            {note.strong.length ? note.strong.map((item) => (
              <article key={item.id}>
                <strong>{item.interpretation}</strong>
                <span>Evidence cited: {item.citation.evidence.map((evidence) => evidence.label).join(", ")}</span>
                <span>Judgment basis: {item.basis}</span>
                <small>Learner judgment · Judgment Citation</small>
              </article>
            )) : <p>No learner judgment recorded.</p>}
          </section>

          <section>
            <h4>What appears weak</h4>
            {note.weak.length ? note.weak.map((item) => (
              <article key={item.id}>
                <strong>{item.interpretation}</strong>
                <span>Evidence cited: {item.citation.evidence.map((evidence) => evidence.label).join(", ")}</span>
                <span>Judgment basis: {item.basis}</span>
                <small>Learner judgment · Judgment Citation</small>
              </article>
            )) : <p>No supported weakness identified from this evidence package.</p>}
          </section>

          <section>
            <h4>What remains uncertain</h4>
            {note.uncertain.map((item) => (
              <article key={item.id}>
                <strong>{item.interpretation}</strong>
                <span>Evidence cited: {item.citation.evidence.map((evidence) => evidence.label).join(", ")}</span>
                <small>Learner judgment · Judgment Citation</small>
              </article>
            ))}
            <label htmlFor="capstone-uncertainty">Missing evidence and why it matters</label>
            <textarea
              id="capstone-uncertainty"
              onChange={(event) => updateDraft((current) => ({ ...current, uncertainty: event.target.value }))}
              placeholder="Name at least one unsupported area and why it limits your conclusion."
              rows={3}
              value={draft.uncertainty}
            />
            <small>Unknown · learner-stated limitation</small>
          </section>

          <section>
            <h4>Scenario assumptions</h4>
            {draft.valuation.state === "unassessed" ? <p>Valuation intentionally unassessed.</p> : null}
            {scenario ? (
              <p>
                Educational price ${scenario.price.toFixed(2)} · hypothetical Market Cap {formatScenarioMarketCap(scenario.marketCap)} · hypothetical annual P/E {scenario.annualPE.toFixed(2)}×
              </p>
            ) : null}
            {draft.valuation.state === "unresolved" ? <p>Valuation choice not resolved yet.</p> : null}
            <small>Learner scenario · not current market data</small>
          </section>

          <label className={styles.reviewCheck}>
            <input
              checked={draft.noteReviewed}
              onChange={(event) => setDraft((current) => ({ ...current, noteReviewed: event.target.checked }))}
              type="checkbox"
            />
            I reviewed this Analysis Note and its evidence links.
          </label>

          {!completion.complete ? (
            <div className={styles.missing} role="status">
              <strong>Before submission:</strong>
              <ul>{completion.missing.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          ) : null}

          <button
            className={styles.submitButton}
            disabled={!completion.complete || isSubmitted}
            onClick={() => {
              markExplored(["capstone"]);
              setIsSubmitted(true);
            }}
            type="button"
          >
            {isSubmitted ? "Analysis Note submitted" : "Submit Analysis Note"}
          </button>

          {isSubmitted ? (
            <div className={styles.completion} role="status">
              <strong>Company Analysis Basics complete.</strong>
              <p>Submission records participation, not correctness or an investment verdict.</p>
              <Link href="/company/aapl">Explore Apple →</Link>
            </div>
          ) : null}
        </aside>
      </div>

      <details className={styles.provenance}>
        <summary>Source status and filing provenance</summary>
        <dl>
          {data.dataStatuses.map((item) => (
            <div key={item.source}><dt>{item.source}</dt><dd>{item.state} · retrieved {new Date(item.retrievedAt).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}</dd></div>
          ))}
          <div><dt>Filing</dt><dd>FY{data.filing.fiscalYear} · {data.filing.form} · accession {data.filing.accession}</dd></div>
        </dl>
        <a href={data.filing.sourceUrl} rel="noreferrer" target="_blank">Open SEC filing index ↗</a>
      </details>
    </article>
  );
}
