import Link from "next/link";
import type {
  CompanyBalanceSheet,
  CompanyEarningsPerShare,
  CompanyIncomeStatement,
  IncomeStatementLineId,
  SupportedCompany,
} from "@/lib/api";
import type { CompanyRevenueData } from "@/lib/company-revenue-data";
import { incomeStatementLineMap } from "@/lib/profit-learning";

import styles from "./visual-prototype.module.css";

type StageZeroAppleProps = {
  balanceSheet: CompanyBalanceSheet | null;
  company: SupportedCompany;
  earningsPerShare: CompanyEarningsPerShare | null;
  incomeStatement: CompanyIncomeStatement | null;
  revenueData: CompanyRevenueData;
};

const compactBillions = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const exactBillions = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

function formatBillions(value: number, exact = false) {
  const formatter = exact ? exactBillions : compactBillions;
  const formatted = `${formatter.format(Math.abs(value) / 1_000_000_000)}B`;
  return value < 0 ? `(${formatted})` : formatted;
}

function MetricCard({
  eyebrow,
  emphasis = false,
  label,
  value,
}: {
  eyebrow: string;
  emphasis?: boolean;
  label: string;
  value: string;
}) {
  return (
    <article className={styles.researchMetric} data-emphasis={emphasis}>
      <span>{eyebrow}</span>
      <h2>{label}</h2>
      <strong>{value}</strong>
    </article>
  );
}
function incomeValue(
  incomeStatement: CompanyIncomeStatement | null,
  lineId: IncomeStatementLineId,
) {
  if (!incomeStatement) return null;
  return incomeStatementLineMap(incomeStatement.statement.lines).get(lineId)?.value ?? null;
}

