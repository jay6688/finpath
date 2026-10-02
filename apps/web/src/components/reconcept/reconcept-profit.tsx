"use client";

import { useMemo, useState, type CSSProperties } from "react";

import profitContent from "@/content/profit-lessons/aapl-profit-fy2025.json";
import type { CompanyIncomeStatement, IncomeStatementLineId } from "@/lib/api";
import { incomeStatementLineMap } from "@/lib/profit-learning";

import styles from "./reconcept.module.css";

const lineOrder: IncomeStatementLineId[] = [
  "total-net-sales", "total-cost-of-sales", "gross-margin",
  "total-operating-expenses", "operating-income", "other-income-expense-net",
  "income-before-income-taxes", "income-tax-provision", "net-income",
];

const teaching: Record<IncomeStatementLineId, { short: string; why: string; remains: string; category: string }> = {
  "total-net-sales": { short: "The starting line", why: "Apple labels Revenue as Total net sales in this filing.", remains: "Nothing has been deducted yet.", category: "revenue" },
  "total-cost-of-sales": { short: "Make and deliver what was sold", why: "These are the direct costs tied to Apple’s products and services.", remains: "Revenue after this deduction is Gross margin.", category: "cost" },
  "gross-margin": { short: "First reported subtotal", why: "This is the dollar amount left after Total cost of sales.", remains: "Operating expenses still need to be deducted.", category: "subtotal" },
  "total-operating-expenses": { short: "Run the wider business", why: "Research, development, selling, general and administrative work sits here.", remains: "Gross margin after this deduction is Operating income.", category: "operations" },
  "operating-income": { short: "Profit from operations", why: "This subtotal reflects Apple’s operating activity before the final non-operating item and tax.", remains: "It is not yet Net income.", category: "subtotal" },
  "other-income-expense-net": { short: "A signed adjustment", why: "This line was negative in FY2025, so it reduced the next subtotal.", remains: "It is kept separate instead of hidden inside another cost.", category: "other" },
  "income-before-income-taxes": { short: "The pre-tax subtotal", why: "This is the amount before Apple’s income tax provision.", remains: "Tax has not been deducted yet.", category: "subtotal" },
  "income-tax-provision": { short: "The final major deduction", why: "This is the income tax provision reported for the fiscal year.", remains: "After tax, the income statement reaches Net income.", category: "tax" },
  "net-income": { short: "The final Profit line", why: "This is Apple’s final accounting result on this income statement.", remains: "It is not cash generated or cash retained.", category: "result" },
};

const exactBillions = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 3, maximumFractionDigits: 3 });

function formatBillions(value: number) {
  const formatted = `${exactBillions.format(Math.abs(value) / 1_000_000_000)}B`;
  return value < 0 ? `(${formatted})` : formatted;
}

function operator(id: IncomeStatementLineId) {
  if (["total-cost-of-sales", "total-operating-expenses", "income-tax-provision"].includes(id)) return "−";
  if (id === "other-income-expense-net") return "±";
  if (["gross-margin", "operating-income", "income-before-income-taxes", "net-income"].includes(id)) return "=";
  return "";
}

