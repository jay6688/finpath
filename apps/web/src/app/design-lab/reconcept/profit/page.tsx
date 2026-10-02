import type { Metadata } from "next";

import { ReconceptProfit } from "@/components/reconcept/reconcept-profit";
import { ReconceptShell } from "@/components/reconcept/reconcept-shell";
import profitContent from "@/content/profit-lessons/aapl-profit-fy2025.json";
import { getCompanyIncomeStatement, type CompanyIncomeStatement } from "@/lib/api";
import { validateProfitStatementForLesson } from "@/lib/profit-learning";

export const metadata: Metadata = { title: "Stage 3 Profit Re-Concept" };
export const dynamic = "force-dynamic";

export default async function ReconceptProfitPage() {
  let data: CompanyIncomeStatement | null = null;
  let error = "Reviewed Apple FY2025 Profit data is unavailable.";
  try {
    data = await getCompanyIncomeStatement(profitContent.ticker, profitContent.fiscalYear);
    validateProfitStatementForLesson(data.statement, { fiscalYear: profitContent.fiscalYear, accession: profitContent.accession });
  } catch (cause) {
    data = null;
    if (cause instanceof Error) error = cause.message;
  }
  return (
    <ReconceptShell active="learn" mode="learn">
      {data ? <ReconceptProfit incomeStatement={data} /> : <section className="prototypeDataUnavailable" role="status"><h1>Profit prototype unavailable</h1><p>{error}</p><p>No mock financial values are substituted.</p></section>}
    </ReconceptShell>
  );
}
