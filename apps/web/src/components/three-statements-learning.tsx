"use client";

import { useState, type FormEvent } from "react";

import { EvidenceInspector } from "@/components/evidence-inspector";
import { useLearningProgress } from "@/components/learning-progress-provider";
import type { ThreeStatementConnectionData } from "@/lib/three-statements";
import type { ReportedEvidence } from "@/lib/evidence";

type Props = { data: ThreeStatementConnectionData };

const billions = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

function formatBillions(value: number): string {
  return `${billions.format(Math.abs(value) / 1_000_000_000)}B`;
}

function formatSignedBillions(value: number): string {
  if (value === 0) return formatBillions(value);
  return `${value > 0 ? "+" : "−"}${formatBillions(value)}`;
}

function EvidenceItem({
  evidence,
  id,
  label,
}: {
  evidence: ReportedEvidence;
  id: string;
  label: string;
}) {
  return (
    <div className="three-evidence-item">
      <span>{label}</span>
      <EvidenceInspector evidence={evidence} id={id} />
    </div>
  );
}

export function ThreeStatementsLearning({ data }: Props) {
  const { markExplored } = useLearningProgress();
  const { company, filing, values, connections, evidence, dataStatuses } = data;
  const [visibleStage, setVisibleStage] = useState(1);
  const [profitChoice, setProfitChoice] = useState<string | null>(null);
  const [profitReviewed, setProfitReviewed] = useState(false);
  const [positionChoice, setPositionChoice] = useState<string | null>(null);
  const [positionReviewed, setPositionReviewed] = useState(false);
  const netIncomeConnection = connections.find(
    (connection) => connection.id === "net-income-bridge",
  );
  const endingCashConnection = connections.find(
    (connection) => connection.id === "ending-cash-bridge",
  );
  const latestRetrievedAt = dataStatuses
    .map((status) => Date.parse(status.retrievedAt))
    .filter(Number.isFinite)
    .reduce((latest, value) => Math.max(latest, value), 0);

  if (!netIncomeConnection || !endingCashConnection) return null;

  function reviewProfit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (profitChoice) setProfitReviewed(true);
  }

  function reviewPosition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (positionChoice) setPositionReviewed(true);
  }

  function completeLesson() {
    setVisibleStage(6);
    markExplored(["three-statements-connect"]);
  }

  return (
    <section className="three-statements-lesson" aria-labelledby="three-statements-title">
      <header className="three-statements-lesson__header">
        <p className="eyebrow">Three statements · one reviewed filing</p>
        <h2 id="three-statements-title">How do the three financial statements connect?</h2>
        <p>
          Follow two exact links in {company.name}&apos;s FY{filing.fiscalYear} filing:
          Net Income enters Apple&apos;s cash-flow reconciliation, and ending cash appears
          in the reporting-date Balance Sheet.
        </p>
        <p className="profit-lesson__period">
          {filing.startDate} to {filing.endDate} · USD
          {" · "}
          <a href={filing.sourceUrl} rel="noreferrer" target="_blank">
            SEC {filing.form} ↗
          </a>
        </p>
      </header>

      <p className="sr-only" aria-live="polite">
        {visibleStage} of 6 learning sections visible.
      </p>

      <section className="three-statements-stage" data-three-stage="questions">
        <p className="cash-section__number">01 · Three statements, three questions</p>
        <div className="three-statement-map three-statement-map--questions">
          <article>
            <span>Income Statement</span>
            <strong>What did Apple earn?</strong>
            <small>Duration · over FY{filing.fiscalYear}</small>
          </article>
          <span className="three-statement-map__connector" aria-hidden="true">→</span>
          <article>
            <span>Cash Flow Statement</span>
            <strong>How did cash move?</strong>
            <small>Duration · over FY{filing.fiscalYear}</small>
          </article>
          <span className="three-statement-map__connector" aria-hidden="true">→</span>
          <article>
            <span>Balance Sheet</span>
            <strong>Where did Apple stand?</strong>
            <small>Instant · as of {filing.asOfDate}</small>
          </article>
        </div>
        <p className="three-statements-boundary">
          The first two statements cover a period. The Balance Sheet is a snapshot on
          one date.
        </p>
        {visibleStage === 1 ? (
          <button className="cash-continue" onClick={() => setVisibleStage(2)} type="button">
            Connect Net Income
          </button>
        ) : null}
      </section>

      {visibleStage >= 2 ? (
        <section className="three-statements-stage" data-three-stage="net-income">
          <p className="cash-section__number">02 · Net Income crosses into cash flow</p>
          <div className="statement-bridge" aria-label="Net Income connection">
            <div>
              <span>Income Statement · Net Income</span>
              <strong>{formatBillions(values.netIncome)}</strong>
              <small>Apple reported · full-year result</small>
            </div>
            <div className="statement-bridge__match">
              <span aria-hidden="true">=</span>
              <strong>Exact match</strong>
            </div>
            <div>
              <span>Cash Flow Statement · Net Income</span>
              <strong>{formatBillions(values.netIncome)}</strong>
              <small>Apple reported · reconciliation starting line</small>
            </div>
          </div>
          <p>
            Apple&apos;s indirect-method operating cash-flow reconciliation starts from
            the same Net Income, then adjusts for non-cash items and timing differences.
          </p>
          <form onSubmit={reviewProfit}>
            <fieldset>
              <legend>
                Does {formatBillions(values.netIncome)} of Net Income mean exactly the
                same amount of operating cash?
              </legend>
              <div className="cash-choice-list balance-choice-list">
                {["Yes", "No"].map((answer) => (
                  <label key={answer}>
                    <input
                      checked={profitChoice === answer}
                      name="net-income-equals-operating-cash"
                      onChange={() => {
                        setProfitChoice(answer);
                        setProfitReviewed(false);
                      }}
                      type="radio"
                      value={answer}
                    />
                    <span>{answer}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <button disabled={!profitChoice} type="submit">Check my reasoning</button>
          </form>
          {profitReviewed ? (
            <div className="cash-feedback" role="status">
              <p>
                {profitChoice === "No"
                  ? `Right. Apple reported ${formatBillions(values.operatingCashFlow)} of operating cash after its reconciliation.`
                  : `Not quite. Net Income is an accounting result; Apple reported ${formatBillions(values.operatingCashFlow)} of operating cash after adjustments.`}
              </p>
              <div className="three-statements-focus-value">
                <span>Cash generated by operating activities</span>
                <strong>{formatBillions(values.operatingCashFlow)}</strong>
                <small>Apple reported · not the same measure as Net Income</small>
              </div>
              {visibleStage === 2 ? (
                <button onClick={() => setVisibleStage(3)} type="button">
                  Follow the cash movement
                </button>
              ) : null}
            </div>
          ) : null}
          <div className="three-evidence-pair">
            <EvidenceItem
              evidence={netIncomeConnection.source.evidence}
              id="three-statements-income-net-income-evidence"
              label="Income Statement · Net Income"
            />
            <EvidenceItem
              evidence={netIncomeConnection.target.evidence}
              id="three-statements-cash-flow-net-income-evidence"
              label="Cash Flow Statement · Net Income"
            />
          </div>
        </section>
      ) : null}

      {visibleStage >= 3 ? (
        <section className="three-statements-stage" data-three-stage="cash-movement">
          <p className="cash-section__number">03 · The Cash Flow Statement explains the change</p>
          <div className="cash-movement-ledger">
            <div><span>Beginning cash</span><strong>{formatBillions(values.beginningCash)}</strong></div>
            <div><span>Operating activities</span><strong>{formatSignedBillions(values.operatingCashFlow)}</strong></div>
            <div><span>Investing activities</span><strong>{formatSignedBillions(values.investingCashFlow)}</strong></div>
            <div><span>Financing activities</span><strong>{formatSignedBillions(values.financingCashFlow)}</strong></div>
            <div className="cash-movement-ledger__net"><span>Net change in cash</span><strong>{formatSignedBillions(values.netChangeInCash)}</strong></div>
            <div className="cash-movement-ledger__ending"><span>Ending cash</span><strong>{formatBillions(values.endingCash)}</strong></div>
          </div>
          <p className="three-statements-equation">
            {formatSignedBillions(values.operatingCashFlow)} {formatSignedBillions(values.investingCashFlow)} {formatSignedBillions(values.financingCashFlow)} = {formatSignedBillions(values.netChangeInCash)}
          </p>
          <p>
            Then {formatBillions(values.beginningCash)} beginning cash plus the {formatSignedBillions(values.netChangeInCash)} change equals {formatBillions(values.endingCash)} ending cash.
          </p>
          <div className="three-evidence-grid" aria-label="Reported cash movement evidence">
            <EvidenceItem evidence={evidence.beginningCash} id="three-statements-beginning-cash-evidence" label="Beginning cash" />
            <EvidenceItem evidence={evidence.operatingCashFlow} id="three-statements-operating-cash-evidence" label="Operating activities" />
            <EvidenceItem evidence={evidence.investingCashFlow} id="three-statements-investing-cash-evidence" label="Investing activities" />
            <EvidenceItem evidence={evidence.financingCashFlow} id="three-statements-financing-cash-evidence" label="Financing activities" />
            <EvidenceItem evidence={evidence.netChangeInCash} id="three-statements-net-change-evidence" label="Net change in cash" />
          </div>
          {visibleStage === 3 ? (
            <button className="cash-continue" onClick={() => setVisibleStage(4)} type="button">
              Connect ending cash
            </button>
          ) : null}
        </section>
      ) : null}

      {visibleStage >= 4 ? (
        <section className="three-statements-stage" data-three-stage="ending-cash">
          <p className="cash-section__number">04 · Ending cash becomes a reporting-date position</p>
          <div className="statement-bridge" aria-label="Ending cash connection">
            <div>
              <span>Cash Flow Statement · Ending cash</span>
              <strong>{formatBillions(values.endingCash)}</strong>
              <small>At the end of {filing.endDate}</small>
            </div>
            <div className="statement-bridge__match">
              <span aria-hidden="true">=</span>
              <strong>Exact match</strong>
            </div>
            <div>
              <span>Balance Sheet · Cash and cash equivalents</span>
              <strong>{formatBillions(values.endingCash)}</strong>
              <small>As of {filing.asOfDate}</small>
            </div>
          </div>
          <p>
            These figures match exactly in this reviewed Apple filing. This is a
            filing-specific validated connection, not a claim that every filer uses
            one universal cash taxonomy presentation.
          </p>
          <form onSubmit={reviewPosition}>
            <fieldset>
              <legend>Where would you look for cash at the reporting date?</legend>
              <div className="cash-choice-list three-statement-choice-list">
                {["Income Statement", "Cash Flow Statement", "Balance Sheet"].map((answer) => (
                  <label key={answer}>
                    <input
                      checked={positionChoice === answer}
                      name="reporting-date-cash"
                      onChange={() => {
                        setPositionChoice(answer);
                        setPositionReviewed(false);
                      }}
                      type="radio"
                      value={answer}
                    />
                    <span>{answer}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <button disabled={!positionChoice} type="submit">Check my reasoning</button>
          </form>
          {positionReviewed ? (
            <div className="cash-feedback" role="status">
              <p>
                {positionChoice === "Balance Sheet"
                  ? "Right. The Balance Sheet reports the cash position as of one date."
                  : "Not quite. The Balance Sheet is the point-in-time statement that reports cash at the reporting date."}
              </p>
              {visibleStage === 4 ? (
                <button onClick={() => setVisibleStage(5)} type="button">
                  See the full map
                </button>
              ) : null}
            </div>
          ) : null}
          <div className="three-evidence-pair">
            <EvidenceItem evidence={endingCashConnection.source.evidence} id="three-statements-ending-cash-evidence" label="Cash Flow Statement · Ending cash" />
            <EvidenceItem evidence={endingCashConnection.target.evidence} id="three-statements-balance-cash-evidence" label="Balance Sheet · Cash and cash equivalents" />
          </div>
        </section>
      ) : null}

      {visibleStage >= 5 ? (
        <section className="three-statements-stage" data-three-stage="full-map">
          <p className="cash-section__number">05 · One filing, one connected story</p>
          <div className="three-statement-map three-statement-map--summary">
            <article>
              <span>Performance over the year</span>
              <strong>Net Income {formatBillions(values.netIncome)}</strong>
              <small>Income Statement</small>
            </article>
            <span className="three-statement-map__connector" aria-hidden="true">→</span>
            <article>
              <span>Cash reconciliation and movement</span>
              <strong>Ending cash {formatBillions(values.endingCash)}</strong>
              <small>Cash Flow Statement</small>
            </article>
            <span className="three-statement-map__connector" aria-hidden="true">→</span>
            <article>
              <span>Position on {filing.asOfDate}</span>
              <strong>Cash {formatBillions(values.endingCash)}</strong>
              <small>Balance Sheet</small>
            </article>
          </div>
          <aside className="cash-learning-trace three-statements-trace" aria-label="Learning Trace">
            <p><span aria-hidden="true" /> Learning Trace</p>
            <h3>Performance → cash reconciliation → ending position</h3>
            <p>
              The arrows mark the two validated bridges in this filing. They do not
              mean every Income Statement line flows directly into every Balance Sheet line.
            </p>
          </aside>
          {visibleStage === 5 ? (
            <button className="cash-continue" onClick={completeLesson} type="button">
              Complete the connection
            </button>
          ) : null}
        </section>
      ) : null}

      {visibleStage >= 6 ? (
        <section className="three-statements-stage three-statements-stage--complete" data-three-stage="complete">
          <p className="cash-section__number">06 · What you can now trace</p>
          <h3>Two connections, without turning them into a new metric.</h3>
          <ul>
            <li>Net Income is the same reported result in the Income Statement and Apple&apos;s indirect-method cash-flow reconciliation.</li>
            <li>Operating cash can differ from Net Income after non-cash and timing adjustments.</li>
            <li>The annual cash movements reconcile beginning cash to ending cash.</li>
            <li>Ending cash matches the Balance Sheet cash position in this reviewed filing.</li>
          </ul>
          <p className="three-statements-boundary">
            This lesson does not prove that Net Income is cash, that every Balance Sheet
            line comes from the Cash Flow Statement, or that these figures alone make
            {" "}{company.name} a good or bad investment.
          </p>
        </section>
      ) : null}

      <p className="profit-retrieved-note">
        Latest statement retrieval {latestRetrievedAt > 0 ? new Date(latestRetrievedAt).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" }) : "unavailable"}
        {dataStatuses.some((status) => status.state === "stale")
          ? " · At least one statement uses the last known cached public filing data because SEC was unavailable."
          : ""}
      </p>
    </section>
  );
}
