type SelectableCompany = {
  slug: string;
  ticker: string;
};

export function resolveCompanyQuery<T extends SelectableCompany>(
  value: string | string[] | undefined,
  companies: T[],
): T {
  const fallback =
    companies.find((company) => company.ticker === "AAPL") ?? companies[0];
  if (!fallback) throw new Error("No reviewed companies are available.");
  if (typeof value !== "string") return fallback;

  const normalized = value.trim().toLowerCase();
  return findSupportedCompany(normalized, companies) ?? fallback;
}

export function findSupportedCompany<T extends SelectableCompany>(
  identifier: string,
  companies: T[],
): T | undefined {
  const normalized = identifier.trim().toLowerCase();
  return companies.find(
    (company) =>
      company.slug.toLowerCase() === normalized ||
      company.ticker.toLowerCase() === normalized,
  );
}
