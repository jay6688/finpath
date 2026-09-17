import type { Metadata } from "next";

import { CompanyExampleSelector } from "@/components/company-example-selector";
import { LessonShell } from "@/components/lesson-shell";
import { RevenueHistory } from "@/components/revenue-history";
import { getSupportedCompanies } from "@/lib/api";
import { resolveCompanyQuery } from "@/lib/company-selection";
import { getCompanyRevenueData } from "@/lib/company-revenue-data";

export const metadata: Metadata = {
  title: "Learn Revenue Growth",
  description: "Compare annual Revenue and understand year-over-year change.",
};

export const dynamic = "force-dynamic";

export default async function RevenueGrowthLessonPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string | string[] }>;
}) {
  const companies = await getSupportedCompanies();
  const selectedCompany = resolveCompanyQuery((await searchParams).company, companies);
  const data = await getCompanyRevenueData(selectedCompany);

  return (
    <LessonShell
      conceptId="revenue-growth"
      example={`${selectedCompany.name} · annual Revenue · SEC 10-K`}
      exampleSelector={
        <CompanyExampleSelector
          companies={companies}
          selectedCompany={selectedCompany}
        />
      }
      selectedCompany={selectedCompany}
    >
      {data.overview ? (
        <RevenueHistory
          overview={data.overview}
          reviewedPresentation={data.reviewedRevenue}
        />
      ) : (
        <div className="data-empty-state" role="status">
          <div className="data-empty-state__value" aria-hidden="true">—</div>
          <div>
            <strong>Revenue history is not available yet</strong>
            <p>{data.dataError}</p>
            <p>FinPath will not replace missing SEC history with hard-coded values.</p>
          </div>
        </div>
      )}
    </LessonShell>
  );
}
