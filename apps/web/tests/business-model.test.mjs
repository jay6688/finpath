import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  businessModelProfiles,
  getBusinessModelProfile,
  validateBusinessModelProfiles,
} from "../src/content/business-models/index.ts";
import {
  createDefaultLearningProgress,
  deriveCurrentConcept,
  deriveHomeRecommendation,
  markConceptsExplored,
  normalizeLearningProgress,
} from "../src/lib/learning-progress.ts";
import { getAdjacentLessons, getLesson, lessonCatalog } from "../src/lib/lesson-catalog.ts";

const readSource = (relativePath) =>
  readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");

const expectedProfiles = {
  AAPL: {
    slug: "aapl",
    name: "Apple Inc.",
    cik: "0000320193",
    fiscalYear: 2025,
    filedAt: "2025-10-31",
    accession: "0000320193-25-000079",
    sourceUrl:
      "https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/0000320193-25-000079-index.htm",
  },
  MSFT: {
    slug: "msft",
    name: "Microsoft Corporation",
    cik: "0000789019",
    fiscalYear: 2026,
    filedAt: "2026-07-29",
    accession: "0001193125-26-323660",
    sourceUrl:
      "https://www.sec.gov/Archives/edgar/data/789019/000119312526323660/0001193125-26-323660-index.htm",
  },
  WMT: {
    slug: "wmt",
    name: "Walmart Inc.",
    cik: "0000104169",
    fiscalYear: 2026,
    filedAt: "2026-03-13",
    accession: "0000104169-26-000055",
    sourceUrl:
      "https://www.sec.gov/Archives/edgar/data/104169/000010416926000055/0000104169-26-000055-index.htm",
  },
};

test("three reviewed profiles preserve exact filing identity and narrative evidence boundaries", () => {
  assert.equal(businessModelProfiles.length, 3);
  assert.deepEqual(
    businessModelProfiles.map((profile) => profile.company.ticker),
    ["AAPL", "MSFT", "WMT"],
  );

  for (const profile of businessModelProfiles) {
    const expected = expectedProfiles[profile.company.ticker];
    assert.ok(expected);
    assert.deepEqual(profile.company, {
      slug: expected.slug,
      ticker: profile.company.ticker,
      name: expected.name,
      cik: expected.cik,
    });
    assert.deepEqual(profile.filing, {
      fiscalYear: expected.fiscalYear,
      form: "10-K",
      filedAt: expected.filedAt,
      accession: expected.accession,
      sourceUrl: expected.sourceUrl,
      primarySection: "Item 1 · Business",
      reviewedAt: "2026-09-26",
    });
    assert.ok(profile.summary.length > 0);
    assert.ok(profile.offerings.length > 0);
    assert.ok(profile.customersOrUsers.length > 0);
    assert.ok(profile.moneyPaths.length > 0);
    assert.ok(profile.businessStructure.groups.length > 0);
    assert.ok(profile.boundaries.length > 0);
    assert.ok(profile.evidence.length > 0);

    for (const evidence of profile.evidence) {
      assert.equal(evidence.sourceType, "SEC filing narrative");
      assert.equal(evidence.company.ticker, profile.company.ticker);
      assert.equal(evidence.company.cik, profile.company.cik);
      assert.equal(evidence.fiscalYear, profile.filing.fiscalYear);
      assert.equal(evidence.form, "10-K");
      assert.equal(evidence.filedAt, profile.filing.filedAt);
      assert.equal(evidence.accession, profile.filing.accession);
      assert.equal(evidence.sourceUrl, expected.sourceUrl);
      assert.match(evidence.section, /Item 1 · Business|Item 8 · Note 1 · Revenue Recognition/);
      assert.ok(evidence.topic.length > 0);
      assert.ok(evidence.paraphrasedFinding.length > 0);
      assert.ok(evidence.paraphrasedFinding.length < 260);
    }
  }

  assert.doesNotMatch(
    JSON.stringify(businessModelProfiles),
    /taxonomyTag|taxonomyNamespace|xbrl/i,
  );
});

test("profiles are company-specific and arbitrary tickers fail instead of borrowing another profile", () => {
  const apple = getBusinessModelProfile("aapl");
  const microsoft = getBusinessModelProfile("MSFT");
  const walmart = getBusinessModelProfile("wmt");

  assert.equal(apple.company.ticker, "AAPL");
  assert.equal(microsoft.company.ticker, "MSFT");
  assert.equal(walmart.company.ticker, "WMT");
  assert.notDeepEqual(apple.offerings, microsoft.offerings);
  assert.notDeepEqual(microsoft.moneyPaths, walmart.moneyPaths);
  assert.doesNotMatch(JSON.stringify(microsoft), /Apple Inc\.|iPhone|Walmart Inc\./);
  assert.doesNotMatch(JSON.stringify(walmart), /Microsoft Corporation|Microsoft 365|iPhone/);
  assert.throws(() => getBusinessModelProfile("NVDA"), /reviewed Business Model profile/i);
});

