"use client";

import { useState, type FormEvent } from "react";

import { EvidenceInspector } from "@/components/evidence-inspector";
import { useLearningProgress } from "@/components/learning-progress-provider";
import lessonContent from "@/content/cash-flow-lessons/aapl-free-cash-flow-fy2025.json";
import type { CompanyCashFlowStatement } from "@/lib/api";
import { cashFlowStatementLines, type SimpleFreeCashFlowDerivation } from "@/lib/cash-flow-learning";
import {
  buildFreeCashFlowEvidence,
  buildReviewedPresentation,
  type FinancialStatementLineId,
} from "@/lib/evidence";

type Props = {
  cashFlowStatement: CompanyCashFlowStatement;
  derivation: SimpleFreeCashFlowDerivation;
};

const reviewedLabels = Object.fromEntries(
  Object.entries(lessonContent.lines).map(([id, copy]) => [id, copy.reportedLabel]),
) as Partial<Record<FinancialStatementLineId, string>>;
const exactBillions = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 3, maximumFractionDigits: 3 });
const formatBillions = (value: number) => `${exactBillions.format(Math.abs(value) / 1_000_000_000)}B`;

export function FreeCashFlowLearning({ cashFlowStatement, derivation }: Props) {
  const { markExplored } = useLearningProgress();
  const { statement, dataStatus } = cashFlowStatement;
  const lines = new Map(cashFlowStatementLines(statement).map((line) => [line.id, line]));
  const operatingCash = lines.get("cash-generated-by-operating-activities");
  const ppAndE = lines.get("payments-for-property-plant-and-equipment");
  const [visibleSection, setVisibleSection] = useState(1);
  const [choice, setChoice] = useState<string | null>(null);
  const [reviewedChoice, setReviewedChoice] = useState<string | null>(null);

  if (!operatingCash || !ppAndE) return null;

  const presentationContent = {
    fiscalYear: lessonContent.fiscalYear,
    startDate: lessonContent.startDate,
    endDate: lessonContent.endDate,
    form: lessonContent.form as "10-K",
    filedAt: lessonContent.filedAt,
    accession: lessonContent.accession,
    statementName: lessonContent.verification.statementName,
    labels: reviewedLabels,
  };
  const evidence = buildFreeCashFlowEvidence({
    cashFlowStatement,
    derivation,
    reviewedOperatingCashFlow: buildReviewedPresentation({ statement, content: presentationContent, lineId: "cash-generated-by-operating-activities", contextLineIds: ["cash-generated-by-operating-activities"] }),
    reviewedPropertyPlantEquipment: buildReviewedPresentation({ statement, content: presentationContent, lineId: "payments-for-property-plant-and-equipment", contextLineIds: ["payments-for-property-plant-and-equipment"] }),
  });

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!choice) return;
    setReviewedChoice(choice);
    markExplored(["free-cash-flow"]);
  }

  return (
    <section className="cash-lesson cash-module fcf-lesson" aria-labelledby="fcf-title">
      <header className="cash-lesson__header">
        <p className="eyebrow">Free Cash Flow · one analytical convention</p>
        <h2 id="fcf-title">{lessonContent.title}</h2>
        <p>{lessonContent.introduction}</p>
        <p className="profit-lesson__period">FY{statement.fiscalYear} · {statement.currency} · year ended {statement.endDate} · <a href={statement.sourceUrl} rel="noreferrer" target="_blank">SEC {statement.form} ↗</a></p>
      </header>

      <section className="cash-section" data-fcf-section="reported-inputs">
        <p className="cash-section__number">01 · Operating cash is not the end</p>
        <div className="fcf-inputs">
          <article><span>Operating Cash Flow</span><strong>{formatBillions(operatingCash.value)}</strong><small>Apple reported · Operating activities</small></article>
          <article><span>PP&amp;E purchases</span><strong>({formatBillions(ppAndE.value)})</strong><small>Apple reported · Investing activities</small></article>
        </div>
        <p className="fcf-definition">{lessonContent.definition}</p>
        {visibleSection === 1 ? <button className="cash-continue" onClick={() => setVisibleSection(2)} type="button">Derive simple Free Cash Flow</button> : null}
      </section>

      {visibleSection >= 2 ? (
        <section className="cash-section" data-fcf-section="derivation">
          <p className="cash-section__number">02 · FinPath derives the measure</p>
          <div className="fcf-equation" aria-label={`Operating Cash Flow ${formatBillions(derivation.operatingCashFlow)} minus PP&E purchases ${formatBillions(derivation.propertyPlantEquipmentPurchases)} equals Free Cash Flow ${formatBillions(derivation.exactValue)}`}>
            <div><span>Operating Cash Flow</span><strong>{formatBillions(derivation.operatingCashFlow)}</strong></div>
            <span aria-hidden="true">−</span>
            <div><span>PP&amp;E purchases</span><strong>{formatBillions(derivation.propertyPlantEquipmentPurchases)}</strong></div>
            <span aria-hidden="true">=</span>
            <div className="fcf-equation__result"><span>FinPath simple Free Cash Flow</span><strong>{formatBillions(derivation.exactValue)}</strong></div>
          </div>
          <aside className="cash-learning-trace" aria-label="Learning Trace">
            <p><span aria-hidden="true" /> Learning Trace</p>
            <h3>Apple reported the two inputs. FinPath calculated the result.</h3>
            <p>This lesson uses Operating Cash Flow minus PP&amp;E purchases. Another analysis may define Free Cash Flow differently.</p>
          </aside>
          {visibleSection === 2 ? <button className="cash-continue" onClick={() => setVisibleSection(3)} type="button">Check reported vs derived</button> : null}
        </section>
      ) : null}

      {visibleSection >= 3 ? (
        <section className="cash-section cash-section--question" data-fcf-section="check">
          <p className="cash-section__number">03 · Check the evidence boundary</p>
          <form onSubmit={review}>
            <fieldset>
              <legend>{lessonContent.question.prompt}</legend>
              <p>{lessonContent.question.hint}</p>
              <div className="cash-choice-list">
                {lessonContent.question.choices.map((option) => (
                  <label key={option.id}><input checked={choice === option.id} name="reported-or-derived" onChange={() => { setChoice(option.id); setReviewedChoice(null); }} type="radio" value={option.id} /><span>{option.label}</span></label>
                ))}
              </div>
            </fieldset>
            <button disabled={!choice} type="submit">Check my reasoning</button>
          </form>
          {reviewedChoice ? (
            <div className="cash-completion" role="status">
              <p>{reviewedChoice === lessonContent.question.supportedChoiceId ? lessonContent.question.supportedFeedback : lessonContent.question.unsupportedFeedback}</p>
              <EvidenceInspector evidence={evidence} id="free-cash-flow-evidence" />
              <aside className="cash-limitation"><p className="eyebrow">What this does not mean</p><p>{lessonContent.limitation}</p></aside>
            </div>
          ) : null}
        </section>
      ) : null}

      <p className="profit-retrieved-note">Retrieved {new Date(dataStatus.retrievedAt).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}{dataStatus.state === "stale" ? " · SEC was unavailable, so FinPath is showing the last known public filing data." : ""}</p>
    </section>
  );
}
