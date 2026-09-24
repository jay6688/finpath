import type {
  CompanySharesOutstanding,
  SupportedCompany,
} from "./api.ts";

export class MarketCapLearningError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MarketCapLearningError";
  }
}

type ReviewedSharesIdentity = {
  cik: string;
  fiscalYear: number;
  asOfDate: string;
  filedAt: string;
};

const reviewedIdentities = new Map<string, ReviewedSharesIdentity>([
  ["0000320193-25-000079", { cik: "0000320193", fiscalYear: 2025, asOfDate: "2025-10-17", filedAt: "2025-10-31" }],
  ["0001193125-26-323660", { cik: "0000789019", fiscalYear: 2026, asOfDate: "2026-07-23", filedAt: "2026-07-29" }],
  ["0000104169-26-000055", { cik: "0000104169", fiscalYear: 2026, asOfDate: "2026-03-11", filedAt: "2026-03-13" }],
]);

const pricePattern = /^(\d+)(?:\.(\d{1,2}))?$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const accessionPattern = /^\d{10}-\d{2}-\d{6}$/;

export type EducationalPrice = {
  normalized: string;
  cents: bigint;
};

export type EducationalMarketCap = {
  priceCents: bigint;
  marketCapCents: bigint;
  exactDollars: string;
};

export function parseEducationalPrice(input: string): EducationalPrice {
  const trimmed = input.trim();
  const match = pricePattern.exec(trimmed);
  if (!match) {
    throw new MarketCapLearningError(
      "Enter a positive price with no more than two decimal places.",
    );
  }
  const whole = BigInt(match[1]);
  const fractionalText = (match[2] ?? "").padEnd(2, "0");
  const cents = whole * 100n + BigInt(fractionalText || "0");
  if (cents <= 0n) {
    throw new MarketCapLearningError("Educational price must be greater than zero.");
  }
  return {
    normalized: `${whole}.${fractionalText || "00"}`,
    cents,
  };
}

export function calculateEducationalMarketCap(
  shares: number,
  priceInput: string,
): EducationalMarketCap {
  if (!Number.isSafeInteger(shares) || shares <= 0) {
    throw new MarketCapLearningError(
      "The reviewed share count must be a positive safe integer.",
    );
  }
  const price = parseEducationalPrice(priceInput);
  const marketCapCents = BigInt(shares) * price.cents;
  return {
    priceCents: price.cents,
    marketCapCents,
    exactDollars: formatUsdCents(marketCapCents),
  };
}

export function formatEducationalMarketCapScale(cents: bigint): string {
  const trillionCents = 100_000_000_000_000n;
  const billionCents = 100_000_000_000n;
  if (cents >= trillionCents) {
    return `≈ $${formatRoundedScale(cents, trillionCents)}T`;
  }
  return `≈ $${formatRoundedScale(cents, billionCents)}B`;
}

function formatRoundedScale(value: bigint, scale: bigint): string {
  const thousandths = (value * 1_000n + scale / 2n) / scale;
  const whole = thousandths / 1_000n;
  const fraction = (thousandths % 1_000n).toString().padStart(3, "0");
  return `${whole}.${fraction}`;
}

function formatUsdCents(cents: bigint): string {
  const dollars = cents / 100n;
  const fraction = (cents % 100n).toString().padStart(2, "0");
  const grouped = dollars.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `$${grouped}.${fraction}`;
}

export function validateSharesOutstandingForLesson(
  response: CompanySharesOutstanding,
  company: Pick<
    SupportedCompany,
    "cik" | "name" | "reviewedFiscalYear" | "ticker"
  >,
): CompanySharesOutstanding {
  const { fact } = response;
  const identity = reviewedIdentities.get(fact.accession);
  if (
    response.company.ticker !== company.ticker ||
    response.company.cik !== company.cik ||
    response.company.name !== company.name
  ) {
    throw new MarketCapLearningError(
      "The shares response does not match the selected reviewed company.",
    );
  }
  if (
    !identity ||
    identity.cik !== company.cik ||
    identity.fiscalYear !== fact.fiscalYear ||
    identity.asOfDate !== fact.asOfDate ||
    identity.filedAt !== fact.filedAt ||
    fact.fiscalYear !== company.reviewedFiscalYear ||
    !datePattern.test(fact.asOfDate) ||
    !datePattern.test(fact.filedAt) ||
    !accessionPattern.test(fact.accession) ||
    fact.form !== "10-K" ||
    fact.evidenceKind !== "reported" ||
    fact.id !== "common-shares-outstanding" ||
    fact.taxonomyNamespace !== "dei" ||
    fact.taxonomyTag !== "EntityCommonStockSharesOutstanding" ||
    fact.unit !== "shares" ||
    !fact.taxonomyLabel.trim() ||
    !fact.reportedLabel.trim() ||
    !Number.isSafeInteger(fact.value) ||
    fact.value <= 0 ||
    !["live", "cached", "stale"].includes(response.dataStatus.state) ||
    !Number.isFinite(Date.parse(response.dataStatus.retrievedAt))
  ) {
    throw new MarketCapLearningError(
      "The shares response does not match the reviewed SEC filing context.",
    );
  }
  requireSafeSecFilingIndex(fact.sourceUrl, company.cik, fact.accession);
  return response;
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
    throw new MarketCapLearningError("The shares source URL is invalid.");
  }
  const expectedPath = `/Archives/edgar/data/${Number(cik)}/${accession.replaceAll("-", "")}/${accession}-index.htm`;
  if (
    parsed.protocol !== "https:" ||
    !["sec.gov", "www.sec.gov"].includes(parsed.hostname.toLowerCase()) ||
    parsed.pathname !== expectedPath
  ) {
    throw new MarketCapLearningError(
      "The shares source URL is not the reviewed SEC filing index.",
    );
  }
}
