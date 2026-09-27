"use client";

import Link from "next/link";
import { useState } from "react";

import { BusinessModelEvidence } from "@/components/business-model-evidence";
import { EpsEvidenceInspector } from "@/components/eps-evidence-inspector";
import { EvidenceInspector } from "@/components/evidence-inspector";
import { useLearningProgress } from "@/components/learning-progress-provider";
import { SharesOutstandingEvidenceInspector } from "@/components/shares-outstanding-evidence-inspector";
import type { CapstoneData } from "@/lib/capstone-data";
import type { DerivedEvidence, ReportedEvidence } from "@/lib/evidence";

import styles from "./capstone-learning.module.css";

type ClaimCategory = "supported" | "needs-more" | "not-assessed";

const categories: Array<{ id: ClaimCategory; label: string }> = [
  { id: "supported", label: "Supported by reviewed evidence" },
  { id: "needs-more", label: "Needs more evidence" },
  { id: "not-assessed", label: "Not assessed here" },
];

const claims = [
  {
    id: "positive-ocf",
    text: "Apple reported positive Operating Cash Flow in FY2025.",
    answer: "supported" as const,
    feedback:
      "Supported. Apple reported the Operating Cash Flow figure for this reviewed year.",
  },
  {
    id: "borrowings-verdict",
    text: "Apple's borrowings prove the company is financially weak.",
    answer: "needs-more" as const,
    feedback:
      "Needs more evidence. The amount is visible, but a strength or weakness conclusion needs maturity, interest-burden and liquidity context.",
  },
  {
    id: "cheap-stock",
    text: "Apple is cheap at its current market price.",
    answer: "not-assessed" as const,
    feedback:
      "Not assessed here. This Capstone has no approved, verified current market-price evidence.",
  },
];

const billions = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const shares = new Intl.NumberFormat("en-US");

function formatBillions(value: number): string {
  return `${billions.format(value / 1_000_000_000)}B`;
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function evidenceBillions(evidence: ReportedEvidence | DerivedEvidence): string {
  return evidence.kind === "reported"
    ? `$${evidence.finPathDisplay.value.toFixed(3)}B`
    : `$${evidence.calculation.displayedResult.toFixed(3)}B`;
}

function Snapshot({
  kind,
  label,
  value,
}: {
  kind: "Reported" | "FinPath-derived";
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
      <small className={styles.evidenceKind}>{kind}</small>
    </div>
  );
}

function ContinueButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button className={styles.continueButton} onClick={onClick} type="button">
      {children} <span aria-hidden="true">→</span>
    </button>
  );
}

