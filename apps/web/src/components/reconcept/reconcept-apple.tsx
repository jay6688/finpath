import Link from "next/link";
import type { CSSProperties } from "react";

import type { CompanyBalanceSheet, CompanyEarningsPerShare, CompanyIncomeStatement, IncomeStatementLineId, SupportedCompany } from "@/lib/api";
import type { CompanyRevenueData } from "@/lib/company-revenue-data";
import { incomeStatementLineMap } from "@/lib/profit-learning";

import styles from "./reconcept.module.css";

const compactBillions = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 1, maximumFractionDigits: 1 });
const exactBillions = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 3, maximumFractionDigits: 3 });

function money(value: number, exact = false) {
  const result = `${(exact ? exactBillions : compactBillions).format(Math.abs(value) / 1_000_000_000)}B`;
  return value < 0 ? `(${result})` : result;
}

function lineValue(statement: CompanyIncomeStatement | null, id: IncomeStatementLineId) {
  return statement ? incomeStatementLineMap(statement.statement.lines).get(id)?.value ?? null : null;
}

export function ReconceptApple({
  balanceSheet,
  company,
  earnings,
  incomeStatement,
  revenueData,
}: {
  balanceSheet: CompanyBalanceSheet | null;
  company: SupportedCompany;
  earnings: CompanyEarningsPerShare | null;
  incomeStatement: CompanyIncomeStatement | null;
  revenueData: CompanyRevenueData;
}) {
  const latest = revenueData.latest;
  const series = revenueData.overview?.series ?? [];
  const max = Math.max(...series.map((fact) => fact.value), 1);
  const netIncome = lineValue(incomeStatement, "net-income");
  const operatingIncome = lineValue(incomeStatement, "operating-income");
  const grossMargin = lineValue(incomeStatement, "gross-margin");
  const sourceUrl = incomeStatement?.statement.sourceUrl ?? latest?.sourceUrl ?? null;
  const year = incomeStatement?.statement.fiscalYear ?? latest?.fiscalYear ?? company.reviewedFiscalYear;
  const companyQuery = `?company=${company.slug}`;

  return (
    <div className={styles.researchCanvas}>
      <section className={styles.companyMasthead}>
        <div className={styles.companyIdentity}>
          <span className={styles.appleMark} aria-hidden="true">A</span>
          <div><p className={styles.kicker}>Reviewed company workspace</p><h1>{company.name}</h1><p>{company.ticker} · SEC CIK {company.cik}</p></div>
        </div>
        <div className={styles.filingBadge}><span>Reporting context</span><strong>FY{year}</strong><small>{incomeStatement?.statement.form ?? latest?.form ?? "Annual filing"}{incomeStatement ? ` · filed ${incomeStatement.statement.filedAt}` : ""}</small></div>
      </section>

      <nav className={styles.researchNav} aria-label="Apple research areas">
        <a href="#performance">Performance</a><a href="#position">Financial position</a><a href="#per-share">Per share</a><a href="#evidence">Evidence</a>
      </nav>

      {!latest ? <section className={styles.researchUnavailable} role="status"><h2>Reviewed Revenue is unavailable.</h2><p>{revenueData.dataError}</p><p>No financial value is substituted.</p></section> : null}

      <section className={styles.revenueObject} id="performance" aria-labelledby="revenue-object-heading">
        <header>
          <div><p className={styles.kicker}>Performance object · reported</p><h2 id="revenue-object-heading">Revenue</h2><p>Money Apple reported from customers before costs and expenses.</p></div>
          {latest ? <div className={styles.revenueValue}><strong>{money(latest.value, true)}</strong><span>FY{latest.fiscalYear} · USD</span></div> : null}
        </header>
        <div className={styles.revenueObjectBody}>
          <div className={styles.revenueHistory}>
            <div className={styles.objectPath} aria-hidden="true"><span data-active>Number</span><i /><span>Trend</span><i /><span>Evidence</span></div>
            {series.length ? (
              <div className={styles.historyChart} aria-label="Annual Revenue history">
                {series.map((fact) => (
                  <div key={fact.fiscalYear}>
                    <span style={{ "--bar-height": `${(fact.value / max) * 100}%` } as CSSProperties} />
                    <strong>{money(fact.value)}</strong><small>FY{fact.fiscalYear}</small>
                  </div>
                ))}
              </div>
            ) : <p>Annual Revenue history is unavailable.</p>}
          </div>
          <aside className={styles.revenuePassport} id="evidence">
            <p className={styles.kicker}>Number passport</p>
            <h3>Where this Revenue came from</h3>
            {latest ? <dl><div><dt>Status</dt><dd>Reported</dd></div><div><dt>Period</dt><dd>Year ended {latest.endDate}</dd></div><div><dt>Form</dt><dd>{latest.form}</dd></div><div><dt>Filed</dt><dd>{latest.filedAt}</dd></div></dl> : null}
            {sourceUrl ? <a href={sourceUrl} rel="noreferrer" target="_blank">Open official SEC filing ↗</a> : <strong>Official source unavailable</strong>}
            <Link href={`/learn/company-analysis/revenue${companyQuery}`}>Learn what Revenue means →</Link>
          </aside>
        </div>
      </section>

      <section className={styles.researchGrid}>
        <article className={styles.performanceObject}>
          <header><p className={styles.kicker}>Income statement · reported</p><h2>Profit path</h2><Link href="/design-lab/reconcept/profit">Inspect visually →</Link></header>
          <dl>
            <div><dt>Gross margin</dt><dd>{grossMargin === null ? "Unavailable" : money(grossMargin)}</dd></div>
            <div><dt>Operating income</dt><dd>{operatingIncome === null ? "Unavailable" : money(operatingIncome)}</dd></div>
            <div><dt>Net income</dt><dd>{netIncome === null ? "Unavailable" : money(netIncome)}</dd></div>
          </dl>
          <p>These are different reported lines—not interchangeable versions of “profit.”</p>
        </article>

        <article className={styles.positionObject} id="position">
          <header><p className={styles.kicker}>Reporting-date object</p><h2>Financial position</h2>{balanceSheet ? <span>{balanceSheet.statement.asOfDate}</span> : null}</header>
          {balanceSheet ? <dl><div><dt>Total assets</dt><dd>{money(balanceSheet.statement.assets.value)}</dd></div><div><dt>Total liabilities</dt><dd>{money(balanceSheet.statement.liabilities.value)}</dd></div><div><dt>Shareholders’ equity</dt><dd>{money(balanceSheet.statement.equity.value)}</dd></div><div><dt>Cash and cash equivalents</dt><dd>{money(balanceSheet.statement.cashAndCashEquivalents.value)}</dd></div></dl> : <p>Reviewed Balance Sheet unavailable.</p>}
          <Link href={`/learn/company-analysis/balance-sheet${companyQuery}`}>Understand this snapshot →</Link>
        </article>

        <article className={styles.perShareObject} id="per-share">
          <header><p className={styles.kicker}>Per-share object · reported</p><h2>Earnings per share</h2></header>
          {earnings ? <div><span><small>Basic EPS</small><strong>${earnings.statement.basicEps.value}</strong></span><i>→</i><span><small>Diluted EPS</small><strong>${earnings.statement.dilutedEps.value}</strong></span></div> : <p>Reviewed EPS unavailable.</p>}
          <Link href={`/learn/company-analysis/eps-and-share-count${companyQuery}`}>See how share count connects →</Link>
        </article>

        <article className={styles.valuationObject}>
          <header><p className={styles.kicker}>Valuation</p><h2>Not assessed</h2></header>
          <strong>No verified market price is connected.</strong>
          <p>FinPath therefore does not show a current Market Cap or P/E here.</p>
          <Link href="/learn/company-analysis/market-cap">Use the educational sandbox →</Link>
        </article>
      </section>
    </div>
  );
}
