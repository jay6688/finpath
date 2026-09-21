import type {
  CompanyEarningsPerShare,
  EarningsPerShareVerification,
  ReportedEarningsPerShare,
  ReportedWeightedAverageShares,
} from "@/lib/api";

type Props = {
  basis: "basic" | "diluted";
  response: CompanyEarningsPerShare;
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

function FactDetails({
  eps,
  shares,
}: {
  eps: ReportedEarningsPerShare;
  shares: ReportedWeightedAverageShares;
}) {
  return (
    <dl className="eps-evidence__facts">
      <div>
        <dt>{shares.reportedLabel}</dt>
        <dd>{exactInteger.format(shares.value)} shares</dd>
        <small>{shares.taxonomyTag}</small>
      </div>
      <div>
        <dt>{eps.reportedLabel}</dt>
        <dd>${eps.value} per share</dd>
        <small>{eps.taxonomyTag} · {eps.unit}</small>
      </div>
    </dl>
  );
}

function Verification({
  verification,
}: {
  verification: EarningsPerShareVerification;
}) {
  return (
    <section className="eps-evidence__verification" aria-label={`${verification.basis} EPS verification`}>
      <p className="eyebrow">FinPath verification</p>
      <p>
        This division checks the company-reported EPS. It does not turn EPS into
        a FinPath-derived financial metric.
      </p>
      <p className="eps-evidence__formula">
        <span>{exactInteger.format(verification.numerator)} USD</span>
        <span aria-hidden="true">÷</span>
        <span>{exactInteger.format(verification.denominator)} shares</span>
      </p>
      <dl className="eps-evidence__result">
        <div>
          <dt>High-precision result before 2-decimal rounding</dt>
          <dd>${verification.unroundedResult} per share</dd>
        </div>
        <div>
          <dt>Rounded to 2 decimals</dt>
          <dd>${verification.roundedResult} per share</dd>
        </div>
        <div>
          <dt>Company-reported EPS</dt>
          <dd>${verification.reportedResult} per share · match</dd>
        </div>
      </dl>
    </section>
  );
}

export function EpsEvidenceInspector({ basis, response }: Props) {
  const { company, dataStatus, statement } = response;
  const shares = basis === "basic"
    ? statement.basicWeightedAverageShares
    : statement.dilutedWeightedAverageShares;
  const eps = basis === "basic" ? statement.basicEps : statement.dilutedEps;
  const verification = basis === "basic"
    ? statement.basicVerification
    : statement.dilutedVerification;
  const title = basis === "basic" ? "Basic EPS" : "Diluted EPS";

  return (
    <details className="eps-evidence">
      <summary>
        <span>Inspect reported {title} evidence</span>
        <small>Reported facts + verification</small>
      </summary>
      <div className="eps-evidence__body">
        <header>
          <p className="eyebrow">Company-reported EPS</p>
          <h3>{title}: ${eps.value} per share</h3>
          <p>
            {company.name} reported the earnings input, weighted-average share
            count, and EPS. FinPath independently checks the division below.
          </p>
        </header>

        <dl className="eps-evidence__numerator">
          <div>
            <dt>{statement.earningsNumerator.reportedLabel}</dt>
            <dd>{exactInteger.format(statement.earningsNumerator.value)} USD</dd>
            <small>{statement.earningsNumerator.taxonomyTag} · USD</small>
          </div>
        </dl>
        <FactDetails eps={eps} shares={shares} />
        <Verification verification={verification} />

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
            <div><dt>Period</dt><dd>FY{statement.fiscalYear} · {formatDate(statement.startDate)} to {formatDate(statement.endDate)}</dd></div>
            <div><dt>Filing</dt><dd>Annual Form {statement.form} · filed {formatDate(statement.filedAt)}</dd></div>
            <div><dt>Accession</dt><dd>{statement.accession}</dd></div>
            <div><dt>Retrieved</dt><dd>{new Date(dataStatus.retrievedAt).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}</dd></div>
          </dl>
          <a href={statement.sourceUrl} rel="noreferrer" target="_blank">
            Open SEC filing index ↗
          </a>
        </details>
      </div>
    </details>
  );
}
