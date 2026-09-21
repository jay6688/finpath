import type {
  CompanyEarningsPerShare,
  EarningsPerShareVerification,
  ReportedEarningsAmount,
  ReportedEarningsPerShare,
  ReportedWeightedAverageShares,
  SupportedCompany,
} from "./api.ts";

export class EarningsPerShareDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EarningsPerShareDataError";
  }
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const accessionPattern = /^\d{10}-\d{2}-\d{6}$/;
const decimalPattern = /^-?\d+\.\d{2}$/;
const exactDecimalPattern = /^-?\d+(?:\.\d+)?$/;

type ReviewedIdentity = {
  cik: string;
  fiscalYear: number;
  startDate: string;
  endDate: string;
  filedAt: string;
};

const reviewedIdentities = new Map<string, ReviewedIdentity>([
  ["0000320193-25-000079", { cik: "0000320193", fiscalYear: 2025, startDate: "2024-09-29", endDate: "2025-09-27", filedAt: "2025-10-31" }],
  ["0001193125-26-323660", { cik: "0000789019", fiscalYear: 2026, startDate: "2025-07-01", endDate: "2026-06-30", filedAt: "2026-07-29" }],
  ["0000104169-26-000055", { cik: "0000104169", fiscalYear: 2026, startDate: "2025-02-01", endDate: "2026-01-31", filedAt: "2026-03-13" }],
]);

export function validateEarningsPerShareForLesson(
  response: CompanyEarningsPerShare,
  company: Pick<
    SupportedCompany,
    "cik" | "name" | "reviewedFiscalYear" | "ticker"
  >,
): CompanyEarningsPerShare {
  const { statement } = response;
  const identity = reviewedIdentities.get(statement.accession);
  if (
    response.company.ticker !== company.ticker ||
    response.company.cik !== company.cik ||
    response.company.name !== company.name
  ) {
    throw new EarningsPerShareDataError(
      "The EPS response does not match the selected reviewed company.",
    );
  }
  if (
    !identity ||
    identity.cik !== company.cik ||
    identity.fiscalYear !== statement.fiscalYear ||
    identity.startDate !== statement.startDate ||
    identity.endDate !== statement.endDate ||
    identity.filedAt !== statement.filedAt ||
    statement.fiscalYear !== company.reviewedFiscalYear ||
    !datePattern.test(statement.startDate) ||
    !datePattern.test(statement.endDate) ||
    statement.startDate > statement.endDate ||
    !datePattern.test(statement.filedAt) ||
    !accessionPattern.test(statement.accession) ||
    !["10-K", "10-K/A"].includes(statement.form) ||
    statement.currency !== "USD"
  ) {
    throw new EarningsPerShareDataError(
      "The EPS response does not match the reviewed annual filing context.",
    );
  }
  requireSafeSecFilingIndex(statement.sourceUrl, company.cik, statement.accession);
  requireAmount(statement.earningsNumerator);
  requireShares(statement.basicWeightedAverageShares, "basic-weighted-average-shares");
  requireShares(statement.dilutedWeightedAverageShares, "diluted-weighted-average-shares");
  requireEps(statement.basicEps, "basic-eps");
  requireEps(statement.dilutedEps, "diluted-eps");
  requireVerification(
    statement.basicVerification,
    "basic",
    statement.earningsNumerator.value,
    statement.basicWeightedAverageShares.value,
    statement.basicEps.value,
  );
  requireVerification(
    statement.dilutedVerification,
    "diluted",
    statement.earningsNumerator.value,
    statement.dilutedWeightedAverageShares.value,
    statement.dilutedEps.value,
  );
  return response;
}

function requireAmount(fact: ReportedEarningsAmount): void {
  if (
    fact.evidenceKind !== "reported" ||
    fact.id !== "earnings-numerator" ||
    fact.unit !== "USD" ||
    !Number.isSafeInteger(fact.value) ||
    !fact.taxonomyTag ||
    !fact.reportedLabel
  ) {
    throw new EarningsPerShareDataError("The reviewed earnings numerator is invalid.");
  }
}

function requireShares(
  fact: ReportedWeightedAverageShares,
  id: ReportedWeightedAverageShares["id"],
): void {
  if (
    fact.evidenceKind !== "reported" ||
    fact.id !== id ||
    fact.unit !== "shares" ||
    !Number.isSafeInteger(fact.value) ||
    fact.value <= 0 ||
    !fact.taxonomyTag ||
    !fact.reportedLabel
  ) {
    throw new EarningsPerShareDataError(
      "The reviewed weighted-average share count is invalid.",
    );
  }
}

function requireEps(
  fact: ReportedEarningsPerShare,
  id: ReportedEarningsPerShare["id"],
): void {
  if (
    fact.evidenceKind !== "reported" ||
    fact.id !== id ||
    fact.unit !== "USD/share" ||
    !decimalPattern.test(fact.value) ||
    !fact.taxonomyTag ||
    !fact.reportedLabel
  ) {
    throw new EarningsPerShareDataError("The company-reported EPS fact is invalid.");
  }
}

function requireVerification(
  verification: EarningsPerShareVerification,
  basis: EarningsPerShareVerification["basis"],
  numerator: number,
  denominator: number,
  reportedEps: string,
): void {
  if (
    verification.evidenceKind !== "verification" ||
    verification.basis !== basis ||
    verification.numerator !== numerator ||
    verification.denominator !== denominator ||
    !exactDecimalPattern.test(verification.unroundedResult) ||
    verification.roundedResult !== reportedEps ||
    verification.reportedResult !== reportedEps ||
    verification.decimalPlaces !== 2 ||
    verification.roundingMode !== "ROUND_HALF_UP" ||
    verification.matchesReported !== true
  ) {
    throw new EarningsPerShareDataError(
      `The ${basis} EPS verification trail is invalid.`,
    );
  }
}

function requireSafeSecFilingIndex(
  sourceUrl: string,
  cik: string,
  accession: string,
): void {
  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    throw new EarningsPerShareDataError("The EPS source URL is invalid.");
  }
  const expectedPath = `/Archives/edgar/data/${Number(cik)}/${accession.replaceAll("-", "")}/${accession}-index.htm`;
  if (
    parsed.protocol !== "https:" ||
    !["sec.gov", "www.sec.gov"].includes(parsed.hostname.toLowerCase()) ||
    parsed.pathname !== expectedPath
  ) {
    throw new EarningsPerShareDataError(
      "The EPS source URL is not the reviewed SEC filing index.",
    );
  }
}
