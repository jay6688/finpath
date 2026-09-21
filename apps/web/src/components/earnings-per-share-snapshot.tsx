import Link from "next/link";

import type { CompanyEarningsPerShare, SupportedCompany } from "@/lib/api";

type Props = {
  company: SupportedCompany;
  earningsPerShare: CompanyEarningsPerShare | null;
};

export function EarningsPerShareSnapshot({ company, earningsPerShare }: Props) {
  if (!earningsPerShare) return null;
  const { statement } = earningsPerShare;

  return (
    <section className="eps-snapshot" aria-labelledby="eps-snapshot-heading">
      <header>
        <div>
          <p className="eyebrow">Per-share earnings</p>
          <h2 id="eps-snapshot-heading">EPS snapshot</h2>
          <p>FY{statement.fiscalYear} · company-reported · USD per share</p>
        </div>
        <a href={statement.sourceUrl} rel="noreferrer" target="_blank">
          SEC {statement.form} ↗
        </a>
      </header>
      <dl>
        <div><dt>Basic EPS</dt><dd>${statement.basicEps.value}</dd></div>
        <div><dt>Diluted EPS</dt><dd>${statement.dilutedEps.value}</dd></div>
      </dl>
      <p>
        These are reported per-share accounting figures—not share price or a
        FinPath valuation metric.
      </p>
      <Link href={`/learn/company-analysis/eps-and-share-count?company=${company.slug}`}>
        Understand EPS &amp; Share Count <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
