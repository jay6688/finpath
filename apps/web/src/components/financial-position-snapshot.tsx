import Link from "next/link";

import type { CompanyBalanceSheet, SupportedCompany } from "@/lib/api";
import {
  buildCashDebtPresentation,
  cashAndSecuritiesLabel,
  type CashDebtPresentation,
} from "@/lib/balance-sheet-learning";
import { EvidenceDataError } from "@/lib/evidence";

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
  let cashDebt: CashDebtPresentation | null = null;
  try {
    cashDebt = buildCashDebtPresentation(balanceSheet);
  } catch (error) {
    if (!(error instanceof EvidenceDataError)) throw error;
  }
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
      {cashDebt ? (
        <CashDebtFigures companyName={company.name} presentation={cashDebt} />
      ) : (
        <p className="financial-position__asset-note">
          FinPath could not build the cash, securities and borrowings comparison
          for this reviewed record.
        </p>
      )}
      <div className="financial-position__links">
        <Link href={`/learn/company-analysis/balance-sheet?company=${company.slug}`}>
          Understand the Balance Sheet <span aria-hidden="true">→</span>
        </Link>
        <Link href={`/learn/company-analysis/cash-and-debt?company=${company.slug}`}>
          Understand Cash & Debt <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}

// Same rules as the Cash & Debt lesson: reported lines and FinPath-derived
// totals are labelled differently, and the total comes only from the shared
// presentation (never a zero or partial stand-in).
function CashDebtFigures({
  companyName,
  presentation,
}: {
  companyName: string;
  presentation: CashDebtPresentation;
}) {
  const total = presentation.cashAndSecuritiesPosition;
  return (
    <div className="financial-position__cash-debt">
      <dl aria-label="Cash and securities">
        <div data-evidence="reported">
          <dt>Cash and cash equivalents</dt>
          <dd>{formatBillions(presentation.cashPosition.amount)}</dd>
          <small>Company reported</small>
        </div>
        {presentation.securityPositions.map((security) => (
          <div data-evidence="reported" data-horizon={security.horizon} key={security.id}>
            <dt>{security.label}</dt>
            <dd>{formatBillions(security.amount)}</dd>
            <small>
              Company reported ·{" "}
              {security.horizon === "non-current"
                ? "non-current: not expected to turn into cash within a year"
                : "current"}
            </small>
          </div>
        ))}
        {presentation.unclassifiedPositions.map((line) => (
          <div data-evidence="reported" data-unclassified="true" key={line.id}>
            <dt>{line.label}</dt>
            <dd>{formatBillions(line.amount)}</dd>
            <small>Company reported · not a reviewed securities line, not added to a total</small>
          </div>
        ))}
        {total ? (
          <div data-evidence="derived" data-total="cash-and-securities">
            <dt>{total.label}</dt>
            <dd>{formatBillions(total.amount)}</dd>
            <small>
              FinPath-derived: Cash and cash equivalents +{" "}
              {presentation.securityPositions.map((security) => security.label).join(" + ")}
            </small>
          </div>
        ) : presentation.cashAndSecuritiesStatus === "unavailable-unclassified-line" ? (
          <div data-evidence="unavailable" data-total="cash-and-securities">
            <dt>{cashAndSecuritiesLabel}</dt>
            <dd>Unavailable</dd>
            <small>FinPath does not calculate this total when a line is not a reviewed securities line.</small>
          </div>
        ) : null}
      </dl>
      <dl aria-label="Borrowings">
        <div data-evidence="derived">
          <dt>FinPath simple borrowings</dt>
          <dd>{formatBillions(presentation.borrowingPosition.amount)}</dd>
          <small>FinPath-derived from reviewed reported borrowing lines</small>
        </div>
      </dl>
      {total?.includesNoncurrent ? (
        <p className="financial-position__asset-note" data-securities="includes-noncurrent">
          The total includes non-current marketable securities, which {companyName}{" "}
          does not expect to turn into cash within a year. It is not the same as
          money available right now.
        </p>
      ) : null}
      {presentation.cashAndSecuritiesStatus === "no-reviewed-securities" ? (
        <p className="financial-position__asset-note" data-securities="none">
          For {companyName}, only cash and cash equivalents are counted. This
          reviewed profile has no marketable-securities or short-term-investment
          line, so FinPath shows no securities total.
        </p>
      ) : null}
    </div>
  );
}
