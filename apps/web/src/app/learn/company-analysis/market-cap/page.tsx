import type { Metadata } from "next";

import { CompanyExampleSelector } from "@/components/company-example-selector";
import { LessonShell } from "@/components/lesson-shell";
import { MarketCapLearning } from "@/components/market-cap-learning";
import {
  FinPathApiError,
  getCompanySharesOutstanding,
  getSupportedCompanies,
  type CompanySharesOutstanding,
  type SupportedCompany,
} from "@/lib/api";
import { resolveCompanyQuery } from "@/lib/company-selection";
import {
  MarketCapLearningError,
  validateSharesOutstandingForLesson,
} from "@/lib/market-cap-learning";

export const metadata: Metadata = {
  title: "Learn Market Cap",
  description:
    "Use reviewed point-in-time shares and an educational price input to understand Market Cap.",
};
export const dynamic = "force-dynamic";

export default async function MarketCapPage({
  searchParams,
}: PageProps<"/learn/company-analysis/market-cap">) {
  let companies: SupportedCompany[] = [];
  let selectedCompany: SupportedCompany | null = null;
  let response: CompanySharesOutstanding | null = null;
  let dataError: string | null = null;

  try {
    companies = (await getSupportedCompanies()).filter(
      (company) => company.capabilities.sharesOutstanding,
    );
    selectedCompany = resolveCompanyQuery((await searchParams).company, companies);
    response = validateSharesOutstandingForLesson(
      await getCompanySharesOutstanding(
        selectedCompany.ticker,
        selectedCompany.reviewedFiscalYear,
      ),
      selectedCompany,
    );
  } catch (error) {
    dataError =
      error instanceof FinPathApiError || error instanceof MarketCapLearningError
        ? error.message
        : "Reviewed shares-outstanding data is temporarily unavailable.";
  }

  const example = response && selectedCompany
    ? `${response.company.name} · FY${response.fact.fiscalYear} · SEC ${response.fact.form}`
    : "Reviewed SEC shares filing";

  return (
    <LessonShell
      conceptId="market-cap"
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
        <MarketCapLearning
          key={`${response.company.ticker}:${response.fact.accession}:${response.fact.asOfDate}`}
          response={response}
        />
      ) : (
        <div className="data-empty-state profit-data-empty" role="status">
          <div className="data-empty-state__value" aria-hidden="true">—</div>
          <div>
            <strong>Reviewed shares outstanding are not available</strong>
            <p>{dataError}</p>
            <p>
              FinPath will not substitute weighted-average EPS shares or another
              company&apos;s share count when the reviewed SEC fact is unavailable.
            </p>
          </div>
        </div>
      )}
    </LessonShell>
  );
}
