import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  validateEarningsPerShareForLesson,
} from "../src/lib/earnings-per-share.ts";
import {
  createDefaultLearningProgress,
  deriveCurrentConcept,
  deriveHomeRecommendation,
  markConceptsExplored,
} from "../src/lib/learning-progress.ts";
import { getAdjacentLessons, getLesson, lessonCatalog } from "../src/lib/lesson-catalog.ts";

const readSource = (relativePath) =>
  readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");

const companies = {
  aapl: { slug: "aapl", ticker: "AAPL", name: "Apple Inc.", cik: "0000320193", reviewedFiscalYear: 2025 },
  msft: { slug: "msft", ticker: "MSFT", name: "Microsoft Corporation", cik: "0000789019", reviewedFiscalYear: 2026 },
  wmt: { slug: "wmt", ticker: "WMT", name: "Walmart Inc.", cik: "0000104169", reviewedFiscalYear: 2026 },
};

function epsResponse(company = companies.aapl) {
  const apple = company.ticker === "AAPL";
  const microsoft = company.ticker === "MSFT";
  const context = apple
    ? [2025, "2024-09-29", "2025-09-27", "2025-10-31", "0000320193-25-000079", 112_010_000_000, 14_948_500_000, 15_004_697_000, "7.49", "7.46"]
    : microsoft
      ? [2026, "2025-07-01", "2026-06-30", "2026-07-29", "0001193125-26-323660", 133_749_000_000, 7_429_000_000, 7_453_000_000, "18.00", "17.95"]
      : [2026, "2025-02-01", "2026-01-31", "2026-03-13", "0000104169-26-000055", 21_893_000_000, 7_983_000_000, 8_022_000_000, "2.74", "2.73"];
  const [fiscalYear, startDate, endDate, filedAt, accession, numerator, basicShares, dilutedShares, basicEps, dilutedEps] = context;
  const sourceUrl = `https://www.sec.gov/Archives/edgar/data/${Number(company.cik)}/${accession.replaceAll("-", "")}/${accession}-index.htm`;
  const fact = (id, taxonomyTag, reportedLabel, value, unit) => ({
    evidenceKind: "reported", id, taxonomyTag, taxonomyLabel: taxonomyTag,
    reportedLabel, value, unit,
  });
  const verification = (basis, denominator, result) => ({
    evidenceKind: "verification", basis,
    formula: "Earnings numerator ÷ weighted-average shares",
    numerator, denominator, unroundedResult: result, roundedResult: result,
    reportedResult: result, decimalPlaces: 2, roundingMode: "ROUND_HALF_UP",
    matchesReported: true,
  });
  return {
    company: { ticker: company.ticker, name: company.name, cik: company.cik },
    statement: {
      fiscalYear, startDate, endDate, currency: "USD", form: "10-K", filedAt,
      accession, sourceUrl, statementName: "Earnings Per Share",
      earningsNumerator: fact("earnings-numerator", "NetIncomeLoss", "Reviewed earnings", numerator, "USD"),
      basicWeightedAverageShares: fact("basic-weighted-average-shares", "WeightedAverageNumberOfSharesOutstandingBasic", "Weighted-average basic shares", basicShares, "shares"),
      dilutedWeightedAverageShares: fact("diluted-weighted-average-shares", "WeightedAverageNumberOfDilutedSharesOutstanding", "Weighted-average diluted shares", dilutedShares, "shares"),
      basicEps: fact("basic-eps", "EarningsPerShareBasic", "Basic earnings per share", basicEps, "USD/share"),
      dilutedEps: fact("diluted-eps", "EarningsPerShareDiluted", "Diluted earnings per share", dilutedEps, "USD/share"),
      basicVerification: verification("basic", basicShares, basicEps),
      dilutedVerification: verification("diluted", dilutedShares, dilutedEps),
    },
    dataStatus: { state: "cached", retrievedAt: "2026-08-19T00:00:00Z" },
  };
}

test("Lesson 11 now continues to Market Cap without changing progress version", () => {
  const lesson = getLesson("eps-and-share-count");
  assert.equal(lesson.number, 11);
  assert.equal(lesson.href, "/learn/company-analysis/eps-and-share-count");
  assert.equal(lessonCatalog.length, 12);
  assert.equal(getAdjacentLessons("three-statements-connect").next?.id, "eps-and-share-count");
  assert.equal(getAdjacentLessons("eps-and-share-count").next?.id, "market-cap");

  let progress = createDefaultLearningProgress();
  for (const existing of lessonCatalog.slice(0, 10)) {
    progress = markConceptsExplored(progress, [existing.id]);
  }
  assert.equal(progress.version, 1);
  assert.equal(deriveCurrentConcept(progress), "eps-and-share-count");
  assert.equal(deriveHomeRecommendation(progress).href, lesson.href);
});

