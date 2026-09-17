import type { Metadata } from "next";

import { CompanyExampleSelector } from "@/components/company-example-selector";
import { LessonShell } from "@/components/lesson-shell";
import { RevenueLessonContent } from "@/components/revenue-lesson-content";
import { getSupportedCompanies } from "@/lib/api";
import { resolveCompanyQuery } from "@/lib/company-selection";
import { getCompanyRevenueData } from "@/lib/company-revenue-data";

export const metadata: Metadata = {
  title: "Learn Revenue",
  description: "Understand Revenue using a real annual SEC filing.",
};

export const dynamic = "force-dynamic";

export default async function RevenueLessonPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string | string[] }>;
}) {
  const companies = await getSupportedCompanies();
  const selectedCompany = resolveCompanyQuery((await searchParams).company, companies);
  const data = await getCompanyRevenueData(selectedCompany);
  const example = data.latest
    ? `${selectedCompany.name} · FY${data.latest.fiscalYear} · SEC ${data.latest.form}`
    : `${selectedCompany.name} · real SEC data`;

  return (
    <LessonShell
      completeCurrentOnNext
      conceptId="revenue"
      example={example}
      exampleSelector={
        <CompanyExampleSelector
          companies={companies}
          selectedCompany={selectedCompany}
        />
      }
      selectedCompany={selectedCompany}
    >
      <RevenueLessonContent {...data} />
    </LessonShell>
  );
}
