import type { CompanyEarningsPerShare, SupportedCompany } from "./api.ts";
import {
  EarningsPerShareDataError,
  validateEarningsPerShareForLesson,
} from "./earnings-per-share.ts";
import { parseEducationalPrice } from "./market-cap-learning.ts";

export class PeRatioLearningError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PeRatioLearningError";
  }
}

export type ReportedPositiveEps = {
  normalized: string;
  cents: bigint;
};

export type EducationalPe = {
  priceCents: bigint;
  epsCents: bigint;
  roundedHundredths: bigint;
  normalizedPrice: string;
  normalizedEps: string;
  displayRatio: string;
};

const reportedEpsPattern = /^(-?)(\d+)\.(\d{2})$/;

export function parseReportedPositiveEps(value: string): ReportedPositiveEps {
  const match = reportedEpsPattern.exec(value);
  if (!match) {
    throw new PeRatioLearningError(
      "Reviewed annual Diluted EPS must be a positive two-decimal value.",
    );
  }
  const absoluteCents = BigInt(match[2]) * 100n + BigInt(match[3]);
  const cents = match[1] === "-" ? -absoluteCents : absoluteCents;
  if (cents === 0n) {
    throw new PeRatioLearningError(
      "P/E is undefined when annual Diluted EPS is zero.",
    );
  }
  if (cents < 0n) {
    throw new PeRatioLearningError(
      "Annual Diluted EPS is negative, so this lesson does not present a conventional positive P/E by hiding the sign.",
    );
  }
  return { normalized: value, cents };
}

export function calculateEducationalPe(
  priceInput: string,
  dilutedEpsValue: string,
): EducationalPe {
  const price = parseEducationalPrice(priceInput);
  const eps = parseReportedPositiveEps(dilutedEpsValue);
  const roundedHundredths = (price.cents * 100n + eps.cents / 2n) / eps.cents;
  const whole = roundedHundredths / 100n;
  const fraction = (roundedHundredths % 100n).toString().padStart(2, "0");
  return {
    priceCents: price.cents,
    epsCents: eps.cents,
    roundedHundredths,
    normalizedPrice: price.normalized,
    normalizedEps: eps.normalized,
    displayRatio: `${whole}.${fraction}×`,
  };
}

export function validatePeRatioResponse(
  response: CompanyEarningsPerShare,
  company: Pick<SupportedCompany, "cik" | "name" | "reviewedFiscalYear" | "ticker">,
): CompanyEarningsPerShare {
  try {
    validateEarningsPerShareForLesson(response, company);
    parseReportedPositiveEps(response.statement.dilutedEps.value);
    return response;
  } catch (error) {
    if (error instanceof PeRatioLearningError) throw error;
    if (error instanceof EarningsPerShareDataError) {
      throw new PeRatioLearningError(error.message);
    }
    throw error;
  }
}