test("all three reviewed companies pass the same EPS contract", () => {
  for (const company of Object.values(companies)) {
    const response = epsResponse(company);
    assert.doesNotThrow(() => validateEarningsPerShareForLesson(response, company));
    assert.equal(response.statement.basicEps.evidenceKind, "reported");
    assert.equal(response.statement.basicVerification.evidenceKind, "verification");
  }
  assert.equal(epsResponse(companies.wmt).statement.earningsNumerator.value, 21_893_000_000);
});

test("EPS contract fails closed on company, unit, context, source, and evidence mismatch", () => {
  const cases = [];
  const wrongCompany = structuredClone(epsResponse());
  wrongCompany.company.cik = "0000789019";
  cases.push(wrongCompany);
  const wrongUnit = structuredClone(epsResponse());
  wrongUnit.statement.basicWeightedAverageShares.unit = "USD";
  cases.push(wrongUnit);
  const wrongPeriod = structuredClone(epsResponse());
  wrongPeriod.statement.endDate = "2025-09-26";
  cases.push(wrongPeriod);
  const badSource = structuredClone(epsResponse());
  badSource.statement.sourceUrl = "https://example.com/not-sec";
  cases.push(badSource);
  const derivedEps = structuredClone(epsResponse());
  derivedEps.statement.basicEps.evidenceKind = "derived";
  cases.push(derivedEps);

  for (const response of cases) {
    assert.throws(() => validateEarningsPerShareForLesson(response, companies.aapl));
  }
});

test("lesson copy preserves weighted-average, reported-vs-verification, and market boundaries", async () => {
  const [page, lesson, evidence, selector] = await Promise.all([
    readSource("app/learn/company-analysis/eps-and-share-count/page.tsx"),
    readSource("components/eps-share-count-learning.tsx"),
    readSource("components/eps-evidence-inspector.tsx"),
    readSource("components/company-example-selector.tsx"),
  ]);

  assert.match(page, /searchParams/);
  assert.match(page, /CompanyExampleSelector/);
  assert.match(lesson, /weighted-average basic shares/i);
  assert.match(lesson, /not (?:the same as )?(?:a )?share price/i);
  assert.match(lesson, /not automatically the share count[^]*Market Cap/i);
  assert.match(lesson, /same[^]*earnings[^]*share count increased[^]*EPS[^]*decrease/is);
  assert.doesNotMatch(lesson, /Diluted EPS is always lower/i);
  assert.doesNotMatch(`${page}${lesson}`, /stock recommendation|better investment because/i);
  assert.match(evidence, /Company-reported EPS/);
  assert.match(evidence, /FinPath verification/);
  assert.match(evidence, /eps\.unit/);
  assert.match(selector, /router\.push/);
});

test("Explore adds an EPS snapshot and preserves the selected company in its deep link", async () => {
  const [companyPage, snapshot, api] = await Promise.all([
    readSource("app/company/[ticker]/page.tsx"),
    readSource("components/earnings-per-share-snapshot.tsx"),
    readSource("lib/api.ts"),
  ]);

  assert.match(companyPage, /earningsPerShare/);
  assert.match(snapshot, /Basic EPS/);
  assert.match(snapshot, /Diluted EPS/);
  assert.match(snapshot, /eps-and-share-count\?company=\$\{company\.slug\}/);
  assert.doesNotMatch(snapshot, /market price|market cap|P\/E/i);
  assert.match(api, /earnings-per-share/);
});

test("React source contains no hard-coded company EPS or share-count fallback values", async () => {
  const sources = await Promise.all([
    readSource("components/eps-share-count-learning.tsx"),
    readSource("components/eps-evidence-inspector.tsx"),
    readSource("components/earnings-per-share-snapshot.tsx"),
    readSource("app/learn/company-analysis/eps-and-share-count/page.tsx"),
  ]);
  const combined = sources.join("\n");
  assert.doesNotMatch(combined, /112010000000|14948500000|7\.49|17\.95|2\.74/);
});
