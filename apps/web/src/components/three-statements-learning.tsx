"use client";

import { useState, type FormEvent } from "react";

import { EvidenceInspector } from "@/components/evidence-inspector";
import { useLearningProgress } from "@/components/learning-progress-provider";
import type { ReportedEvidence } from "@/lib/evidence";
import type {
  StatementConnection,
  ThreeStatementConnectionData,
} from "@/lib/three-statements";

type Props = { data: ThreeStatementConnectionData };

const billions = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const connectionLabels: Record<StatementConnection["type"], string> = {
  arithmetic: "Arithmetic",
  reconciliation: "Reconciliation",
  "period-flow-to-ending-balance": "Period flow → ending balance",
  "conceptual-only": "Conceptual only · not an equation",
};

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

function findConnection(
  connections: StatementConnection[],
  id: StatementConnection["id"],
): StatementConnection {
  const connection = connections.find((item) => item.id === id);
  if (!connection) throw new Error(`Missing statement connection: ${id}`);
  return connection;
}

export function ThreeStatementsLearning({ data }: Props) {
  const { markExplored } = useLearningProgress();
  const { company, filing, values, connections, evidence, dataStatuses } = data;
  const [selectedId, setSelectedId] = useState<StatementConnection["id"]>(
    "net-income-to-operating-cash",
  );
  const [answer, setAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const conceptual = findConnection(connections, "statement-views");
  const incomeArithmetic = findConnection(connections, "income-to-net-income");
  const netIncomeReconciliation = findConnection(
    connections,
    "net-income-to-operating-cash",
  );
  const cashArithmetic = findConnection(connections, "activities-to-change");
  const endingBalance = findConnection(
    connections,
    "change-to-ending-balance",
  );
  const selected = findConnection(connections, selectedId);
  const latestRetrievedAt = dataStatuses
    .map((status) => Date.parse(status.retrievedAt))
    .filter(Number.isFinite)
    .reduce((latest, value) => Math.max(latest, value), 0);

  function submitCheck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!answer) return;
    setSubmitted(true);
    markExplored(["three-statements-connect"]);
  }

  function ConnectionControl({ connection }: { connection: StatementConnection }) {
    return (
      <button
        aria-pressed={selectedId === connection.id}
        className="statement-connection-control"
        onClick={() => setSelectedId(connection.id)}
        type="button"
      >
        <span aria-hidden="true">↓</span>
        <strong>{connectionLabels[connection.type]}</strong>
        <small>{connection.label}</small>
      </button>
    );
  }

  return (
    <section className="three-statements-lesson" aria-labelledby="three-statements-title">
      <header className="three-statements-lesson__header">
        <p className="eyebrow">Statement Connection Trace · one reviewed filing</p>
        <h2 id="three-statements-title">Three views of the same company.</h2>
        <p>
          Trace how {company.name}&apos;s FY{filing.fiscalYear} performance,
          cash movement, and reporting-date position connect—without treating
          every relationship as an equation.
        </p>
        <p className="profit-lesson__period">
          {filing.startDate} to {filing.endDate} · USD · Balance Sheet as of{" "}
          {filing.asOfDate} ·{" "}
          <a href={filing.sourceUrl} rel="noreferrer" target="_blank">
            SEC {filing.form} ↗
          </a>
        </p>
      </header>

      <section className="three-statements-stage" data-three-stage="roles">
        <p className="cash-section__number">01 · Different questions, different time contexts</p>
        <dl className="statement-role-list">
          <div>
            <dt>Income Statement</dt>
            <dd>Performance and activity over a period</dd>
            <small>{filing.startDate} to {filing.endDate}</small>
          </div>
          <div>
            <dt>Cash Flow Statement</dt>
            <dd>Cash movement over a period</dd>
            <small>{filing.startDate} to {filing.endDate}</small>
          </div>
          <div>
            <dt>Balance Sheet</dt>
            <dd>Financial position at one point in time</dd>
            <small>As of {filing.asOfDate}</small>
          </div>
        </dl>
        {conceptual.type === "conceptual-only" ? (
          <p className="three-statements-boundary">
            <strong>{connectionLabels[conceptual.type]}.</strong> {conceptual.boundary}
          </p>
        ) : null}
      </section>

      <section className="three-statements-stage" data-three-stage="trace">
        <p className="cash-section__number">02 · Follow the reviewed links</p>
        <div className="statement-connection-trace" aria-label="Statement Connection Trace">
          <article className="statement-trace-node">
            <header>
              <span>Income Statement</span>
              <small>Period performance</small>
            </header>
            <div className="statement-trace-equation">
              <div><span>Revenue</span><strong>{formatBillions(values.revenue)}</strong></div>
              <div><span>Cost of Sales</span><strong>−{formatBillions(values.costOfSales)}</strong></div>
              <div><span>Operating Expenses</span><strong>−{formatBillions(values.operatingExpenses)}</strong></div>
              <div><span>Other Income/(Expense), net</span><strong>{formatSignedBillions(values.otherIncomeExpenseNet)}</strong></div>
              <div><span>Tax</span><strong>−{formatBillions(values.incomeTaxProvision)}</strong></div>
              <div className="statement-trace-equation__result"><span>Net Income</span><strong>{formatBillions(values.netIncome)}</strong></div>
            </div>
            <p><b>{connectionLabels[incomeArithmetic.type]}</b> · {incomeArithmetic.label}</p>
          </article>

          <ConnectionControl connection={netIncomeReconciliation} />

          <article className="statement-trace-node">
            <header>
              <span>Cash Flow Statement</span>
              <small>Period cash movement</small>
            </header>
            <div className="statement-trace-start">
              <span>Apple&apos;s indirect-method operating cash-flow reconciliation starts from Net Income</span>
              <strong>{formatBillions(values.netIncome)}</strong>
              <small>Apple reported · Net Income is not cash</small>
            </div>
            <div className="statement-trace-equation">
              <div><span>Operating activities</span><strong>{formatSignedBillions(values.operatingCashFlow)}</strong></div>
              <div><span>Investing activities</span><strong>{formatSignedBillions(values.investingCashFlow)}</strong></div>
              <div><span>Financing activities</span><strong>{formatSignedBillions(values.financingCashFlow)}</strong></div>
              <div className="statement-trace-equation__result"><span>Reported change in cash</span><strong>{formatSignedBillions(values.netChangeInCash)}</strong></div>
            </div>
            <p><b>{connectionLabels[cashArithmetic.type]}</b> · {cashArithmetic.label}</p>
          </article>

          <ConnectionControl connection={endingBalance} />

          <article className="statement-trace-node statement-trace-node--position">
            <header>
              <span>Balance Sheet</span>
              <small>Position as of {filing.asOfDate}</small>
            </header>
            <div className="statement-balance-bridge">
              <div><span>Beginning balance</span><strong>{formatBillions(values.beginningCash)}</strong><small>Cash, cash equivalents &amp; restricted cash</small></div>
              <b>+</b>
              <div><span>Reported change</span><strong>{formatSignedBillions(values.netChangeInCash)}</strong></div>
              <b>=</b>
              <div><span>Ending balance</span><strong>{formatBillions(values.endingCash)}</strong><small>Cash, cash equivalents &amp; restricted cash</small></div>
            </div>
            <p>
              The ending value and Balance Sheet Cash and cash equivalents match exactly in this reviewed Apple filing.
            </p>
          </article>
        </div>

        <aside className="statement-connection-detail" aria-live="polite">
          <span>{connectionLabels[selected.type]}</span>
          <h3>{selected.label}</h3>
          <p>{selected.boundary}</p>
          {selected.type === "conceptual-only" ? (
            <small>No numeric equality is claimed for this connection.</small>
          ) : selected.equation ? (
            <small>This connection includes a validated numeric equality.</small>
          ) : (
            <small>This is a reported reconciliation relationship, not direct equality between Net Income and Operating Cash Flow.</small>
          )}
        </aside>
      </section>

      <section className="three-statements-stage" data-three-stage="evidence">
        <p className="cash-section__number">03 · Inspect the reported facts</p>
        <p>
          The trace reuses reported filing facts. Its grouping and connection labels are
          FinPath presentation; they are not new Apple-reported metrics.
        </p>
        <div className="three-evidence-grid" aria-label="Statement connection evidence">
          <EvidenceItem evidence={evidence.incomeNetIncome} id="three-statements-income-net-income-evidence" label="Income Statement · Net Income" />
          <EvidenceItem evidence={evidence.cashFlowNetIncome} id="three-statements-cash-net-income-evidence" label="Cash Flow Statement · Net Income" />
          <EvidenceItem evidence={evidence.operatingCashFlow} id="three-statements-operating-cash-evidence" label="Operating activities" />
          <EvidenceItem evidence={evidence.investingCashFlow} id="three-statements-investing-cash-evidence" label="Investing activities" />
          <EvidenceItem evidence={evidence.financingCashFlow} id="three-statements-financing-cash-evidence" label="Financing activities" />
          <EvidenceItem evidence={evidence.netChangeInCash} id="three-statements-net-change-evidence" label="Reported change in cash" />
          <EvidenceItem evidence={evidence.beginningCash} id="three-statements-beginning-cash-evidence" label="Beginning cash-related balance" />
          <EvidenceItem evidence={evidence.endingCash} id="three-statements-ending-cash-evidence" label="Cash Flow Statement · Ending balance" />
          <EvidenceItem evidence={evidence.balanceCash} id="three-statements-balance-cash-evidence" label="Balance Sheet · Cash and cash equivalents" />
        </div>
      </section>

      <section className="three-statements-stage" data-three-stage="completion">
        <p className="cash-section__number">04 · Check the time context</p>
        <form onSubmit={submitCheck}>
          <fieldset>
            <legend>Where would you look for Apple&apos;s financial position at the reporting date?</legend>
            <div className="cash-choice-list three-statement-choice-list">
              {["Income Statement", "Cash Flow Statement", "Balance Sheet"].map((choice) => (
                <label key={choice}>
                  <input
                    checked={answer === choice}
                    name="reporting-date-position"
                    onChange={() => {
                      setAnswer(choice);
                      setSubmitted(false);
                    }}
                    type="radio"
                    value={choice}
                  />
                  <span>{choice}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <button disabled={!answer} type="submit">Submit my answer</button>
        </form>
        {submitted ? (
          <div className="cash-feedback" role="status">
            <p>
              {answer === "Balance Sheet"
                ? "Right. The Balance Sheet reports financial position as of one date."
                : "The Balance Sheet is the point-in-time statement. The other two describe activity over a period."}
            </p>
            <small>Submitting records participation; correctness does not control completion.</small>
          </div>
        ) : null}
        <p className="three-statements-boundary">
          This trace does not claim Net Income is cash, every Income Statement line maps
          directly to the Balance Sheet, or these figures make {company.name} a good or
          bad investment.
        </p>
      </section>

      <p className="profit-retrieved-note">
        Latest statement retrieval {latestRetrievedAt > 0 ? new Date(latestRetrievedAt).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" }) : "unavailable"}
        {dataStatuses.some((status) => status.state === "stale")
          ? " · At least one statement uses the last known cached public filing data because SEC was unavailable."
          : ""}
      </p>
    </section>
  );
}
