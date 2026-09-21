import type { Metadata } from "next";

import { LessonShell } from "@/components/lesson-shell";
import { ThreeStatementsLearning } from "@/components/three-statements-learning";
import {
  FinPathApiError,
  getSupportedCompanies,
  type SupportedCompany,
} from "@/lib/api";
import { getThreeStatementConnectionData } from "@/lib/three-statements-data";
import {
  ThreeStatementDataError,
  type ThreeStatementConnectionData,
} from "@/lib/three-statements";

export const metadata: Metadata = {
  title: "Learn How the Three Statements Connect",
  description:
    "Connect Apple's FY2025 Income Statement, Cash Flow Statement and Balance Sheet without turning relationships into invented metrics.",
};
export const dynamic = "force-dynamic";

export default async function ThreeStatementsConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string | string[] }>;
}) {
  let apple: SupportedCompany | null = null;
  let connectionData: ThreeStatementConnectionData | null = null;
  let dataError: string | null = null;

  try {
    const companies = await getSupportedCompanies();
    apple =
      companies.find(
        (company) =>
          company.ticker === "AAPL" && company.capabilities.threeStatements,
      ) ?? null;
  } catch (error) {
    dataError =
      error instanceof FinPathApiError
        ? error.message
        : "The FinPath API is not available. Start FastAPI and try again.";
  }

  const companyQuery = (await searchParams).company;
  const requestedCompany =
    typeof companyQuery === "string" ? companyQuery.trim().toLowerCase() : null;
  const unsupportedRequest =
    companyQuery !== undefined &&
    (typeof companyQuery !== "string" ||
      !["aapl", "apple"].includes(requestedCompany ?? ""));

  if (unsupportedRequest) {
    dataError =
      "Three Statements Connect is currently reviewed for Apple FY2025 only. FinPath will not substitute Apple data for another company.";
  } else if (apple) {
    try {
      connectionData = await getThreeStatementConnectionData(apple);
    } catch (error) {
      dataError =
        error instanceof FinPathApiError || error instanceof ThreeStatementDataError
          ? error.message
          : "The three reviewed statements are temporarily unavailable.";
    }
  } else if (!dataError) {
    dataError = "Apple does not currently have all three reviewed statements available.";
  }

  const example = connectionData
    ? `${connectionData.company.name} · FY${connectionData.filing.fiscalYear} · SEC ${connectionData.filing.form}`
    : unsupportedRequest
      ? `${typeof companyQuery === "string" ? companyQuery.toUpperCase() : "Requested company"} · not reviewed for this lesson`
      : "Apple Inc. · reviewed FY2025 filing";

  return (
    <LessonShell
      conceptId="three-statements-connect"
      example={example}
      selectedCompany={connectionData && apple ? apple : undefined}
      showExploreCompany={!unsupportedRequest}
    >
      {connectionData ? (
        <ThreeStatementsLearning data={connectionData} />
      ) : (
        <div className="data-empty-state profit-data-empty" role="status">
          <div className="data-empty-state__value" aria-hidden="true">—</div>
          <div>
            <strong>Reviewed three-statement connection is not available</strong>
            <p>{dataError}</p>
            <p>
              This lesson needs one company with all three statements from the same
              validated annual filing.
            </p>
          </div>
        </div>
      )}
    </LessonShell>
  );
}