export function ReconceptProfit({ incomeStatement }: { incomeStatement: CompanyIncomeStatement }) {
  const { statement } = incomeStatement;
  const lines = useMemo(() => incomeStatementLineMap(statement.lines), [statement.lines]);
  const [activeId, setActiveId] = useState<IncomeStatementLineId>("total-cost-of-sales");
  const revenue = lines.get("total-net-sales");
  const netIncome = lines.get("net-income");
  const activeLine = lines.get(activeId);
  const costOfSales = lines.get("total-cost-of-sales");
  const operatingExpenses = lines.get("total-operating-expenses");
  const otherExpense = lines.get("other-income-expense-net");
  const incomeTax = lines.get("income-tax-provision");
  if (!revenue || !netIncome || !activeLine || !costOfSales || !operatingExpenses || !otherExpense || !incomeTax) return null;

  const netRatio = (netIncome.value / revenue.value) * 100;
  const activeCopy = profitContent.lines[activeId];
  const activeTeaching = teaching[activeId];

  return (
    <div className={styles.profitCanvas}>
      <header className={styles.lessonIdentity}>
        <nav aria-label="Breadcrumb"><span>Learn</span><i>›</i><strong>Profit</strong></nav>
        <div><p className={styles.kicker}>Lesson 3 of 15 · guided relationship</p><h1>Profit</h1><p>See how Apple’s reported Revenue moves through costs, expenses and tax to reach Net Income.</p></div>
        <span className={styles.lessonCount}>03 / 15</span>
      </header>

      <section className={styles.profitOverview} aria-labelledby="profit-overview-heading">
        <header>
          <div><p className={styles.kicker}>Level 1 · see the whole relationship</p><h2 id="profit-overview-heading">Revenue becomes a smaller final result after several accounting layers.</h2></div>
          <span>Apple Inc. · FY{statement.fiscalYear}</span>
        </header>
        <div className={styles.profitBridge}>
          <div className={styles.bridgeEndpoint} data-kind="revenue"><strong>{formatBillions(revenue.value)}</strong><span>Revenue</span><small>100% starting line</small></div>
          <div className={styles.bridgeLayers} aria-label="Revenue deductions leading to Net Income" style={{ "--cost-share": `${Math.abs(costOfSales.value)}fr`, "--operations-share": `${Math.abs(operatingExpenses.value)}fr`, "--other-share": `${Math.abs(otherExpense.value)}fr`, "--tax-share": `${Math.abs(incomeTax.value)}fr`, "--net-share": `${Math.abs(netIncome.value)}fr` } as CSSProperties}>
            <div data-layer="cost"><span>Cost of sales</span><strong>{formatBillions(costOfSales.value)}</strong></div>
            <div data-layer="operations"><span>Operating expenses</span><strong>{formatBillions(operatingExpenses.value)}</strong></div>
            <div data-layer="other"><span>Other, net</span><strong>{formatBillions(otherExpense.value)}</strong></div>
            <div data-layer="tax"><span>Tax</span><strong>{formatBillions(incomeTax.value)}</strong></div>
            <div data-layer="net" aria-hidden="true" />
          </div>
          <div className={styles.bridgeEndpoint} data-kind="result" style={{ "--result-scale": `${netRatio}%` } as CSSProperties}><strong>{formatBillions(netIncome.value)}</strong><span>Net Income</span><small>{netRatio.toFixed(1)}% of Revenue</small></div>
        </div>
        <p className={styles.bridgeBoundary}>Net Income is an accounting result. This visual does not show when cash moved.</p>
      </section>

      <section className={styles.profitWorkbench} aria-labelledby="profit-inspect-heading">
        <header><div><p className={styles.kicker}>Level 2 · inspect the reported path</p><h2 id="profit-inspect-heading">Choose any line to trace what changed.</h2></div><p>Every bar uses Revenue as the same 100% scale.</p></header>
        <div className={styles.profitWorkspace}>
          <ol className={styles.statementPath}>
            {lineOrder.map((id, index) => {
              const line = lines.get(id);
              if (!line) return null;
              const width = Math.max(1.5, (Math.abs(line.value) / revenue.value) * 100);
              const copy = profitContent.lines[id];
              return (
                <li data-active={activeId === id} data-category={teaching[id].category} key={id}>
                  <button aria-pressed={activeId === id} onClick={() => setActiveId(id)} onFocus={() => setActiveId(id)} type="button">
                    <span className={styles.pathIndex}>{String(index + 1).padStart(2, "0")}</span>
                    <span className={styles.pathOperator} aria-hidden="true">{operator(id)}</span>
                    <span className={styles.pathLabel}><strong>{copy.reportedLabel}</strong><small>{teaching[id].short}</small></span>
                    <span className={styles.pathMeasure}><i style={{ width: `${width}%` }} /><b>{formatBillions(line.value)}</b></span>
                  </button>
                </li>
              );
            })}
          </ol>
          <aside className={styles.profitInspector} data-category={activeTeaching.category} aria-live="polite">
            <p className={styles.kicker}>Learning trace · line {lineOrder.indexOf(activeId) + 1}</p>
            <span>{activeCopy.reportedLabel}</span>
            <strong>{formatBillions(activeLine.value)}</strong>
            <h3>{activeTeaching.short}</h3>
            <p>{activeTeaching.why}</p>
            <small>{activeTeaching.remains}</small>
            <div><span>Reported</span><span>USD</span><span>FY{statement.fiscalYear}</span></div>
          </aside>
        </div>
      </section>

      <footer className={styles.profitEvidence}>
        <div><p className={styles.kicker}>Number with a passport</p><strong>Apple FY{statement.fiscalYear} · {statement.form}</strong><span>Year ended {statement.endDate} · filed {statement.filedAt}</span></div>
        <a href={statement.sourceUrl} rel="noreferrer" target="_blank">Open official SEC filing ↗</a>
      </footer>
    </div>
  );
}
