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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function BalanceSheetLearning({ balanceSheet }: Props) {
  validateBalanceSheetForLesson(balanceSheet.statement, balanceSheet.company);
  const { markExplored } = useLearningProgress();
  const { company, statement, dataStatus } = balanceSheet;
  const evidence = buildBalanceSheetEvidence(balanceSheet);
  const [visibleStage, setVisibleStage] = useState(1);
  const [snapshotChoice, setSnapshotChoice] = useState<string | null>(null);
  const [snapshotReviewed, setSnapshotReviewed] = useState(false);
  const [cashChoice, setCashChoice] = useState<string | null>(null);
  const [cashReviewed, setCashReviewed] = useState(false);

  function checkSnapshot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!snapshotChoice) return;
    setSnapshotReviewed(true);
  }

  function checkCash(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cashChoice) return;
    setCashReviewed(true);
    markExplored(["balance-sheet"]);
  }

  const claimsTotal = statement.otherClaims.reduce((sum, line) => sum + line.value, 0);
  const claimsSide = statement.liabilities.value + claimsTotal + statement.equity.value;

  return (
    <section className="balance-lesson" aria-labelledby="balance-title">
      <header className="balance-lesson__header">
        <p className="eyebrow">Balance Sheet · point-in-time statement</p>
        <h2 id="balance-title">
          Revenue tells you what happened over a year. Where does the company stand on one date?
        </h2>
        <p>
          Read {company.name}&apos;s reviewed financial position as a snapshot at one
          reporting date, then test what the figures do—and do not—mean.
        </p>
        <p className="profit-lesson__period">
          FY{statement.fiscalYear} · {statement.currency} · as of {statement.asOfDate} ·{" "}
          <a href={statement.sourceUrl} rel="noreferrer" target="_blank">
            SEC {statement.form} ↗
          </a>
        </p>
      </header>

      <section className="balance-stage" data-balance-stage="snapshot">
        <p className="cash-section__number">01 · Snapshot, not flow</p>
        <div className="balance-time-contrast">
          <div><span>Revenue</span><strong>Over a fiscal year</strong></div>
          <div><span>Cash Flow</span><strong>Over a fiscal year</strong></div>
          <div className="balance-time-contrast__current"><span>Balance Sheet</span><strong>As of {formatDate(statement.asOfDate)}</strong></div>
        </div>
        <form onSubmit={checkSnapshot}>
          <fieldset>
            <legend>
              If {company.name} reports {formatBillions(statement.assets.value)} of Assets as of {formatDate(statement.asOfDate)}, does that mean it had exactly that amount every day during FY{statement.fiscalYear}?
            </legend>
            <div className="cash-choice-list balance-choice-list">
              {["Yes", "No"].map((answer) => (
                <label key={answer}>
                  <input
                    checked={snapshotChoice === answer}
                    name="snapshot-check"
                    onChange={() => { setSnapshotChoice(answer); setSnapshotReviewed(false); }}
                    type="radio"
                    value={answer}
                  />
                  <span>{answer}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <button disabled={!snapshotChoice} type="submit">Check my reasoning</button>
        </form>
        {snapshotReviewed ? (
          <div className="balance-feedback" role="status">
            <p>
              {snapshotChoice === "No"
                ? "Right. A Balance Sheet is a snapshot at the reporting date."
                : "Not quite. The figure describes the reporting date, not every day in the year."}
            </p>
            {visibleStage === 1 ? <button className="cash-continue" onClick={() => setVisibleStage(2)} type="button">Meet the three ideas</button> : null}
          </div>
        ) : null}
      </section>

      {visibleStage >= 2 ? (
        <section className="balance-stage" data-balance-stage="ideas">
          <p className="cash-section__number">02 · Three basic ideas</p>
          <dl className="balance-three-ideas">
            <div><dt>Assets</dt><dd>Resources controlled by the company that have economic value.</dd></div>
            <div><dt>Liabilities</dt><dd>Obligations the company owes.</dd></div>
            <div><dt>Shareholders&apos; Equity</dt><dd>The residual interest after liabilities and other applicable claims.</dd></div>
          </dl>
          {visibleStage === 2 ? <button className="cash-continue" onClick={() => setVisibleStage(3)} type="button">Balance the statement</button> : null}
        </section>
      ) : null}

      {visibleStage >= 3 ? (
        <section className="balance-stage" data-balance-stage="equation">
          <p className="cash-section__number">03 · Balance the statement</p>
          <div className="balance-equation" aria-label={`Assets ${formatBillions(statement.assets.value)} equals claims and equity ${formatBillions(claimsSide)}`}>
            <article>
              <span>{statement.assets.reportedLabel}</span>
              <strong>{formatBillions(statement.assets.value)}</strong>
              <small>Company reported</small>
            </article>
            <b aria-hidden="true">=</b>
            <div className="balance-equation__claims">
              <article>
                <span>{statement.liabilities.evidenceKind === "reported" ? statement.liabilities.reportedLabel : statement.liabilities.label}</span>
                <strong>{formatBillions(statement.liabilities.value)}</strong>
                <small>{statement.liabilities.evidenceKind === "reported" ? "Company reported" : "FinPath-derived from reported lines"}</small>
              </article>
              {statement.otherClaims.map((line) => (
                <article key={line.id}>
                  <span>{line.reportedLabel}</span>
                  <strong>{formatBillions(line.value)}</strong>
                  <small>Company reported separately</small>
                </article>
              ))}
              <article>
                <span>{statement.equity.reportedLabel}</span>
                <strong>{formatBillions(statement.equity.value)}</strong>
                <small>Company reported</small>
              </article>
            </div>
          </div>
          {statement.otherClaims.length ? (
            <p className="balance-claim-note">
              Some companies present certain claims separately from permanent shareholders&apos; equity.
              FinPath keeps redeemable noncontrolling interest visible rather than forcing it into another bucket.
            </p>
          ) : null}
          <aside className="cash-learning-trace balance-learning-trace" aria-label="Learning Trace">
            <p><span aria-hidden="true" /> Learning Trace</p>
            <h3>Assets equal the complete claims side at this reporting date.</h3>
            <p>FinPath validates the equation using exact stored USD values before displaying billions.</p>
          </aside>
          <div className="balance-evidence-list" aria-label="Balance Sheet evidence">
            <EvidenceInspector evidence={evidence.assets} id="balance-assets-evidence" />
            <EvidenceInspector evidence={evidence.liabilities} id="balance-liabilities-evidence" />
            {evidence.otherClaims.map((item) => <EvidenceInspector evidence={item} id={`balance-${item.metric.id}-evidence`} key={item.metric.id} />)}
            <EvidenceInspector evidence={evidence.equity} id="balance-equity-evidence" />
          </div>
          {visibleStage === 3 ? <button className="cash-continue" onClick={() => setVisibleStage(4)} type="button">Compare Assets with cash</button> : null}
        </section>
      ) : null}

      {visibleStage >= 4 ? (
        <section className="balance-stage" data-balance-stage="assets-not-cash">
          <p className="cash-section__number">04 · Assets are not cash</p>
          <div className="balance-assets-cash">
            <div><span>Total Assets</span><strong>{formatBillions(statement.assets.value)}</strong></div>
            <div><span>Cash and cash equivalents</span><strong>{formatBillions(statement.cashAndCashEquivalents.value)}</strong></div>
          </div>
          <p>
            Assets can also include receivables, investments, inventory, property and equipment,
            and other assets. Cash is only one asset category.
          </p>
          <EvidenceInspector evidence={evidence.cashAndCashEquivalents} id="balance-cash-evidence" />
          {visibleStage === 4 ? <button className="cash-continue" onClick={() => setVisibleStage(5)} type="button">Set the Equity boundary</button> : null}
        </section>
      ) : null}

      {visibleStage >= 5 ? (
        <section className="balance-stage" data-balance-stage="equity-boundary">
          <p className="cash-section__number">05 · What Equity is not</p>
          <p>Shareholders&apos; Equity is a residual accounting interest. It is not:</p>
          <ul className="balance-boundary-list">
            <li>ending cash;</li>
            <li>the company&apos;s market capitalization;</li>
            <li>money immediately distributable to shareholders.</li>
          </ul>
          {visibleStage === 5 ? <button className="cash-continue" onClick={() => setVisibleStage(6)} type="button">Use what you learned</button> : null}
        </section>
      ) : null}

      {visibleStage >= 6 ? (
        <section className="balance-stage balance-stage--question" data-balance-stage="understanding-check">
          <p className="cash-section__number">06 · One final check</p>
          <form onSubmit={checkCash}>
            <fieldset>
              <legend>
                If a company reports {formatBillions(statement.assets.value)} of Assets,
                does that mean it holds that amount in cash?
              </legend>
              <div className="cash-choice-list balance-choice-list">
                {["Yes", "No"].map((answer) => (
                  <label key={answer}>
                    <input
                      checked={cashChoice === answer}
                      name="cash-check"
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
            <div className="cash-completion" role="status">
              <p>
                {cashChoice === "No"
                  ? "Right. Cash is one Asset category; Total Assets includes other resources too."
                  : "Not quite. Total Assets includes cash and many other resources."}
              </p>
              <p><strong>Next:</strong> More company-analysis concepts are still being validated.</p>
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
