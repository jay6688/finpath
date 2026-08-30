export type DataState = "live" | "cached" | "stale";

export type AnnualFinancialFact = {
  fiscalYear: number;
  startDate: string;
  endDate: string;
  value: number;
  form: "10-K" | "10-K/A";
  filedAt: string;
  accession: string;
  sourceUrl: string;
};

export type CompanyOverview = {
  company: {
    ticker: string;
    name: string;
    cik: string;
  };
  metric: {
    id: "revenue";
    label: "Revenue";
    currency: "USD";
    taxonomyTag: string;
  };
  series: AnnualFinancialFact[];
  dataStatus: {
    state: DataState;
    retrievedAt: string;
  };
};

export type IncomeStatementLineId =
  | "total-net-sales"
  | "total-cost-of-sales"
  | "gross-margin"
  | "total-operating-expenses"
  | "operating-income"
  | "other-income-expense-net"
  | "income-before-income-taxes"
  | "income-tax-provision"
  | "net-income";

export type IncomeStatementLineRole =
  | "starting-line"
  | "deduction"
  | "subtotal"
  | "signed-adjustment"
  | "final-total";

export type IncomeStatementLine = {
  id: IncomeStatementLineId;
  taxonomyTag: string;
  taxonomyLabel: string;
  value: number;
  role: IncomeStatementLineRole;
};

export type CompanyIncomeStatement = {
  company: CompanyOverview["company"];
  statement: {
    fiscalYear: number;
    startDate: string;
    endDate: string;
    currency: "USD";
    form: "10-K" | "10-K/A";
    filedAt: string;
    accession: string;
    sourceUrl: string;
    lines: IncomeStatementLine[];
  };
  dataStatus: CompanyOverview["dataStatus"];
};

export class FinPathApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FinPathApiError";
  }
}

function getApiBaseUrl(): string {
  const configuredUrl = process.env.FINPATH_API_BASE_URL?.trim();

  if (!configuredUrl) {
    if (process.env.NODE_ENV === "production") {
      throw new FinPathApiError(
        "FINPATH_API_BASE_URL is required for a production deployment.",
      );
    }

    return "http://127.0.0.1:8000";
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(configuredUrl);
  } catch {
    throw new FinPathApiError("FINPATH_API_BASE_URL must be a valid absolute URL.");
  }

  if (process.env.NODE_ENV === "production" && parsedUrl.protocol !== "https:") {
    throw new FinPathApiError("FINPATH_API_BASE_URL must use HTTPS in production.");
  }

  return configuredUrl.replace(/\/$/, "");
}

export async function getCompanyOverview(ticker: string): Promise<CompanyOverview> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(
    `${apiBaseUrl}/v1/companies/${encodeURIComponent(ticker)}/overview`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    let detail = `FinPath API returned ${response.status}.`;
    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload.detail) detail = payload.detail;
    } catch {
      // Keep the status-based message when an upstream proxy returns non-JSON.
    }
    throw new FinPathApiError(detail);
  }

  return (await response.json()) as CompanyOverview;
}

export async function getCompanyIncomeStatement(
  ticker: string,
  fiscalYear: number,
): Promise<CompanyIncomeStatement> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(
    `${apiBaseUrl}/v1/companies/${encodeURIComponent(ticker)}/income-statements/${fiscalYear}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    let detail = `FinPath API returned ${response.status}.`;
    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload.detail) detail = payload.detail;
    } catch {
      // Keep the status-based message when an upstream proxy returns non-JSON.
    }
    throw new FinPathApiError(detail);
  }

  return (await response.json()) as CompanyIncomeStatement;
}
