import Link from "next/link";

import type { CompanyBalanceSheet, SupportedCompany } from "@/lib/api";

type Props = {
  balanceSheet: CompanyBalanceSheet | null;
  company: SupportedCompany;
};

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

export function FinancialPositionSnapshot({ balanceSheet, company }: Props) {
  if (!balanceSheet) {
    return (
      <section className="financial-position financial-position--unavailable" aria-labelledby="financial-position-heading">
        <div>
          <p className="eyebrow">Financial position</p>
          <h2 id="financial-position-heading">Reviewed Balance Sheet unavailable</h2>
          <p>FinPath could not validate this company&apos;s reviewed annual Balance Sheet record.</p>
        </div>
      </section>
    );
  }

  const { statement } = balanceSheet;
  return (
    <section className="financial-position" aria-labelledby="financial-position-heading">
      <header>
        <div>
          <p className="eyebrow">Financial position</p>
          <h2 id="financial-position-heading">Balance Sheet snapshot</h2>
          <p>As of {formatDate(statement.asOfDate)}</p>
        </div>
        <a href={statement.sourceUrl} rel="noreferrer" target="_blank">SEC {statement.form} ↗</a>
      </header>
      <dl className="financial-position__figures">
        <div><dt>Assets</dt><dd>{formatBillions(statement.assets.value)}</dd></div>
        <div>
          <dt>Liabilities</dt>
          <dd>{formatBillions(statement.liabilities.value)}</dd>
          {statement.liabilities.evidenceKind === "derived" ? <small>FinPath-derived from reported lines</small> : null}
        </div>
        {statement.otherClaims.map((line) => (
          <div key={line.id}><dt>{line.reportedLabel}</dt><dd>{formatBillions(line.value)}</dd></div>
        ))}
        <div><dt>Equity</dt><dd>{formatBillions(statement.equity.value)}</dd></div>
      </dl>
      <p className="financial-position__equation">
        Exact stored values reconcile: Assets = Liabilities
        {statement.otherClaims.length ? " + separately presented claims" : ""} + Equity.
      </p>
      <Link href={`/learn/company-analysis/balance-sheet?company=${company.slug}`}>
        Understand the Balance Sheet <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
