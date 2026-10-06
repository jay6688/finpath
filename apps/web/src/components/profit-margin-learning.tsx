"use client";

import { useState, type FormEvent } from "react";

import { EvidenceInspector } from "@/components/evidence-inspector";
import { useLearningProgress } from "@/components/learning-progress-provider";
import { RevenueRuler } from "@/components/revenue-ruler";
import marginContent from "@/content/profit-margin-lessons/aapl-profit-margin-fy2025.json";
import profitContent from "@/content/profit-lessons/aapl-profit-fy2025.json";
import type { CompanyIncomeStatement, IncomeStatementLineId } from "@/lib/api";
import {
  buildNetProfitMarginEvidence,
  buildReviewedPresentation,
} from "@/lib/evidence";
import type {
  MarginPresentation,
  MarginSemanticAnchor,
  NetProfitMarginDerivation,
} from "@/lib/profit-margin";

import styles from "./profit-margin-learning.module.css";

type ProfitMarginLearningProps = {
  incomeStatement: CompanyIncomeStatement;
  derivation: NetProfitMarginDerivation;
  presentation: MarginPresentation;
};

const reviewedLabels = Object.fromEntries(
  Object.entries(profitContent.lines).map(([id, line]) => [id, line.reportedLabel]),
) as Partial<Record<IncomeStatementLineId, string>>;

const anchorCopy = marginContent.ruler.anchors as Record<
  MarginSemanticAnchor["id"],
  { label: string; meaning: string }
>;

export function ProfitMarginLearning({
  incomeStatement,
  derivation,
  presentation,
}: ProfitMarginLearningProps) {
  const { markExplored } = useLearningProgress();
  const { statement, dataStatus } = incomeStatement;
  const [selectedAnchorId, setSelectedAnchorId] =
    useState<MarginSemanticAnchor["id"]>(presentation.defaultAnchorId);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [reviewedChoice, setReviewedChoice] = useState<string | null>(null);
  const perHundredDisplay =
    presentation.normalizedPerHundred.displayAmount.toFixed(2);
  const outsideShareDisplay = (
    100 - presentation.normalizedPerHundred.displayAmount
  ).toFixed(2);
  const supportedAnswer =
    reviewedChoice === marginContent.question.supportedChoiceId;
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
      aria-labelledby="profit-margin-title"
      className={styles.lesson}
      id="profit-margin-lesson"
    >
      <header className={styles.introduction}>
        <p className="eyebrow">Net Profit Margin · whole-to-part ratio</p>
        <h2 id="profit-margin-title">{marginContent.title}</h2>
        <p>{marginContent.introduction}</p>
        <p className={styles.period}>
          FY{statement.fiscalYear} · {statement.currency} · year ended{" "}
          {statement.endDate} · filed {statement.filedAt} ·{" "}
          <a href={statement.sourceUrl} rel="noreferrer" target="_blank">
            SEC {statement.form} ↗
          </a>
        </p>
      </header>

      <RevenueRuler
        anchorCopy={anchorCopy}
        context={`Apple Inc. · FY${statement.fiscalYear} · USD`}
        normalizedLabel={marginContent.ruler.normalizedLabel}
        onSelect={setSelectedAnchorId}
        presentation={presentation}
        remainingBoundary={marginContent.ruler.remainingBoundary}
        selectedAnchorId={selectedAnchorId}
        title={marginContent.ruler.title}
      />

      <aside className={styles.boundaries} aria-labelledby="margin-boundaries-heading">
        <p className="eyebrow" id="margin-boundaries-heading">Read the ratio carefully</p>
        <p>{marginContent.misconceptionBoundary}</p>
        <p><strong>Keep the terms separate.</strong> {marginContent.terminology}</p>
      </aside>

      <section className={styles.application} aria-labelledby="margin-check-title">
        <form onSubmit={reviewUnderstanding}>
          <fieldset>
            <legend id="margin-check-title">{marginContent.question.prompt}</legend>
            <p>{marginContent.question.hint}</p>
            <div className={styles.choices}>
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
          <p aria-live="polite" className={styles.feedback} role="status">
            <strong>
              {supportedAnswer ? `About $${perHundredDisplay}. ` : "Not quite. "}
            </strong>
            {supportedAnswer
              ? marginContent.question.supportedFeedback
              : marginContent.question.unsupportedFeedback}
          </p>
        ) : null}
      </section>

      <EvidenceInspector evidence={marginEvidence} id="profit-margin-evidence" />

      <aside className={styles.limitation} aria-labelledby="margin-limitation-heading">
        <p className="eyebrow" id="margin-limitation-heading">What this cannot tell you</p>
        <p>{marginContent.limitation}</p>
      </aside>

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
