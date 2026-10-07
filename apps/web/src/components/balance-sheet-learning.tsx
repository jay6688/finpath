"use client";

import { useState, type CSSProperties, type FormEvent } from "react";

import { EvidenceInspector } from "@/components/evidence-inspector";
import { useLearningProgress } from "@/components/learning-progress-provider";
import type { CompanyBalanceSheet } from "@/lib/api";
import {
  buildBalanceSheetEvidence,
  type BalanceSheetPresentation,
} from "@/lib/balance-sheet-learning";
import type { DerivedEvidence, ReportedEvidence } from "@/lib/evidence";

import styles from "./balance-sheet-learning.module.css";

type Props = {
  balanceSheet: CompanyBalanceSheet;
  presentation: BalanceSheetPresentation;
};

type Anchor = {
  id: string;
  label: string;
  definition: string;
  amount: number;
  sharePercent: number;
  sourceStatus: "reported" | "finpath-derived";
  evidence: ReportedEvidence | DerivedEvidence;
};

const billions = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

function formatBillions(value: number): string {
  return `${billions.format(value / 1_000_000_000)}B`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function shareStyle(sharePercent: number): CSSProperties {
  return { "--balance-share": sharePercent } as CSSProperties;
}

export function BalanceSheetLearning({ balanceSheet, presentation }: Props) {
  const { markExplored } = useLearningProgress();
  const { company, statement, dataStatus } = balanceSheet;
  const evidence = buildBalanceSheetEvidence(balanceSheet);
  const [selectedAnchor, setSelectedAnchor] = useState<string | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [reviewedChoice, setReviewedChoice] = useState<string | null>(null);
  const liabilities = presentation.claims[0];
  const equity = presentation.claims.at(-1);

  if (!liabilities || !equity) return null;

  const anchors: Anchor[] = [
    {
      id: "assets",
      label: "Assets",
      definition: "Resources recognized on the Balance Sheet.",
      amount: presentation.assets.amount,
      sharePercent: presentation.assets.sharePercent,
      sourceStatus: presentation.assets.sourceStatus,
      evidence: evidence.assets,
    },
    {
      id: "liabilities",
      label: "Liabilities",
      definition: "Obligations recognized on the Balance Sheet.",
      amount: liabilities.amount,
      sharePercent: liabilities.sharePercent,
      sourceStatus: liabilities.sourceStatus,
      evidence: evidence.liabilities,
    },
    ...statement.otherClaims.map((line, index) => ({
      id: line.id,
      label: line.reportedLabel,
      definition: "A claim presented separately from liabilities and shareholders' equity.",
      amount: line.value,
      sharePercent: presentation.claims[index + 1].sharePercent,
      sourceStatus: "reported" as const,
      evidence: evidence.otherClaims[index],
    })),
    {
      id: "equity",
      label: "Equity",
      definition: "The residual accounting interest after liabilities and other claims.",
      amount: equity.amount,
      sharePercent: equity.sharePercent,
      sourceStatus: equity.sourceStatus,
      evidence: evidence.equity,
    },
  ];
  const selected = anchors.find((anchor) => anchor.id === selectedAnchor) ?? null;

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!choice) return;
    setReviewedChoice(choice);
    markExplored(["balance-sheet"]);
  }

  return (
    <section
      aria-labelledby="balance-title"
      className={styles.lesson}
      id="balance-sheet-lesson"
    >
      <header className={styles.introduction}>
        <p className="eyebrow">Balance Sheet · financial position frame</p>
        <h2 id="balance-title">
          What does a Balance Sheet tell us about the company at one point in time?
        </h2>
        <p>
          Read {company.name}&apos;s reviewed financial position at one reporting
          date, then inspect how the accounting equation fits together.
        </p>
        <p className={styles.period}>
          FY{statement.fiscalYear} · {statement.currency} · as of{" "}
          {statement.asOfDate} · filed {statement.filedAt} ·{" "}
          <a href={statement.sourceUrl} rel="noreferrer" target="_blank">
            SEC {statement.form} ↗
          </a>
        </p>
      </header>

      <section className={styles.timeFrame} aria-labelledby="statement-time-heading">
        <p className="eyebrow" id="statement-time-heading">Statement timing changes the question</p>
        <div>
          <article>
            <span>Income Statement</span>
            <strong>Activity for the year ended {statement.asOfDate}</strong>
          </article>
          <article>
            <span>Cash Flow Statement</span>
            <strong>Cash movement for the year ended {statement.asOfDate}</strong>
          </article>
          <article data-current="true">
            <span>Balance Sheet</span>
            <strong>Financial position as of {formatDate(statement.asOfDate)}</strong>
          </article>
        </div>
      </section>

      <figure className={styles.frame} aria-labelledby="balance-frame-heading">
        <figcaption>
          <p className="eyebrow">Balance equation · Assets are the 100% reference</p>
          <h3 id="balance-frame-heading">
            Assets equal liabilities, other claims if any, and equity.
          </h3>
          <p>
            {formatBillions(presentation.assets.amount)} Assets equals{" "}
            {formatBillions(presentation.claimsTotal)} on the claims and equity side.
          </p>
        </figcaption>

        <div className={styles.assetReference}>
          <div>
            <span>ASSETS · 100% REFERENCE</span>
            <strong>{formatBillions(presentation.assets.amount)}</strong>
          </div>
          <span className={styles.referenceBar} style={shareStyle(100)} />
        </div>

        <div className={styles.equals} aria-hidden="true">EQUALS</div>

        <div className={styles.composition} aria-label="Claims and equity composition">
          <div className={styles.compositionBar} aria-hidden="true">
            {presentation.claims.map((claim) => (
              <span
                data-claim={claim.id}
                key={claim.id}
                style={shareStyle(claim.sharePercent)}
              />
            ))}
          </div>
          <div className={styles.claimRows}>
            {anchors.slice(1).map((anchor) => (
              <div data-claim-row={anchor.id} key={anchor.id}>
                <span>{anchor.label}</span>
                <span>{anchor.sharePercent.toFixed(1)}% of Assets</span>
                <strong>{formatBillions(anchor.amount)}</strong>
              </div>
            ))}
          </div>
        </div>
      </figure>

      <section className={styles.inspection} aria-labelledby="balance-inspection-heading">
        <header>
          <p className="eyebrow">Inspect an equation anchor</p>
          <h3 id="balance-inspection-heading">The amount is only part of its meaning.</h3>
        </header>
        <div className={styles.anchorList}>
          {anchors.map((anchor) => (
            <button
              aria-pressed={selectedAnchor === anchor.id}
              key={anchor.id}
              onClick={() => setSelectedAnchor(anchor.id)}
              type="button"
            >
              <span>{anchor.label}</span>
              <strong>{formatBillions(anchor.amount)}</strong>
            </button>
          ))}
        </div>
        <div aria-live="polite" className={styles.inspector}>
          {selected ? (
            <>
              <p className="eyebrow">
                {selected.sourceStatus === "reported"
                  ? `${company.name} reported`
                  : "FinPath-derived from reported lines"}
              </p>
              <h4>{selected.label}</h4>
              <strong>{formatBillions(selected.amount)}</strong>
              <p>{selected.definition}</p>
              <p>
                Geometry: {selected.sharePercent.toFixed(1)}% of the exact Assets
                reference. Selecting this anchor does not change the scale.
              </p>
              <EvidenceInspector
                evidence={selected.evidence}
                id={`balance-${selected.id}-evidence`}
              />
            </>
          ) : (
            <>
              <p className="eyebrow">Meaning · source · scale</p>
              <h4>Choose Assets, Liabilities, or Equity.</h4>
              <p>
                The complete equation is already visible. Inspection adds explanation
                and source access; it does not unlock the lesson.
              </p>
            </>
          )}
        </div>
      </section>

      {statement.otherClaims.length ? (
        <p className={styles.claimNote}>
          {company.name} reports redeemable noncontrolling interest separately.
          FinPath keeps that reviewed claim separate rather than forcing it into
          Liabilities or permanent shareholders&apos; equity.
        </p>
      ) : null}

      <aside className={styles.boundaries} aria-labelledby="balance-boundaries">
        <p className="eyebrow" id="balance-boundaries">Accounting meaning, not a verdict</p>
        <p><strong>Assets are not cash.</strong> They include multiple recognized resource categories.</p>
        <p><strong>Liabilities are not automatically bad.</strong> The amount alone does not explain terms, timing, purpose, or risk.</p>
        <p><strong>Equity is not cash or market capitalization.</strong> It is the residual accounting interest shown here.</p>
      </aside>

      <section className={styles.application} aria-labelledby="balance-check">
        <p className="eyebrow">One statement-role check</p>
        <form onSubmit={review}>
          <fieldset>
            <legend id="balance-check">
              Which statement shows financial position at a specific reporting date?
            </legend>
            <p>Choose one. This is practice, not a score.</p>
            <div className={styles.choices}>
              {[
                ["balance-sheet", "Balance Sheet"],
                ["income-statement", "Income Statement"],
                ["cash-flow-statement", "Cash Flow Statement"],
              ].map(([id, label]) => (
                <label key={id}>
                  <input
                    checked={choice === id}
                    name="balance-sheet-role"
                    onChange={() => {
                      setChoice(id);
                      setReviewedChoice(null);
                    }}
                    type="radio"
                    value={id}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <button disabled={!choice} type="submit">Check my reasoning</button>
        </form>
        {reviewedChoice ? (
          <p aria-live="polite" className={styles.feedback} role="status">
            {reviewedChoice === "balance-sheet"
              ? "Yes. The Balance Sheet is the point-in-time statement."
              : "The Income Statement and Cash Flow Statement describe activity over a period; the Balance Sheet shows position as of a date."}
          </p>
        ) : null}
      </section>

      <p className={styles.retrievedNote}>
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
