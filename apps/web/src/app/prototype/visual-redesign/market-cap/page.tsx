import type { Metadata } from "next";

import { PrototypeFrame } from "@/components/visual-prototype/prototype-frame";
import { StageZeroMarketCap } from "@/components/visual-prototype/stage-zero-market-cap";
import {
  getCompanySharesOutstanding,
  getSupportedCompanies,
  type CompanySharesOutstanding,
} from "@/lib/api";
import {
  MarketCapLearningError,
  validateSharesOutstandingForLesson,
} from "@/lib/market-cap-learning";

export const metadata: Metadata = {
  title: "Stage 0 Market Cap Sandbox Prototype",
  description:
    "Local-only visual prototype using reviewed shares and an imaginary learner price.",
};

export const dynamic = "force-dynamic";

export default async function VisualRedesignMarketCapPrototype() {
  let response: CompanySharesOutstanding | null = null;
  let dataError: string | null = null;

  try {
    const company = (await getSupportedCompanies()).find(
      (candidate) =>
        candidate.ticker === "AAPL" && candidate.capabilities.sharesOutstanding,
    );

    if (!company) {
      throw new MarketCapLearningError(
        "Apple is not available with reviewed Shares Outstanding data.",
      );
    }

    response = validateSharesOutstandingForLesson(
      await getCompanySharesOutstanding(
        company.ticker,
        company.reviewedFiscalYear,
      ),
      company,
    );
  } catch (error) {
    dataError =
      error instanceof Error
        ? error.message
        : "Reviewed Shares Outstanding data is unavailable.";
  }

  return (
    <PrototypeFrame active="sandbox" tone="learn">
      {response ? (
        <StageZeroMarketCap response={response} />
      ) : (
        <section className="prototypeDataUnavailable" role="status">
          <p>Market Cap Sandbox unavailable</p>
          <h1>Reviewed Apple Shares Outstanding could not be loaded.</h1>
          <p>{dataError}</p>
          <p>No share count, price or Market Cap is substituted.</p>
        </section>
      )}
    </PrototypeFrame>
  );
}
