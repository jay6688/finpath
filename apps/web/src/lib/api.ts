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

export class FinPathApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FinPathApiError";
  }
}

export async function getCompanyOverview(ticker: string): Promise<CompanyOverview> {
  const apiBaseUrl = process.env.FINPATH_API_BASE_URL ?? "http://127.0.0.1:8000";
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
