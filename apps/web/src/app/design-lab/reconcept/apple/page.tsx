import type { Metadata } from "next";

import { ReconceptApple } from "@/components/reconcept/reconcept-apple";
import { ReconceptShell } from "@/components/reconcept/reconcept-shell";
import profitContent from "@/content/profit-lessons/aapl-profit-fy2025.json";
import { getCompanyBalanceSheet, getCompanyEarningsPerShare, getCompanyIncomeStatement, getSupportedCompanies, type CompanyBalanceSheet, type CompanyEarningsPerShare, type CompanyIncomeStatement } from "@/lib/api";
import { validateBalanceSheetForLesson } from "@/lib/balance-sheet-learning";
import { getCompanyRevenueData } from "@/lib/company-revenue-data";
import { validateEarningsPerShareForLesson } from "@/lib/earnings-per-share";
import { validateProfitStatementForLesson } from "@/lib/profit-learning";

export const metadata: Metadata = { title: "Stage 3 Apple Research Re-Concept" };
export const dynamic = "force-dynamic";

export default async function ReconceptApplePage() {
  const companies = await getSupportedCompanies();
  const company = companies.find((candidate) => candidate.ticker === "AAPL");
  if (!company) return <ReconceptShell active="explore" mode="research"><section className="prototypeDataUnavailable" role="status"><h1>Apple is not in the reviewed registry.</h1><p>No substitute company is shown.</p></section></ReconceptShell>;
  const revenueData = await getCompanyRevenueData(company);
  const [incomeResult, balanceResult, earningsResult] = await Promise.allSettled([
    getCompanyIncomeStatement(company.ticker, company.reviewedFiscalYear),
    getCompanyBalanceSheet(company.ticker, company.reviewedFiscalYear),
    getCompanyEarningsPerShare(company.ticker, company.reviewedFiscalYear),
  ]);
  let incomeStatement: CompanyIncomeStatement | null = null;
  let balanceSheet: CompanyBalanceSheet | null = null;
  let earnings: CompanyEarningsPerShare | null = null;
  if (incomeResult.status === "fulfilled") try { validateProfitStatementForLesson(incomeResult.value.statement, { fiscalYear: profitContent.fiscalYear, accession: profitContent.accession }); incomeStatement = incomeResult.value; } catch {}
  if (balanceResult.status === "fulfilled") try { validateBalanceSheetForLesson(balanceResult.value.statement, balanceResult.value.company); balanceSheet = balanceResult.value; } catch {}
  if (earningsResult.status === "fulfilled") try { earnings = validateEarningsPerShareForLesson(earningsResult.value, company); } catch {}
  return <ReconceptShell active="explore" mode="research"><ReconceptApple balanceSheet={balanceSheet} company={company} earnings={earnings} incomeStatement={incomeStatement} revenueData={revenueData} /></ReconceptShell>;
}
