import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CompanyResearchWorkspace } from "@/components/company-research-workspace";
import { EarningsPerShareSnapshot } from "@/components/earnings-per-share-snapshot";
import { FinancialPositionSnapshot } from "@/components/financial-position-snapshot";
import { MetricDossier } from "@/components/metric-dossier";
import { RevenueExactRecords } from "@/components/revenue-exact-records";
import { RevenueMetricSnapshot } from "@/components/revenue-metric-snapshot";
import {
  getCompanyBalanceSheet,
  getCompanyEarningsPerShare,
  getSupportedCompanies,
  type CompanyBalanceSheet,
  type CompanyEarningsPerShare,
  type SupportedCompany,
} from "@/lib/api";
import { validateBalanceSheetForLesson } from "@/lib/balance-sheet-learning";
import { findSupportedCompany } from "@/lib/company-selection";
import {
  getCompanyRevenueData,
  type CompanyRevenueData,
} from "@/lib/company-revenue-data";
import { validateEarningsPerShareForLesson } from "@/lib/earnings-per-share";

export const metadata: Metadata = {
  title: "Company Research",
  description: "Explore a reviewed company Revenue record and SEC provenance.",
};

export const dynamic = "force-dynamic";

function CompanyRegistryUnavailable() {
  return (
    <div className="company-shell explore-company-shell">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/explore">Explore</Link>
      </nav>
      <section className="lesson-unavailable" role="alert">
        <p className="eyebrow">Company data unavailable</p>
        <h1>Company research is temporarily unavailable.</h1>
        <p>
          FinPath could not reach its public-data service. No financial values
          are shown. Try again after the service reconnects.
        </p>
        <Link href="/explore">Return to Explore</Link>
      </section>
    </div>
  );
}

function LegacyCompanyResearch({
  balanceSheet,
  company,
  earningsPerShare,
  revenueData,
}: {
  balanceSheet: CompanyBalanceSheet | null;
  company: SupportedCompany;
  earningsPerShare: CompanyEarningsPerShare | null;
  revenueData: CompanyRevenueData;
}) {
  const selectedQuery = `?company=${company.slug}`;
  return (
    <>
      <section className="company-capabilities" aria-labelledby="coverage-heading">
        <div>
          <p className="eyebrow">Reviewed coverage</p>
          <h2 id="coverage-heading">Available reviewed financial data</h2>
        </div>
        <ul>
          <li><strong>Revenue</strong><span>Available</span></li>
          <li><strong>Revenue Growth</strong><span>Available</span></li>
          <li><strong>Income Statement</strong><span>{company.capabilities.incomeStatement ? "Reviewed" : "Not reviewed for this company yet"}</span></li>
          <li><strong>Cash Flow Statement</strong><span>{company.capabilities.cashFlow ? "Reviewed" : "Not reviewed for this company yet"}</span></li>
          <li><strong>Balance Sheet</strong><span>{company.capabilities.balanceSheet ? "Reviewed" : "Not reviewed for this company yet"}</span></li>
          <li><strong>Cash &amp; Debt</strong><span>{company.capabilities.cashDebt ? "Reviewed" : "Not reviewed for this company yet"}</span></li>
          <li><strong>EPS &amp; Share Count</strong><span>{company.capabilities.earningsPerShare ? "Reviewed" : "Not reviewed for this company yet"}</span></li>
        </ul>
      </section>

      <FinancialPositionSnapshot balanceSheet={balanceSheet} company={company} />
      <EarningsPerShareSnapshot company={company} earningsPerShare={earningsPerShare} />

      <section className="explore-revenue" aria-labelledby="explore-revenue-heading">
        <div className="metric-column">
          <RevenueMetricSnapshot {...revenueData} headingId="explore-revenue-heading" />
          {revenueData.overview ? <RevenueExactRecords overview={revenueData.overview} /> : null}
        </div>
        <aside className="research-learning-links" aria-labelledby="research-learning-heading">
          <p className="eyebrow">Learn with this record</p>
          <h2 id="research-learning-heading">Want the concept explained?</h2>
          <p>
            Explore shows {company.name}&apos;s reported record. Learn guides you
            through what the numbers mean and how annual change is calculated.
          </p>
          <Link href={`/learn/company-analysis/revenue${selectedQuery}`}>Learn Revenue <span aria-hidden="true">→</span></Link>
          <Link href={`/learn/company-analysis/revenue-growth${selectedQuery}`}>Learn Revenue Growth <span aria-hidden="true">→</span></Link>
          <Link href={`/learn/company-analysis/business-model${selectedQuery}`}>Understand how this business makes money <span aria-hidden="true">→</span></Link>
          {company.capabilities.threeStatements ? (
            <Link href="/learn/company-analysis/three-statements-connect">See how the three statements connect <span aria-hidden="true">→</span></Link>
          ) : null}
        </aside>
      </section>
    </>
  );
}

export default async function CompanyResearchPage({
  params,
}: PageProps<"/company/[ticker]">) {
  const { ticker } = await params;
  let companies: Awaited<ReturnType<typeof getSupportedCompanies>>;
  try {
    companies = await getSupportedCompanies();
  } catch {
    return <CompanyRegistryUnavailable />;
  }
  const company = findSupportedCompany(ticker, companies);
  if (!company) notFound();

  const revenueData = await getCompanyRevenueData(company);
  const isApple = company.ticker === "AAPL";
  let balanceSheet: CompanyBalanceSheet | null = null;
  let earningsPerShare: CompanyEarningsPerShare | null = null;

  if (!isApple && company.capabilities.balanceSheet) {
    try {
      balanceSheet = await getCompanyBalanceSheet(company.ticker, company.reviewedFiscalYear);
      validateBalanceSheetForLesson(balanceSheet.statement, balanceSheet.company);
    } catch {
      balanceSheet = null;
    }
  }
  if (!isApple && company.capabilities.earningsPerShare) {
    try {
      earningsPerShare = validateEarningsPerShareForLesson(
        await getCompanyEarningsPerShare(company.ticker, company.reviewedFiscalYear),
        company,
      );
    } catch {
      earningsPerShare = null;
    }
  }

  return (
    <CompanyResearchWorkspace company={company} revenueData={revenueData}>
      {isApple ? (
        <MetricDossier
          company={company}
          dataError={revenueData.dataError}
          records={revenueData.records}
        />
      ) : (
        <LegacyCompanyResearch
          balanceSheet={balanceSheet}
          company={company}
          earningsPerShare={earningsPerShare}
          revenueData={revenueData}
        />
      )}
    </CompanyResearchWorkspace>
  );
}
