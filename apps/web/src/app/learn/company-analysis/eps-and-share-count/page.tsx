import type { Metadata } from "next";

import { CompanyExampleSelector } from "@/components/company-example-selector";
import { EpsShareCountLearning } from "@/components/eps-share-count-learning";
import { LessonShell } from "@/components/lesson-shell";
import {
  FinPathApiError,
  getCompanyEarningsPerShare,
  getSupportedCompanies,
  type CompanyEarningsPerShare,
  type SupportedCompany,
} from "@/lib/api";
import { resolveCompanyQuery } from "@/lib/company-selection";
import {
  EarningsPerShareDataError,
  validateEarningsPerShareForLesson,
} from "@/lib/earnings-per-share";

export const metadata: Metadata = {
  title: "Learn EPS & Share Count",
  description:
    "Connect reviewed company earnings and weighted-average shares to Basic and Diluted EPS.",
};
export const dynamic = "force-dynamic";

export default async function EpsAndShareCountPage({
  searchParams,
}: PageProps<"/learn/company-analysis/eps-and-share-count">) {
  let companies: SupportedCompany[] = [];
  let selectedCompany: SupportedCompany | null = null;
  let response: CompanyEarningsPerShare | null = null;
  let dataError: string | null = null;

  try {
    companies = (await getSupportedCompanies()).filter(
      (company) => company.capabilities.earningsPerShare,
    );
    selectedCompany = resolveCompanyQuery((await searchParams).company, companies);
    response = validateEarningsPerShareForLesson(
      await getCompanyEarningsPerShare(
        selectedCompany.ticker,
        selectedCompany.reviewedFiscalYear,
      ),
      selectedCompany,
    );
  } catch (error) {
    dataError =
      error instanceof FinPathApiError || error instanceof EarningsPerShareDataError
        ? error.message
        : "Reviewed EPS data is temporarily unavailable.";
  }

  const example = response && selectedCompany
    ? `${response.company.name} · FY${response.statement.fiscalYear} · SEC ${response.statement.form}`
    : "Reviewed annual EPS filing";

  return (
    <LessonShell
      conceptId="eps-and-share-count"
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
        <EpsShareCountLearning response={response} />
      ) : (
        <div className="data-empty-state profit-data-empty" role="status">
          <div className="data-empty-state__value" aria-hidden="true">—</div>
          <div>
            <strong>Reviewed EPS data is not available</strong>
            <p>{dataError}</p>
            <p>
              FinPath will not substitute another company&apos;s numerator, share
              count, or EPS when the reviewed filing contract is unavailable.
            </p>
          </div>
        </div>
      )}
    </LessonShell>
  );
}
