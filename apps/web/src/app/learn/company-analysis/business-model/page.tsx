import type { Metadata } from "next";

import { BusinessModelLearning } from "@/components/business-model-learning";
import { CompanyExampleSelector } from "@/components/company-example-selector";
import { LessonShell } from "@/components/lesson-shell";
import {
  businessModelProfiles,
  getBusinessModelProfile,
} from "@/content/business-models";
import { resolveCompanyQuery } from "@/lib/company-selection";

export const metadata: Metadata = {
  title: "Learn Business Models",
  description:
    "Understand what a reviewed company offers, who pays and how money reaches the business.",
};

export default async function BusinessModelPage({
  searchParams,
}: PageProps<"/learn/company-analysis/business-model">) {
  const companies = businessModelProfiles.map((profile) => profile.company);
  const selectedCompany = resolveCompanyQuery((await searchParams).company, companies);
  const profile = getBusinessModelProfile(selectedCompany.ticker);

  return (
    <LessonShell
      conceptId="business-model"
      example={`${selectedCompany.name} · FY${profile.filing.fiscalYear} · SEC ${profile.filing.form}`}
      exampleSelector={
        <CompanyExampleSelector
          companies={companies}
          selectedCompany={selectedCompany}
        />
      }
      selectedCompany={selectedCompany}
    >
      <BusinessModelLearning
        key={`${selectedCompany.ticker}:${profile.filing.accession}`}
        profile={profile}
      />
    </LessonShell>
  );
}