export function StageZeroApple({
  balanceSheet,
  company,
  earningsPerShare,
  incomeStatement,
  revenueData,
}: StageZeroAppleProps) {
  const { latest, overview } = revenueData;
  const netIncome = incomeValue(incomeStatement, "net-income");
  const grossMargin = incomeValue(incomeStatement, "gross-margin");
  const operatingIncome = incomeValue(incomeStatement, "operating-income");
  const incomeBeforeTax = incomeValue(
    incomeStatement,
    "income-before-income-taxes",
  );
  const statementSourceUrl =
    incomeStatement?.statement.sourceUrl ?? latest?.sourceUrl ?? null;
  const fiscalYear =
    incomeStatement?.statement.fiscalYear ?? latest?.fiscalYear ?? company.reviewedFiscalYear;
  const series = overview?.series ?? [];
  const maxRevenue = Math.max(...series.map((fact) => fact.value), 1);
  const chartWidth = 720;
  const chartHeight = 272;
  const chartLeft = 58;
  const chartRight = 28;
  const chartTop = 24;
  const chartBottom = 42;
  const plotWidth = chartWidth - chartLeft - chartRight;
  const plotHeight = chartHeight - chartTop - chartBottom;
  const revenuePoints = series.map((fact, index) => ({
    ...fact,
    x:
      chartLeft +
      (series.length === 1
        ? plotWidth / 2
        : (index / (series.length - 1)) * plotWidth),
    y: chartTop + plotHeight - (fact.value / maxRevenue) * plotHeight,
  }));
  const revenueLine = revenuePoints
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
  const revenueArea = revenuePoints.length
    ? `M ${revenuePoints[0].x} ${chartTop + plotHeight} L ${revenuePoints
        .map((point) => `${point.x} ${point.y}`)
        .join(" L ")} L ${revenuePoints[revenuePoints.length - 1].x} ${chartTop + plotHeight} Z`
    : "";
  const selectedQuery = `?company=${company.slug}`;

  return (
    <div className={styles.exploreCanvas}>
      <section className={styles.companyHero} aria-labelledby="prototype-apple-heading">
        <div className={styles.companyIdentity}>
          <p className={styles.kicker}>Reviewed company record</p>
          <div>
            <span className={styles.companyMonogram} aria-hidden="true">A</span>
            <div>
              <h1 id="prototype-apple-heading">{company.name}</h1>
              <p>{company.ticker} · SEC CIK {company.cik}</p>
            </div>
          </div>
          <p className={styles.companyHeroCopy}>
            Explore the company&apos;s reviewed annual financial records, then move
            into Learn when you want a step-by-step explanation.
          </p>
        </div>
        <div className={styles.filingIdentity}>
          <span>Reviewed annual record</span>
          <strong>FY{fiscalYear}</strong>
          <small>
            {incomeStatement?.statement.form ?? latest?.form ?? "SEC filing"}
            {incomeStatement ? ` · filed ${incomeStatement.statement.filedAt}` : ""}
          </small>
        </div>
      </section>

      <nav className={styles.companySections} aria-label="Apple research sections">
        <a href="#overview">Overview</a>
        <a href="#revenue-history">Revenue history</a>
        <a href="#financial-position">Financial position</a>
        <a href="#evidence">Evidence</a>
      </nav>

      <section className={styles.researchMetrics} id="overview" aria-label="FY2025 reviewed metrics">
        {latest ? (
          <MetricCard
            eyebrow={`FY${latest.fiscalYear} · reported`}
            emphasis
            label="Revenue"
            value={formatBillions(latest.value)}
          />
        ) : null}
        {netIncome !== null ? (
          <MetricCard
            eyebrow={`FY${fiscalYear} · reported`}
            emphasis
            label="Net Income"
            value={formatBillions(netIncome)}
          />
        ) : null}
        {earningsPerShare ? (
          <>
            <MetricCard
              eyebrow={`FY${earningsPerShare.statement.fiscalYear} · reported`}
              label="Basic EPS"
              value={`$${earningsPerShare.statement.basicEps.value}`}
            />
            <MetricCard
              eyebrow={`FY${earningsPerShare.statement.fiscalYear} · reported`}
              label="Diluted EPS"
              value={`$${earningsPerShare.statement.dilutedEps.value}`}
            />
          </>
        ) : null}
      </section>

      {!latest && !incomeStatement && !earningsPerShare ? (
        <section className={styles.researchUnavailable} role="status">
          <p className={styles.kicker}>Data unavailable</p>
          <h2>No reviewed financial values are displayed.</h2>
          <p>{revenueData.dataError ?? "The local FinPath API could not be reached."}</p>
        </section>
      ) : null}

      <section className={styles.researchGrid}>
        <article className={styles.revenueResearch} id="revenue-history">
          <header className={styles.researchSectionHeading}>
            <div>
              <p className={styles.kicker}>Annual record</p>
              <h2>Revenue history</h2>
            </div>
            <span>{overview?.metric.currency ?? "USD"}</span>
          </header>

          {series.length ? (
            <div className={styles.revenueCurve} aria-label="Annual Revenue history">
              <svg aria-hidden="true" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                <defs>
                  <linearGradient id="prototype-revenue-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#2b8fe8" stopOpacity="0.24" />
                    <stop offset="1" stopColor="#2b8fe8" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {[0, 0.5, 1].map((ratio) => (
                  <line
                    className={styles.revenueGridline}
                    key={ratio}
                    x1={chartLeft}
                    x2={chartLeft + plotWidth}
                    y1={chartTop + plotHeight * ratio}
                    y2={chartTop + plotHeight * ratio}
                  />
                ))}
                <path className={styles.revenueArea} d={revenueArea} />
                <polyline className={styles.revenueLine} points={revenueLine} />
                {revenuePoints.map((point) => (
                  <circle
                    className={styles.revenuePoint}
                    cx={point.x}
                    cy={point.y}
                    key={point.fiscalYear}
                    r="5"
                  />
                ))}
              </svg>
              <ol>
                {series.map((fact) => (
                  <li key={fact.fiscalYear}>
                    <strong>{formatBillions(fact.value)}</strong>
                    <small>FY{fact.fiscalYear}</small>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <p className={styles.sectionUnavailable}>Revenue history is unavailable.</p>
          )}

          {latest ? (
            <footer>
              <span>Year ended {latest.endDate}</span>
              <a href={latest.sourceUrl} rel="noreferrer" target="_blank">
                SEC {latest.form} <span aria-hidden="true">↗</span>
              </a>
            </footer>
          ) : null}
        </article>

        <aside className={styles.incomeLines} aria-labelledby="income-lines-heading">
          <header className={styles.researchSectionHeading}>
            <div>
              <p className={styles.kicker}>Income statement</p>
              <h2 id="income-lines-heading">Selected reported lines</h2>
            </div>
          </header>
          <dl>
            <div><dt>Gross margin</dt><dd>{grossMargin === null ? "Unavailable" : formatBillions(grossMargin)}</dd></div>
            <div><dt>Operating income</dt><dd>{operatingIncome === null ? "Unavailable" : formatBillions(operatingIncome)}</dd></div>
            <div><dt>Income before provision for income taxes</dt><dd>{incomeBeforeTax === null ? "Unavailable" : formatBillions(incomeBeforeTax)}</dd></div>
            <div><dt>Net income</dt><dd>{netIncome === null ? "Unavailable" : formatBillions(netIncome)}</dd></div>
          </dl>
          <Link href={`/learn/company-analysis/profit${selectedQuery}`}>
            Learn how these lines connect <span aria-hidden="true">→</span>
          </Link>
        </aside>
      </section>

      <section className={styles.researchLowerGrid}>
        <article className={styles.positionResearch} id="financial-position">
          <header className={styles.researchSectionHeading}>
            <div>
              <p className={styles.kicker}>Reporting-date snapshot</p>
              <h2>Financial position</h2>
            </div>
            {balanceSheet ? <span>{balanceSheet.statement.asOfDate}</span> : null}
          </header>
          {balanceSheet ? (
            <dl>
              <div><dt>Total assets</dt><dd>{formatBillions(balanceSheet.statement.assets.value)}</dd></div>
              <div><dt>Total liabilities</dt><dd>{formatBillions(balanceSheet.statement.liabilities.value)}</dd></div>
              <div><dt>Shareholders&apos; equity</dt><dd>{formatBillions(balanceSheet.statement.equity.value)}</dd></div>
              <div><dt>Cash and cash equivalents</dt><dd>{formatBillions(balanceSheet.statement.cashAndCashEquivalents.value)}</dd></div>
              <div><dt>FinPath simple borrowings</dt><dd>{formatBillions(balanceSheet.statement.simpleBorrowings.value)}</dd></div>
            </dl>
          ) : (
            <p className={styles.sectionUnavailable}>Reviewed Balance Sheet unavailable.</p>
          )}
          <Link href={`/learn/company-analysis/balance-sheet${selectedQuery}`}>
            Understand the Balance Sheet <span aria-hidden="true">→</span>
          </Link>
        </article>

        <article className={styles.evidenceResearch} id="evidence">
          <p className={styles.kicker}>Evidence</p>
          <h2>Trace the record to its filing.</h2>
          <p>
            FinPath keeps the fiscal period, filing identity and official source
            beside the numbers rather than treating evidence as a separate product.
          </p>
          <dl>
            <div><dt>Company</dt><dd>{company.name}</dd></div>
            <div><dt>Fiscal year</dt><dd>FY{fiscalYear}</dd></div>
            {incomeStatement ? (
              <>
                <div><dt>Filed</dt><dd>{incomeStatement.statement.filedAt}</dd></div>
                <div><dt>Accession</dt><dd>{incomeStatement.statement.accession}</dd></div>
              </>
            ) : null}
          </dl>
          {statementSourceUrl ? (
            <a href={statementSourceUrl} rel="noreferrer" target="_blank">
              Open official SEC filing <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <strong>Official source link unavailable.</strong>
          )}
        </article>

        <article className={styles.valuationDiscipline}>
          <p className={styles.kicker}>Valuation</p>
          <strong>Not assessed</strong>
          <h2>No verified market price is connected.</h2>
          <p>
            Without a date-aligned price, FinPath does not show a current Market
            Cap or P/E. That blank is intentional.
          </p>
          <Link href="/prototype/visual-redesign/market-cap">
            Open the Learning Sandbox <span aria-hidden="true">→</span>
          </Link>
        </article>

        <aside className={styles.researchLearning}>
          <p className={styles.kicker}>Need an explanation?</p>
          <h2>Move from the record into Learn.</h2>
          <p>Use the same company context without turning Explore into a lesson page.</p>
          <nav aria-label="Learn with Apple">
            <Link href={`/learn/company-analysis/revenue${selectedQuery}`}>Revenue <span>Where income starts →</span></Link>
            <Link href={`/learn/company-analysis/profit${selectedQuery}`}>Profit <span>Where costs lead →</span></Link>
            <Link href={`/learn/company-analysis/balance-sheet${selectedQuery}`}>Balance Sheet <span>What it owns and owes →</span></Link>
            <Link href={`/learn/company-analysis/eps-and-share-count${selectedQuery}`}>Per Share <span>How earnings reach each share →</span></Link>
          </nav>
        </aside>
      </section>

      {latest ? (
        <p className={styles.researchFootnote}>
          Latest displayed Revenue: {formatBillions(latest.value, true)} · exact stored value {latest.value.toLocaleString("en-US")} USD.
        </p>
      ) : null}
    </div>
  );
}