export function CapstoneLearning({ data }: { data: CapstoneData }) {
  const { markExplored } = useLearningProgress();
  const [visibleStage, setVisibleStage] = useState(1);
  const [answers, setAnswers] = useState<Partial<Record<string, ClaimCategory>>>({});
  const [isFinished, setIsFinished] = useState(false);
  const reveal = (stage: number) =>
    setVisibleStage((current) => Math.max(current, stage));
  const allClaimsAnswered = claims.every((claim) => Boolean(answers[claim.id]));
  const businessEvidenceIds = [
    ...new Set([
      ...data.business.profile.offerings.flatMap((item) => item.evidenceIds),
      ...data.business.profile.moneyPaths.slice(0, 2).flatMap((item) => item.evidenceIds),
    ]),
  ];

  return (
    <article className={styles.lesson} aria-labelledby="capstone-question">
      <header className={styles.hero}>
        <p className="eyebrow">Reviewed Capstone example</p>
        <h2 id="capstone-question">
          You have learned the pieces. What can the evidence actually support
          when you put them together?
        </h2>
        <p>
          FinPath&apos;s V1 Capstone uses Apple because it is currently the reviewed
          company with the complete evidence chain required for this synthesis.
        </p>
        <p>
          The learning path taught the tools one by one. In a real analysis, you
          reorganize those tools around the questions you are trying to answer.
        </p>
        <p className={styles.filingLine}>
          {data.company.name} · FY{data.filing.fiscalYear} · Form {data.filing.form} · filed {formatDate(data.filing.filedAt)}
        </p>
        <div className={styles.pathOrder} aria-label="Capstone analysis order">
          {["Business", "Performance", "Cash generation", "Financial position", "Per-share", "Valuation evidence", "Synthesis"].map((label, index) => (
            <span key={label}>
              {label}{index < 6 ? <b aria-hidden="true">→</b> : null}
            </span>
          ))}
        </div>
      </header>

      <p className="sr-only" aria-live="polite">
        {visibleStage} of 7 Capstone stages visible.
      </p>

      <ol className={styles.stages} aria-label="Company Analysis Capstone stages">
        <li className={styles.stage} data-current={visibleStage === 1}>
          <p className={styles.stageNumber}>01 · Start with the business</p>
          <h3>Before interpreting the numbers, understand what produces them.</h3>
          <p className={styles.stageIntro}>{data.business.profile.summary}</p>
          <div className={styles.businessGrid}>
            {data.business.profile.offerings.slice(0, 2).map((offering) => (
              <article key={offering.id}>
                <p className={styles.evidenceKind}>Narrative evidence</p>
                <h4>{offering.title}</h4>
                <p>{offering.description}</p>
              </article>
            ))}
          </div>
          <div className={styles.businessGrid}>
            {data.business.profile.moneyPaths.slice(0, 2).map((path) => (
              <article key={path.id}>
                <h4>{path.payer}</h4>
                <p>{path.receives}</p>
                <p><strong>{path.mechanism}</strong></p>
              </article>
            ))}
          </div>
          <p className={styles.trace}>Numbers have more meaning when you know the operating business behind them.</p>
          <BusinessModelEvidence evidenceIds={businessEvidenceIds} profile={data.business.profile} />
          <ContinueButton onClick={() => reveal(2)}>Now inspect what the business reported</ContinueButton>
        </li>

        {visibleStage >= 2 ? (
          <li className={styles.stage} data-current={visibleStage === 2}>
            <p className={styles.stageNumber}>02 · Performance</p>
            <h3>What did the business report during the year?</h3>
            <dl className={styles.snapshotGrid}>
              <Snapshot kind="Reported" label="Revenue" value={formatBillions(data.performance.revenue.reportedFact.value)} />
              <Snapshot kind="Reported" label="Net Income" value={formatBillions(data.performance.netIncome.reportedFact.value)} />
              <Snapshot kind="FinPath-derived" label="Net Profit Margin" value={`${data.performance.netProfitMargin.calculation.displayedResult.toFixed(1)}%`} />
              {data.performance.revenueGrowth ? (
                <Snapshot kind="FinPath-derived" label="Revenue Growth" value={`${data.performance.revenueGrowth.calculation.displayedResult >= 0 ? "+" : ""}${data.performance.revenueGrowth.calculation.displayedResult.toFixed(1)}%`} />
              ) : null}
            </dl>
            <p className={styles.trace}>Revenue shows sales scale. Net Income is the accounting result after costs and expenses. Margin relates those two figures without judging whether the result is good or bad.</p>
            <details className={styles.evidenceGroup}>
              <summary>Inspect performance evidence</summary>
              <div>
                <EvidenceInspector evidence={data.performance.revenue} id="capstone-revenue-evidence" />
                <EvidenceInspector evidence={data.performance.netIncome} id="capstone-net-income-evidence" />
                <EvidenceInspector evidence={data.performance.netProfitMargin} id="capstone-margin-evidence" />
                {data.performance.revenueGrowth ? <EvidenceInspector evidence={data.performance.revenueGrowth} id="capstone-growth-evidence" /> : null}
              </div>
            </details>
            <ContinueButton onClick={() => reveal(3)}>Connect Profit to cash generation</ContinueButton>
          </li>
        ) : null}

        {visibleStage >= 3 ? (
          <li className={styles.stage} data-current={visibleStage === 3}>
            <p className={styles.stageNumber}>03 · Cash generation</p>
            <h3>Did accounting Profit translate into cash generated by operations?</h3>
            <div className={styles.equation} aria-label="Net Income to Operating Cash Flow">
              <strong>Net Income {formatBillions(data.performance.netIncome.reportedFact.value)}</strong>
              <b aria-hidden="true">→</b>
              <strong>Operating Cash Flow {formatBillions(data.cash.operatingCashFlow.reportedFact.value)}</strong>
            </div>
            <div className={styles.equation} aria-label="Simple Free Cash Flow calculation">
              <strong>OCF {formatBillions(data.cash.freeCashFlow.inputs[0].reportedFact.value)}</strong>
              <b aria-hidden="true">−</b>
              <strong>PP&amp;E purchases {formatBillions(Math.abs(data.cash.freeCashFlow.inputs[1].reportedFact.value))}</strong>
              <b aria-hidden="true">=</b>
              <strong>simple FCF ${data.cash.freeCashFlow.calculation.displayedResult.toFixed(3)}B</strong>
            </div>
            <p className={styles.trace}>Apple reported positive Operating Cash Flow in FY2025. FinPath&apos;s defined simple FCF calculation is also positive. Net Income is not cash, and simple FCF is not an Apple-reported GAAP line.</p>
            <details className={styles.evidenceGroup}>
              <summary>Inspect cash evidence</summary>
              <div>
                <EvidenceInspector evidence={data.cash.operatingCashFlow} id="capstone-ocf-evidence" />
                <EvidenceInspector evidence={data.cash.freeCashFlow} id="capstone-fcf-evidence" />
              </div>
            </details>
            <ContinueButton onClick={() => reveal(4)}>Inspect the reporting-date position</ContinueButton>
          </li>
        ) : null}

        {visibleStage >= 4 ? (
          <li className={styles.stage} data-current={visibleStage === 4}>
            <p className={styles.stageNumber}>04 · Financial position</p>
            <h3>Where did the company stand at the reporting date?</h3>
            <dl className={styles.snapshotGrid}>
              <Snapshot kind="Reported" label="Assets" value={formatBillions(data.financialPosition.assets.reportedFact.value)} />
              <Snapshot kind={data.financialPosition.liabilities.kind === "reported" ? "Reported" : "FinPath-derived"} label="Liabilities" value={evidenceBillions(data.financialPosition.liabilities)} />
              <Snapshot kind="Reported" label="Equity" value={formatBillions(data.financialPosition.equity.reportedFact.value)} />
              <Snapshot kind="Reported" label="Cash" value={formatBillions(data.financialPosition.cash.reportedFact.value)} />
              <Snapshot kind="FinPath-derived" label="Simple borrowings" value={`$${data.financialPosition.simpleBorrowings.calculation.displayedResult.toFixed(3)}B`} />
            </dl>
            <p className={styles.trace}>Cash is not all financial resources. Borrowings are not Total Liabilities. These figures do not by themselves establish whether the capital structure is safe, risky, good or bad.</p>
            <details className={styles.evidenceGroup}>
              <summary>Inspect financial-position evidence</summary>
              <div>
                <EvidenceInspector evidence={data.financialPosition.assets} id="capstone-assets-evidence" />
                <EvidenceInspector evidence={data.financialPosition.liabilities} id="capstone-liabilities-evidence" />
                <EvidenceInspector evidence={data.financialPosition.equity} id="capstone-equity-evidence" />
                <EvidenceInspector evidence={data.financialPosition.cash} id="capstone-cash-evidence" />
                <EvidenceInspector evidence={data.financialPosition.simpleBorrowings} id="capstone-borrowings-evidence" />
              </div>
            </details>
            <ContinueButton onClick={() => reveal(5)}>Add the per-share view</ContinueButton>
          </li>
        ) : null}

        {visibleStage >= 5 ? (
          <li className={styles.stage} data-current={visibleStage === 5}>
            <p className={styles.stageNumber}>05 · Per-share view</p>
            <h3>How does company-level performance connect to one share?</h3>
            <dl className={styles.snapshotGrid}>
              <Snapshot kind="Reported" label="Diluted EPS" value={`$${data.perShare.dilutedEps.value}`} />
              <Snapshot kind="Reported" label="Shares outstanding" value={shares.format(data.perShare.sharesOutstanding.value)} />
            </dl>
            <p className={styles.trace}>Diluted EPS uses a weighted-average share count over the reporting period. Shares Outstanding is a point-in-time count as of {formatDate(data.perShare.sharesOutstanding.asOfDate)}. They answer different questions.</p>
            <details className={styles.evidenceGroup}>
              <summary>Inspect per-share evidence</summary>
              <div>
                <EpsEvidenceInspector basis="diluted" response={data.perShare.dilutedEps.response} />
                <SharesOutstandingEvidenceInspector response={data.perShare.sharesOutstanding.response} />
              </div>
            </details>
            <ContinueButton onClick={() => reveal(6)}>Mark the evidence boundary</ContinueButton>
          </li>
        ) : null}

        {visibleStage >= 6 ? (
          <li className={styles.stage} data-current={visibleStage === 6}>
            <p className={styles.stageNumber}>06 · What is still unknown?</p>
            <h3>The strength of the conclusion should not exceed the strength of the evidence.</h3>
            <div className={styles.boundaryGrid}>
              <section>
                <h4>Reviewed evidence can tell us</h4>
                <ul><li>What the business does.</li><li>What Revenue and Profit it reported.</li><li>How cash moved and where Cash stood.</li><li>Its reported Diluted EPS.</li></ul>
              </section>
              <section>
                <h4>More evidence would be required</h4>
                <ul><li>Future growth and margin sustainability.</li><li>Competitive changes.</li><li>Debt maturities, interest burden and liquidity in depth.</li><li>Current market valuation.</li></ul>
              </section>
              <section>
                <h4>FinPath cannot conclude here</h4>
                <ul><li>Whether the shares should be bought or sold.</li><li>Whether they are currently cheap or expensive.</li><li>Whether future performance will improve or deteriorate.</li></ul>
              </section>
            </div>
            <div className={styles.valuation}>
              <p className={styles.evidenceKind}>Not assessed / unknown</p>
              <strong>{data.valuation.status}</strong>
              <span>{data.valuation.reason}</span>
            </div>
            <div className={styles.reviewLinks}>
              <Link href="/learn/company-analysis/market-cap">Review Market Cap concept →</Link>
              <Link href="/learn/company-analysis/pe-ratio">Review P/E Ratio concept →</Link>
            </div>
            <ContinueButton onClick={() => reveal(7)}>Build an evidence-backed analysis</ContinueButton>
          </li>
        ) : null}

        {visibleStage >= 7 ? (
          <li className={styles.stage} data-current>
            <p className={styles.stageNumber}>07 · Synthesis</p>
            <h3>Classify each claim before you finish the Analysis Note.</h3>
            <p className={styles.stageIntro}>This is synthesis practice, not a score. Choose the evidence status that best fits each claim.</p>
            <ul className={styles.claimList}>
              {claims.map((claim) => {
                const selected = answers[claim.id];
                return (
                  <li key={claim.id}>
                    <p>{claim.text}</p>
                    <div className={styles.claimChoices}>
                      {categories.map((category) => (
                        <button
                          aria-pressed={selected === category.id}
                          key={category.id}
                          onClick={() => setAnswers((current) => ({ ...current, [claim.id]: category.id }))}
                          type="button"
                        >
                          {category.label}
                        </button>
                      ))}
                    </div>
                    {selected ? (
                      <p className={styles.feedback} role="status">
                        {selected === claim.answer ? claim.feedback : `Look again. ${claim.feedback}`}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            {allClaimsAnswered ? (
              <section className={styles.analysisNote} aria-labelledby="analysis-note-heading">
                <p className="eyebrow">Deterministic synthesis from validated evidence</p>
                <h4 id="analysis-note-heading">Analysis Note</h4>
                <div className={styles.noteGrid}>
                  <section><h4>What the reviewed evidence supports</h4><ul>{data.analysisNote.supported.map((item) => <li key={item}>{item}</li>)}</ul></section>
                  <section><h4>Questions worth investigating next</h4><ul>{data.analysisNote.investigateNext.map((item) => <li key={item}>{item}</li>)}</ul></section>
                  <section><h4>What remains unknown</h4><ul>{data.analysisNote.unknown.map((item) => <li key={item}>{item}</li>)}</ul></section>
                </div>
              </section>
            ) : null}

            <details className={styles.sourceStatus}>
              <summary>Source status and filing provenance</summary>
              <div>
                <dl>
                  {data.dataStatuses.map((item) => (
                    <div key={item.source}>
                      <dt>{item.source}</dt>
                      <dd>{item.state} · retrieved {new Date(item.retrievedAt).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}</dd>
                    </div>
                  ))}
                  <div><dt>Filing</dt><dd>FY{data.filing.fiscalYear} · {data.filing.form} · accession {data.filing.accession}</dd></div>
                </dl>
                <a href={data.filing.sourceUrl} rel="noreferrer" target="_blank">Open SEC filing index ↗</a>
              </div>
            </details>

            <button
              className={styles.finishButton}
              disabled={!allClaimsAnswered}
              onClick={() => {
                markExplored(["capstone"]);
                setIsFinished(true);
              }}
              type="button"
            >
              Finish Capstone
            </button>

            {isFinished ? (
              <div className={styles.completion} role="status">
                <p><strong>Company Analysis Basics complete.</strong></p>
                <p>You assembled an evidence-backed analysis without turning missing evidence into a verdict.</p>
                <Link href="/company/aapl">Explore Apple →</Link>
              </div>
            ) : null}
          </li>
        ) : null}
      </ol>
    </article>
  );
}
