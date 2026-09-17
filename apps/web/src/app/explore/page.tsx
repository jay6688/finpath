import type { Metadata } from "next";
import Link from "next/link";

import { getSupportedCompanies } from "@/lib/api";

export const metadata: Metadata = {
  title: "Explore Companies",
  description: "Explore reviewed company financial records and SEC evidence.",
};

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const companies = await getSupportedCompanies();

  return (
    <div className="company-shell explore-directory">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <strong>Explore</strong>
      </nav>

      <header className="explore-directory__header">
        <p className="eyebrow">Explore</p>
        <h1>Research a real company.</h1>
        <p>
          Start with a reviewed financial record. Each company keeps its own
          fiscal period and SEC filing provenance.
        </p>
      </header>

      <div className="explore-directory__list">
        {companies.map((company) => (
          <article className="explore-company-row" key={company.ticker}>
            <div>
              <span>{company.ticker}</span>
              <h2>{company.name}</h2>
              <p>
                Reviewed annual filing · FY{company.reviewedFiscalYear} · SEC CIK{" "}
                {company.cik}
              </p>
            </div>
            <Link href={`/company/${company.slug}`}>
              Explore {company.name.replace(/ (Inc\.|Corporation)$/, "")} →
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
