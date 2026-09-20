import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RevenueExactRecords } from "@/components/revenue-exact-records";
import { RevenueMetricSnapshot } from "@/components/revenue-metric-snapshot";
import { FinancialPositionSnapshot } from "@/components/financial-position-snapshot";
import {
  getCompanyBalanceSheet,
  getSupportedCompanies,
  type CompanyBalanceSheet,
} from "@/lib/api";
import { validateBalanceSheetForLesson } from "@/lib/balance-sheet-learning";
import { findSupportedCompany } from "@/lib/company-selection";
import { getCompanyRevenueData } from "@/lib/company-revenue-data";

export const metadata: Metadata = {
  title: "Company Research",
  description: "Explore a reviewed company Revenue record and SEC provenance.",
};

export const dynamic = "force-dynamic";

export default async function CompanyResearchPage({
  params,
}: PageProps<"/company/[ticker]">) {
  const { ticker } = await params;
  const companies = await getSupportedCompanies();
  const company = findSupportedCompany(ticker, companies);
  if (!company) notFound();

  const data = await getCompanyRevenueData(company);
  let balanceSheet: CompanyBalanceSheet | null = null;
  if (company.capabilities.balanceSheet) {
    try {
      balanceSheet = await getCompanyBalanceSheet(
        company.ticker,
        company.reviewedFiscalYear,
      );
      validateBalanceSheetForLesson(balanceSheet.statement, balanceSheet.company);
    } catch {
      balanceSheet = null;
    }
  }
  const selectedQuery = `?company=${company.slug}`;

  return (
    <div className="company-shell explore-company-shell">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/explore">Explore</Link>
        <span aria-hidden="true">/</span>
        <strong>{company.name}</strong>
      </nav>

      <header className="company-header">
        <div>
          <p className="eyebrow">Company research</p>
          <h1>{company.name}</h1>
          <p className="company-header__meta">
            {company.ticker} · SEC CIK {company.cik}
          </p>
        </div>
        <Link className="company-header__back" href="/explore">
          All companies →
        </Link>
      </header>

      <section className="company-capabilities" aria-labelledby="coverage-heading">
        <div>
          <p className="eyebrow">Reviewed coverage</p>
          <h2 id="coverage-heading">Available reviewed financial data</h2>
        </div>
        <ul>
          <li><strong>Revenue</strong><span>Available</span></li>
          <li><strong>Revenue Growth</strong><span>Available</span></li>
          <li>
            <strong>Income Statement</strong>
            <span>
              {company.capabilities.incomeStatement
                ? "Reviewed"
                : "Not reviewed for this company yet"}
            </span>
          </li>
          <li>
            <strong>Cash Flow Statement</strong>
            <span>
              {company.capabilities.cashFlow
                ? "Reviewed"
                : "Not reviewed for this company yet"}
            </span>
          </li>
          <li>
            <strong>Balance Sheet</strong>
            <span>
              {company.capabilities.balanceSheet
                ? "Reviewed"
                : "Not reviewed for this company yet"}
            </span>
          </li>
        </ul>
      </section>

      <FinancialPositionSnapshot balanceSheet={balanceSheet} company={company} />

      <section className="explore-revenue" aria-labelledby="explore-revenue-heading">
        <div className="metric-column">
          <RevenueMetricSnapshot {...data} headingId="explore-revenue-heading" />
          {data.overview ? <RevenueExactRecords overview={data.overview} /> : null}
        </div>

        <aside className="research-learning-links" aria-labelledby="research-learning-heading">
          <p className="eyebrow">Learn with this record</p>
          <h2 id="research-learning-heading">Want the concept explained?</h2>
          <p>
            Explore shows {company.name}&apos;s reported record. Learn guides you
            through what the numbers mean and how annual change is calculated.
          </p>
          <Link href={`/learn/company-analysis/revenue${selectedQuery}`}>
            Learn Revenue <span aria-hidden="true">→</span>
          </Link>
          <Link href={`/learn/company-analysis/revenue-growth${selectedQuery}`}>
            Learn Revenue Growth <span aria-hidden="true">→</span>
          </Link>
        </aside>
      </section>
    </div>
  );
}
