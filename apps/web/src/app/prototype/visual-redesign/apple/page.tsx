import type { Metadata } from "next";

import { PrototypeFrame } from "@/components/visual-prototype/prototype-frame";
import { StageZeroApple } from "@/components/visual-prototype/stage-zero-apple";
import profitContent from "@/content/profit-lessons/aapl-profit-fy2025.json";
import {
  getCompanyBalanceSheet,
  getCompanyEarningsPerShare,
  getCompanyIncomeStatement,
  getSupportedCompanies,
  type CompanyBalanceSheet,
  type CompanyEarningsPerShare,
  type CompanyIncomeStatement,
} from "@/lib/api";
import { validateBalanceSheetForLesson } from "@/lib/balance-sheet-learning";
import { getCompanyRevenueData } from "@/lib/company-revenue-data";
import { validateEarningsPerShareForLesson } from "@/lib/earnings-per-share";
import { validateProfitStatementForLesson } from "@/lib/profit-learning";

export const metadata: Metadata = {
  title: "Stage 0 Apple Research Prototype",
  description: "Local-only visual prototype using reviewed Apple records.",
};

export const dynamic = "force-dynamic";

export default async function VisualRedesignApplePrototype() {
  const companies = await getSupportedCompanies();
  const company = companies.find((candidate) => candidate.ticker === "AAPL");

  if (!company) {
    return (
      <PrototypeFrame active="explore" tone="explore">
        <section className="prototypeDataUnavailable" role="status">
          <p>Apple prototype unavailable</p>
          <h1>AAPL is not present in the reviewed company registry.</h1>
          <p>No company or financial values are substituted.</p>
        </section>
      </PrototypeFrame>
    );
  }

  const revenueData = await getCompanyRevenueData(company);
  const [incomeResult, balanceResult, earningsResult] = await Promise.allSettled([
    getCompanyIncomeStatement(company.ticker, company.reviewedFiscalYear),
    getCompanyBalanceSheet(company.ticker, company.reviewedFiscalYear),
    getCompanyEarningsPerShare(company.ticker, company.reviewedFiscalYear),
  ]);

  let incomeStatement: CompanyIncomeStatement | null = null;
  let balanceSheet: CompanyBalanceSheet | null = null;
  let earningsPerShare: CompanyEarningsPerShare | null = null;

  if (incomeResult.status === "fulfilled") {
    try {
      validateProfitStatementForLesson(incomeResult.value.statement, {
        accession: profitContent.accession,
        fiscalYear: profitContent.fiscalYear,
      });
      incomeStatement = incomeResult.value;
    } catch {
      incomeStatement = null;
    }
  }

  if (balanceResult.status === "fulfilled") {
    try {
      validateBalanceSheetForLesson(
        balanceResult.value.statement,
        balanceResult.value.company,
      );
      balanceSheet = balanceResult.value;
    } catch {
      balanceSheet = null;
    }
  }

  if (earningsResult.status === "fulfilled") {
    try {
      earningsPerShare = validateEarningsPerShareForLesson(
        earningsResult.value,
        company,
      );
    } catch {
      earningsPerShare = null;
    }
  }

  return (
    <PrototypeFrame active="explore" tone="explore">
      <StageZeroApple
        balanceSheet={balanceSheet}
        company={company}
        earningsPerShare={earningsPerShare}
        incomeStatement={incomeStatement}
        revenueData={revenueData}
      />
    </PrototypeFrame>
  );
}
