import type { Metadata } from "next";

import { VisualSystemV2Proof } from "@/components/design-system-v2/proof-surface";
import type { DossierPeriod, LedgerLine } from "@/components/design-system-v2";
import profitContent from "@/content/profit-lessons/aapl-profit-fy2025.json";
import { getCompanyIncomeStatement, getCompanyOverview, getSupportedCompanies } from "@/lib/api";
import { orderRevenueSeries } from "@/lib/history-insight";
import { incomeStatementLineMap, validateProfitStatementForLesson } from "@/lib/profit-learning";

import styles from "./page.module.css";

export const metadata: Metadata = { title: "Internal Design System V2 Proof" };
export const dynamic = "force-dynamic";

const billions = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 3, maximumFractionDigits: 3 });
const compactBillions = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 1, maximumFractionDigits: 1 });

function money(value: number, exact = true) {
  const formatted = `${(exact ? billions : compactBillions).format(Math.abs(value) / 1_000_000_000)}B`;
  return value < 0 ? `(${formatted})` : formatted;
}

export default async function VisualSystemV2Page() {
  try {
    const companies = await getSupportedCompanies();
    const apple = companies.find((company) => company.ticker === "AAPL");
    if (!apple) throw new Error("Apple is not in the reviewed company registry.");

    const [statement, overview] = await Promise.all([
      getCompanyIncomeStatement(apple.ticker, apple.reviewedFiscalYear),
      getCompanyOverview(apple.ticker),
    ]);
    validateProfitStatementForLesson(statement.statement, { fiscalYear: profitContent.fiscalYear, accession: profitContent.accession });
    if (overview.company.ticker !== apple.ticker) throw new Error("The reviewed Revenue history belongs to another company.");
    const revenueSeries = orderRevenueSeries(overview.series);
    if (!revenueSeries.length) throw new Error("Reviewed Revenue history is unavailable.");

    const lines = incomeStatementLineMap(statement.statement.lines);
    const revenue = lines.get("total-net-sales");
    const required = ["total-cost-of-sales", "total-operating-expenses", "other-income-expense-net", "income-tax-provision", "net-income"] as const;
    if (!revenue || required.some((id) => !lines.get(id))) throw new Error("The reviewed income statement is incomplete.");
    const percent = (value: number) => (Math.abs(value) / revenue.value) * 100;
    const ledgerLines: LedgerLine[] = [
      { id: "total-net-sales", label: "Revenue", displayValue: money(revenue.value), percentOfRevenue: 100, role: "revenue" },
      { id: "total-cost-of-sales", label: "Cost of Sales", displayValue: money(lines.get("total-cost-of-sales")!.value), percentOfRevenue: percent(lines.get("total-cost-of-sales")!.value), role: "deduction", before: { label: "Revenue", displayValue: money(revenue.value) }, after: { label: "Gross Margin", displayValue: money(lines.get("gross-margin")!.value) } },
      { id: "total-operating-expenses", label: "Operating Expenses", displayValue: money(lines.get("total-operating-expenses")!.value), percentOfRevenue: percent(lines.get("total-operating-expenses")!.value), role: "deduction", before: { label: "Gross Margin", displayValue: money(lines.get("gross-margin")!.value) }, after: { label: "Operating Income", displayValue: money(lines.get("operating-income")!.value) } },
      { id: "other-income-expense-net", label: "Other Income / (Expense), net", displayValue: money(lines.get("other-income-expense-net")!.value), percentOfRevenue: percent(lines.get("other-income-expense-net")!.value), role: "signed-adjustment", sign: lines.get("other-income-expense-net")!.value < 0 ? "negative" : "positive", before: { label: "Operating Income", displayValue: money(lines.get("operating-income")!.value) }, after: { label: "Income before Tax", displayValue: money(lines.get("income-before-income-taxes")!.value) } },
      { id: "income-tax-provision", label: "Provision for Income Taxes", displayValue: money(lines.get("income-tax-provision")!.value), percentOfRevenue: percent(lines.get("income-tax-provision")!.value), role: "deduction", before: { label: "Income before Tax", displayValue: money(lines.get("income-before-income-taxes")!.value) }, after: { label: "Net Income", displayValue: money(lines.get("net-income")!.value) } },
      { id: "net-income", label: "Net Income", displayValue: money(lines.get("net-income")!.value), percentOfRevenue: percent(lines.get("net-income")!.value), role: "final-total" },
    ];

    const maxRevenue = Math.max(...revenueSeries.map((fact) => fact.value));
    const dossierPeriods: DossierPeriod[] = revenueSeries.map((fact) => ({
      id: String(fact.fiscalYear),
      label: `FY${fact.fiscalYear}`,
      displayValue: money(fact.value, fact.fiscalYear === apple.reviewedFiscalYear),
      normalizedPercent: (fact.value / maxRevenue) * 100,
      passport: { status: "Reported", reportingPeriod: `Year ended ${fact.endDate}`, form: fact.form, filedAt: fact.filedAt, officialSourceUrl: fact.sourceUrl },
    }));

    return <VisualSystemV2Proof ledgerLines={ledgerLines} dossierPeriods={dossierPeriods} />;
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Reviewed proof data is unavailable.";
    return <section className={styles.unavailable} role="status"><p>Internal Design System V2 proof</p><h1>Reviewed data is unavailable.</h1><span>{message}</span><strong>No financial fallback values are substituted.</strong></section>;
  }
}
