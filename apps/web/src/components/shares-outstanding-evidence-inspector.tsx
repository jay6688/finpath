import type { CompanySharesOutstanding } from "@/lib/api";

type Props = {
  response: CompanySharesOutstanding;
};

const exactInteger = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function SharesOutstandingEvidenceInspector({ response }: Props) {
  const { company, dataStatus, fact } = response;

  return (
    <details className="eps-evidence shares-evidence">
      <summary>
        <span>Inspect reported shares evidence</span>
        <small>Point-in-time SEC fact</small>
      </summary>
      <div className="eps-evidence__body">
        <header>
          <p className="eyebrow">Company reported</p>
          <h3>{fact.reportedLabel}</h3>
          <p>
            {company.name} reported {exactInteger.format(fact.value)} shares as
            of {formatDate(fact.asOfDate)}. This is an instant fact, not a
            weighted average across the year.
          </p>
        </header>

        <dl className="eps-evidence__facts shares-evidence__facts">
          <div>
            <dt>Exact share count</dt>
            <dd>{exactInteger.format(fact.value)} shares</dd>
            <small>Unit: {fact.unit}</small>
          </div>
          <div>
            <dt>Taxonomy</dt>
            <dd>dei:EntityCommonStockSharesOutstanding</dd>
            <small>{fact.taxonomyLabel}</small>
          </div>
        </dl>

        {dataStatus.state === "stale" ? (
          <p className="evidence-stale" role="status">
            SEC is temporarily unavailable. FinPath is using its last eligible
            cached public filing data.
          </p>
        ) : null}

        <details className="eps-evidence__source">
          <summary>Source details</summary>
          <dl>
            <div><dt>Company</dt><dd>{company.name} · {company.ticker}</dd></div>
            <div><dt>Context</dt><dd>FY{fact.fiscalYear} · as of {formatDate(fact.asOfDate)}</dd></div>
            <div><dt>Filing</dt><dd>Annual Form {fact.form} · filed {formatDate(fact.filedAt)}</dd></div>
            <div><dt>Accession</dt><dd>{fact.accession}</dd></div>
            <div><dt>Retrieved</dt><dd>{new Date(dataStatus.retrievedAt).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}</dd></div>
          </dl>
          <a href={fact.sourceUrl} rel="noreferrer" target="_blank">
            Open SEC filing index ↗
          </a>
        </details>
      </div>
    </details>
  );
}
