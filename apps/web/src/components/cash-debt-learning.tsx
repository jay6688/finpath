"use client";

import { useState, type FormEvent } from "react";

import { EvidenceInspector } from "@/components/evidence-inspector";
import { useLearningProgress } from "@/components/learning-progress-provider";
import type { CompanyBalanceSheet } from "@/lib/api";
import {
  buildBalanceSheetEvidence,
  validateBalanceSheetForLesson,
} from "@/lib/balance-sheet-learning";

type Props = { balanceSheet: CompanyBalanceSheet };

const billions = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

function formatBillions(value: number): string {
  return `${billions.format(value / 1_000_000_000)}B`;
}

export function CashDebtLearning({ balanceSheet }: Props) {
  validateBalanceSheetForLesson(balanceSheet.statement, balanceSheet.company);
  const { markExplored } = useLearningProgress();
  const { company, statement, dataStatus } = balanceSheet;
  const evidence = buildBalanceSheetEvidence(balanceSheet);
  const [visibleStage, setVisibleStage] = useState(1);
  const [cashChoice, setCashChoice] = useState<string | null>(null);
  const [cashReviewed, setCashReviewed] = useState(false);
  const [liabilityChoice, setLiabilityChoice] = useState<string | null>(null);
  const [liabilityReviewed, setLiabilityReviewed] = useState(false);

  function checkCash(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cashChoice) return;
    setCashReviewed(true);
  }

  function checkLiabilities(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!liabilityChoice) return;
    setLiabilityReviewed(true);
    markExplored(["cash-and-debt"]);
  }

  return (
    <section className="cash-debt-lesson" aria-labelledby="cash-debt-title">
      <header className="cash-debt-lesson__header">
        <p className="eyebrow">Cash & Debt · one reporting date</p>
        <h2 id="cash-debt-title">Can a company have billions in cash and still owe money?</h2>
        <p>
          Use {company.name}&apos;s reviewed Balance Sheet facts to separate Cash,
          Borrowings and Total Liabilities.
        </p>
        <p className="profit-lesson__period">
          FY{statement.fiscalYear} · {statement.currency} · as of {statement.asOfDate} ·{" "}
          <a href={statement.sourceUrl} rel="noreferrer" target="_blank">
            SEC {statement.form} ↗
          </a>
        </p>
      </header>

      <section className="cash-debt-stage" data-cash-debt-stage="cash">
        <p className="cash-section__number">01 · Cash does not mean no debt</p>
        <div className="cash-debt-focus">
          <span>{statement.cashAndCashEquivalents.reportedLabel}</span>
          <strong>{formatBillions(statement.cashAndCashEquivalents.value)}</strong>
          <small>Company reported</small>
        </div>
        <form onSubmit={checkCash}>
          <fieldset>
            <legend>Does this Cash figure mean {company.name} has no debt?</legend>
            <div className="cash-choice-list balance-choice-list">
              {["Yes", "No"].map((answer) => (
                <label key={answer}>
                  <input
                    checked={cashChoice === answer}
                    name="cash-means-no-debt"
                    onChange={() => { setCashChoice(answer); setCashReviewed(false); }}
                    type="radio"
                    value={answer}
                  />
                  <span>{answer}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <button disabled={!cashChoice} type="submit">Check my reasoning</button>
        </form>
        {cashReviewed ? (
          <div className="balance-feedback" role="status">
            <p>
              {cashChoice === "No"
                ? `Right. ${company.name} can report Cash and Borrowings on the same date.`
                : `Not quite. A Cash balance does not erase ${company.name}'s reported borrowing lines.`}
            </p>
            {visibleStage === 1 ? (
              <button className="cash-continue" onClick={() => setVisibleStage(2)} type="button">
                Build the borrowing total
              </button>
            ) : null}
          </div>
        ) : null}
        <EvidenceInspector evidence={evidence.cashAndCashEquivalents} id="cash-debt-cash-evidence" />
      </section>

      {visibleStage >= 2 ? (
        <section className="cash-debt-stage" data-cash-debt-stage="borrowings">
          <p className="cash-section__number">02 · Build the borrowing total</p>
          <div className="cash-debt-equation">
            <div className="cash-debt-equation__inputs">
              {statement.simpleBorrowings.inputs.map((line, index) => (
                <div key={line.id}>
                  <span>{line.reportedLabel}</span>
                  <strong>{formatBillions(line.value)}</strong>
                  <small>{index === 0 ? "Company-reported components" : "Company reported"}</small>
                </div>
              ))}
            </div>
            <span className="cash-debt-equation__arrow" aria-hidden="true">↓</span>
            <div className="cash-debt-equation__result">
              <span>{statement.simpleBorrowings.label}</span>
              <strong>{formatBillions(statement.simpleBorrowings.value)}</strong>
              <small>FinPath-derived total</small>
            </div>
          </div>
          <p className="cash-debt-definition">{statement.simpleBorrowings.definition}</p>
          <EvidenceInspector evidence={evidence.simpleBorrowings} id="simple-borrowings-evidence" />
          {visibleStage === 2 ? (
            <button className="cash-continue" onClick={() => setVisibleStage(3)} type="button">
              Compare with Total Liabilities
            </button>
          ) : null}
        </section>
      ) : null}

      {visibleStage >= 3 ? (
        <section className="cash-debt-stage" data-cash-debt-stage="liabilities">
          <p className="cash-section__number">03 · Debt is not Total Liabilities</p>
          <div className="cash-debt-contrast">
            <div>
              <span>Total Liabilities</span>
              <strong>{formatBillions(statement.liabilities.value)}</strong>
              <small>{statement.liabilities.evidenceKind === "reported" ? "Company reported" : "FinPath-derived from reported lines"}</small>
            </div>
            <div>
              <span>FinPath simple borrowings</span>
              <strong>{formatBillions(statement.simpleBorrowings.value)}</strong>
              <small>Analytical grouping</small>
            </div>
          </div>
          <p>
            Liabilities can also include accounts payable, accrued obligations,
            deferred revenue, taxes, lease obligations and other liabilities.
            Those items are not automatically harmless; they are simply not the same category as this borrowing total.
          </p>
          <aside className="cash-learning-trace balance-learning-trace" aria-label="Learning Trace">
            <p><span aria-hidden="true" /> Learning Trace</p>
            <h3>Borrowings are part of Liabilities, not another name for all Liabilities.</h3>
            <p>This lesson excludes lease obligations from FinPath simple borrowings. Debt definitions can vary.</p>
          </aside>
          <EvidenceInspector evidence={evidence.liabilities} id="cash-debt-liabilities-evidence" />
          {visibleStage === 3 ? (
            <button className="cash-continue" onClick={() => setVisibleStage(4)} type="button">
              Look beyond Cash
            </button>
          ) : null}
        </section>
      ) : null}

      {visibleStage >= 4 ? (
        <section className="cash-debt-stage" data-cash-debt-stage="financial-assets">
          <p className="cash-section__number">04 · Cash is not the whole financial-resource picture</p>
          <p>
            Cash is one financial resource. Companies may also hold investments or other financial assets.
          </p>
          {statement.supplementalFinancialAssets.length > 0 ? (
            <div className="cash-debt-assets">
              {statement.supplementalFinancialAssets.map((line, index) => (
                <div key={line.id}>
                  <span>{line.reportedLabel}</span>
                  <strong>{formatBillions(line.value)}</strong>
                  <EvidenceInspector
                    evidence={evidence.supplementalFinancialAssets[index]}
                    id={`cash-debt-${line.id}-evidence`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="cash-debt-no-supplemental">
              FinPath does not add an investment line because this reviewed lesson profile has no supplemental financial-asset line selected for {company.name}.
            </p>
          )}
          <p className="cash-debt-boundary">
            FinPath does not combine these figures into a universal liquidity score or rank companies from them.
          </p>
          {visibleStage === 4 ? (
            <button className="cash-continue" onClick={() => setVisibleStage(5)} type="button">
              Use what you learned
            </button>
          ) : null}
        </section>
      ) : null}

      {visibleStage >= 5 ? (
        <section className="cash-debt-stage cash-debt-stage--question" data-cash-debt-stage="check">
          <p className="cash-section__number">05 · One final check</p>
          <form onSubmit={checkLiabilities}>
            <fieldset>
              <legend>Does Total Liabilities mean the same thing as Debt?</legend>
              <div className="cash-choice-list balance-choice-list">
                {["Yes", "No"].map((answer) => (
                  <label key={answer}>
                    <input
                      checked={liabilityChoice === answer}
                      name="liabilities-mean-debt"
                      onChange={() => { setLiabilityChoice(answer); setLiabilityReviewed(false); }}
                      type="radio"
                      value={answer}
                    />
                    <span>{answer}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <button disabled={!liabilityChoice} type="submit">Check my reasoning</button>
          </form>
          {liabilityReviewed ? (
            <div className="cash-completion" role="status">
              <p>
                {liabilityChoice === "No"
                  ? "Right. Borrowings are one part of the broader Liabilities picture."
                  : "Not quite. Total Liabilities includes Borrowings and other obligations."}
              </p>
              <p><strong>Next:</strong> Connect the Income Statement, Cash Flow Statement and Balance Sheet.</p>
            </div>
          ) : null}
        </section>
      ) : null}

      <p className="profit-retrieved-note">
        Retrieved {new Date(dataStatus.retrievedAt).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}
        {dataStatus.state === "stale" ? " · SEC was unavailable, so FinPath is showing the last known public filing data." : ""}
      </p>
    </section>
  );
}