test("malformed reviewed narrative content is rejected during validation", () => {
  const valid = structuredClone(businessModelProfiles);
  assert.doesNotThrow(() => validateBusinessModelProfiles(valid));

  const cases = [
    (profiles) => { profiles[0].summary = ""; },
    (profiles) => { profiles[0].offerings = []; },
    (profiles) => { profiles[1].moneyPaths = []; },
    (profiles) => { profiles[2].evidence[0].company.ticker = "AAPL"; },
    (profiles) => { profiles[0].filing.sourceUrl = "https://example.com/not-sec"; },
    (profiles) => { profiles[0].offerings[0].evidenceIds = ["missing-evidence"]; },
    (profiles) => { profiles[0].evidence[0].taxonomyTag = "FakeNarrativeFact"; },
  ];

  for (const mutate of cases) {
    const malformed = structuredClone(businessModelProfiles);
    mutate(malformed);
    assert.throws(() => validateBusinessModelProfiles(malformed));
  }
});

test("Lesson 14 extends version-1 progress and now continues to the Capstone", () => {
  const lesson = getLesson("business-model");
  assert.equal(lesson.number, 14);
  assert.equal(lesson.href, "/learn/company-analysis/business-model");
  assert.equal(lessonCatalog.length, 15);
  assert.equal(getAdjacentLessons("pe-ratio").next?.id, "business-model");
  assert.equal(getAdjacentLessons("business-model").previous?.id, "pe-ratio");
  assert.equal(getAdjacentLessons("business-model").next?.id, "capstone");

  let progress = createDefaultLearningProgress();
  for (const existing of lessonCatalog.slice(0, 13)) {
    progress = markConceptsExplored(progress, [existing.id]);
  }
  assert.equal(progress.version, 1);
  assert.equal(deriveCurrentConcept(progress), "business-model");
  assert.equal(deriveHomeRecommendation(progress).conceptId, "business-model");

  const completed = markConceptsExplored(progress, ["business-model"]);
  assert.equal(deriveCurrentConcept(completed), "capstone");
  assert.equal(deriveHomeRecommendation(completed).conceptId, "capstone");
  assert.equal(deriveHomeRecommendation(completed).action, "Continue");

  const restored = normalizeLearningProgress({
    version: 1,
    exploredConceptIds: lessonCatalog.slice(0, 13).map((item) => item.id),
  });
  assert.equal(deriveCurrentConcept(restored), "business-model");
});

test("Lesson 14 uses reviewed local narrative content with durable switching and honest checks", async () => {
  const [page, lesson, stages, selector, navigation, api] = await Promise.all([
    readSource("app/learn/company-analysis/business-model/page.tsx"),
    readSource("components/business-model-learning.tsx"),
    readSource("components/business-model-profile-stages.tsx"),
    readSource("components/company-example-selector.tsx"),
    readSource("components/lesson-sequence-navigation.tsx"),
    readSource("lib/api.ts"),
  ]);
  const production = `${page}\n${lesson}\n${stages}`;

  assert.match(page, /searchParams/);
  assert.match(page, /resolveCompanyQuery/);
  assert.match(page, /CompanyExampleSelector/);
  assert.match(page, /key=/);
  assert.doesNotMatch(page, /getSupportedCompanies|getCompanyFacts|FinPathApiError/);
  assert.match(selector, /router\.push/);
  assert.match(navigation, /"business-model"/);
  assert.match(lesson, /Revenue does not appear by itself/);
  assert.match(lesson, /Item 1 · Business/);
  assert.ok(
    businessModelProfiles.some((profile) =>
      /segment[^]*not (?:automatically )?(?:mean )?(?:one )?product/is.test(
        profile.businessStructure.boundary,
      ),
    ),
  );
  assert.match(lesson, /same Revenue[^]*same way/is);
  assert.match(lesson, /markExplored\(\["business-model"\]\)/);
  assert.match(lesson, /practice, not a score/i);
  assert.doesNotMatch(
    production,
    /buy recommendation|sell recommendation|better business|worse business|guaranteed return/i,
  );
  assert.doesNotMatch(production, /getMarketPrice|MarketCapSnapshot|P\/E calculator/i);
  assert.doesNotMatch(api, /business.model|narrative/i);
});

test("Explore links all reviewed companies to the same company-preserving lesson", async () => {
  const companyPage = await readSource("app/company/[ticker]/page.tsx");
  assert.match(
    companyPage,
    /\/learn\/company-analysis\/business-model\$\{selectedQuery\}/,
  );
  assert.match(companyPage, /Understand how this business makes money/);
});

test("Profit Layers remains covered by Lesson 3 rather than becoming a duplicate lesson", async () => {
  const profitContent = await readFile(
    new URL("../src/content/profit-lessons/aapl-profit-fy2025.json", import.meta.url),
    "utf8",
  );
  const catalog = await readSource("lib/lesson-catalog.ts");

  for (const line of [
    "total-cost-of-sales",
    "gross-margin",
    "total-operating-expenses",
    "operating-income",
    "income-before-income-taxes",
    "income-tax-provision",
    "net-income",
  ]) {
    assert.match(profitContent, new RegExp(line));
  }
  assert.doesNotMatch(catalog, /profit-layers/i);
});
