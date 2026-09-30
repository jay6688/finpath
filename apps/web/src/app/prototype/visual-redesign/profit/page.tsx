import type { Metadata } from "next";

import { PrototypeFrame } from "@/components/visual-prototype/prototype-frame";
import { StageZeroProfit } from "@/components/visual-prototype/stage-zero-profit";
import profitContent from "@/content/profit-lessons/aapl-profit-fy2025.json";
import {
  getCompanyIncomeStatement,
  type CompanyIncomeStatement,
} from "@/lib/api";
import { validateProfitStatementForLesson } from "@/lib/profit-learning";

export const metadata: Metadata = {
  title: "Stage 0 Profit Prototype",
  description: "Local-only visual prototype using reviewed Apple FY2025 data.",
};

export const dynamic = "force-dynamic";

export default async function VisualRedesignProfitPrototype() {
  let incomeStatement: CompanyIncomeStatement | null = null;
  let dataError: string | null = null;

  try {
    incomeStatement = await getCompanyIncomeStatement(
      profitContent.ticker,
      profitContent.fiscalYear,
    );
    validateProfitStatementForLesson(incomeStatement.statement, {
      accession: profitContent.accession,
      fiscalYear: profitContent.fiscalYear,
    });
  } catch (error) {
    incomeStatement = null;
    dataError = error instanceof Error ? error.message : "Validated Profit data is unavailable.";
  }

  return (
    <PrototypeFrame active="learn" tone="learn">
      {incomeStatement ? (
        <StageZeroProfit incomeStatement={incomeStatement} />
      ) : (
        <section className="prototypeDataUnavailable" role="status">
          <p>Profit prototype unavailable</p>
          <h1>Validated Apple FY2025 data could not be loaded.</h1>
          <p>{dataError}</p>
          <p>FinPath does not substitute mockup values when the data contract fails.</p>
        </section>
      )}
    </PrototypeFrame>
  );
}
