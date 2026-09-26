import type { Metadata } from "next";

import { CompanyExampleSelector } from "@/components/company-example-selector";
import { LessonShell } from "@/components/lesson-shell";
import { PeRatioLearning } from "@/components/pe-ratio-learning";
import {
  FinPathApiError,
  getCompanyEarningsPerShare,
  getSupportedCompanies,
  type CompanyEarningsPerShare,
  type SupportedCompany,
} from "@/lib/api";
import { resolveCompanyQuery } from "@/lib/company-selection";
import {
  PeRatioLearningError,
  validatePeRatioResponse,
} from "@/lib/pe-ratio-learning";

export const metadata: Metadata = {
  title: "Learn P/E Ratio",
  description:
    "Use an educational price and reviewed annual Diluted EPS to understand a simple P/E ratio.",
};
export const dynamic = "force-dynamic";

export default async function PeRatioPage({
  searchParams,
}: PageProps<"/learn/company-analysis/pe-ratio">) {
  let companies: SupportedCompany[] = [];
  let selectedCompany: SupportedCompany | null = null;
  let response: CompanyEarningsPerShare | null = null;
  let dataError: string | null = null;

  try {
    companies = (await getSupportedCompanies()).filter(
      (company) => company.capabilities.earningsPerShare,
    );
    selectedCompany = resolveCompanyQuery((await searchParams).company, companies);
    response = validatePeRatioResponse(
      await getCompanyEarningsPerShare(
        selectedCompany.ticker,
        selectedCompany.reviewedFiscalYear,
      ),
      selectedCompany,
    );
  } catch (error) {
    dataError =
      error instanceof FinPathApiError || error instanceof PeRatioLearningError
        ? error.message
        : "Reviewed positive annual Diluted EPS is temporarily unavailable.";
  }

  const example = response && selectedCompany
    ? `${response.company.name} · FY${response.statement.fiscalYear} · SEC ${response.statement.form}`
    : "Reviewed annual Diluted EPS filing";

  return (
    <LessonShell
      conceptId="pe-ratio"
      example={example}
      exampleSelector={
        selectedCompany && companies.length > 0 ? (
          <CompanyExampleSelector
            companies={companies}
            selectedCompany={selectedCompany}
          />
        ) : undefined
      }
      selectedCompany={selectedCompany ?? undefined}
      showExploreCompany={Boolean(selectedCompany)}
    >
      {response ? (
        <PeRatioLearning
          key={`${response.company.ticker}:${response.statement.accession}:${response.statement.dilutedEps.value}`}
          response={response}
        />
      ) : (
        <div className="data-empty-state profit-data-empty" role="status">
          <div className="data-empty-state__value" aria-hidden="true">—</div>
          <div>
            <strong>Reviewed positive annual Diluted EPS is not available</strong>
            <p>{dataError}</p>
            <p>
              FinPath will not substitute Basic EPS, another period, or another
              company when the reviewed annual Diluted EPS is unavailable.
            </p>
          </div>
        </div>
      )}
    </LessonShell>
  );
}
