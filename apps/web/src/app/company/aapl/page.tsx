import type { Metadata } from "next";
import Link from "next/link";

import { RevenueExactRecords } from "@/components/revenue-exact-records";
import { RevenueMetricSnapshot } from "@/components/revenue-metric-snapshot";
import { getAppleRevenueData } from "@/lib/apple-revenue-data";

export const metadata: Metadata = {
  title: "Apple Company Research",
  description: "Explore Apple's real Revenue record and SEC provenance.",
};

export const dynamic = "force-dynamic";

export default async function AppleCompanyPage() {
  const data = await getAppleRevenueData();

  return (
    <div className="company-shell explore-company-shell">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span>Explore</span>
        <span aria-hidden="true">/</span>
        <strong>Apple Inc.</strong>
      </nav>

      <header className="company-header">
        <div>
          <p className="eyebrow">Company research</p>
          <h1>{data.overview?.company.name ?? "Apple Inc."}</h1>
          <p className="company-header__meta">
            AAPL · Nasdaq · SEC CIK {data.overview?.company.cik ?? "0000320193"}
          </p>
        </div>
      </header>

      <section className="explore-revenue" aria-labelledby="explore-revenue-heading">
        <div className="metric-column">
          <RevenueMetricSnapshot {...data} headingId="explore-revenue-heading" />

          {data.overview ? <RevenueExactRecords overview={data.overview} /> : null}
        </div>

        <aside className="research-learning-links" aria-labelledby="research-learning-heading">
          <p className="eyebrow">Learn with this record</p>
          <h2 id="research-learning-heading">Want the concept explained?</h2>
          <p>
            Explore shows Apple&apos;s reported record. Learn guides you through
            what the numbers mean and how to compare them.
          </p>
          <Link href="/learn/company-analysis/revenue">
            Learn Revenue <span aria-hidden="true">→</span>
          </Link>
          <Link href="/learn/company-analysis/revenue-growth">
            Learn Revenue Growth <span aria-hidden="true">→</span>
          </Link>
        </aside>
      </section>

    </div>
  );
}
