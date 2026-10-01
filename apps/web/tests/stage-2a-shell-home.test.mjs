import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  conceptIds,
  createDefaultLearningProgress,
  deriveHomeRecommendation,
} from "../src/lib/learning-progress.ts";
import {
  conceptConnections,
  conceptRelationshipNotice,
  selectHomeCompanies,
} from "../src/lib/home-content.ts";

const readSource = (relativePath) =>
  readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");

test("Home keeps the existing fresh and complete recommendation behavior", () => {
  const fresh = deriveHomeRecommendation(createDefaultLearningProgress());
  const complete = deriveHomeRecommendation({
    version: 1,
    exploredConceptIds: [...conceptIds],
  });

  assert.deepEqual(
    { action: fresh.action, conceptId: fresh.conceptId, href: fresh.href },
    {
      action: "Start",
      conceptId: "revenue",
      href: "/learn/company-analysis/revenue",
    },
  );
  assert.deepEqual(
    { action: complete.action, conceptId: complete.conceptId, href: complete.href },
    {
      action: "Review",
      conceptId: "capstone",
      href: "/learn/company-analysis/capstone",
    },
  );
});

test("Home exposes only reviewed AAPL, MSFT and WMT registry entries", () => {
  const selected = selectHomeCompanies([
    { ticker: "WMT", name: "Walmart Inc." },
    { ticker: "GOOGL", name: "Alphabet Inc." },
    { ticker: "AAPL", name: "Apple Inc." },
    { ticker: "MSFT", name: "Microsoft Corporation" },
    { ticker: "TSLA", name: "Tesla, Inc." },
  ]);

  assert.deepEqual(
    selected.map((company) => company.ticker),
    ["AAPL", "MSFT", "WMT"],
  );
});

test("the Home concept map is explicitly relational rather than lesson order", () => {
  assert.equal(conceptRelationshipNotice, "Concept relationships, not lesson order");
  assert.deepEqual(
    conceptConnections.map((concept) => concept.label),
    ["Business", "Revenue", "Profit", "Cash Flow", "Position", "Per Share", "Valuation"],
  );
  assert.ok(conceptConnections.length < conceptIds.length);
  assert.notDeepEqual(
    conceptConnections.map((concept) => concept.conceptId),
    conceptIds.slice(0, conceptConnections.length),
  );
});

test("the migrated shell preserves landmarks and only the three real destinations", async () => {
  const [layout, navigation, navigationStyles] = await Promise.all([
    readSource("app/layout.tsx"),
    readSource("components/app-navigation.tsx"),
    readSource("components/app-navigation.module.css"),
  ]);

  assert.match(layout, /href="#main-content"/);
  assert.match(layout, /<main[^>]*id="main-content"/);
  assert.match(layout, /<main[^>]*tabIndex=\{-1\}/);
  assert.match(layout, /<LearningProgressProvider>/);
  assert.match(navigation, /href: "\/"[^]*label: "Home"/);
  assert.match(navigation, /href: "\/learn"[^]*label: "Learn"/);
  assert.match(navigation, /href: "\/explore"[^]*label: "Explore"/);
  assert.doesNotMatch(navigation, /Sandbox|prototype\/visual-redesign/);
  assert.match(navigationStyles, /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(navigationStyles, /env\(safe-area-inset-bottom/);
  assert.match(navigationStyles, /\[aria-current="page"\][^]*::after/);
});

test("the migrated Home uses real progress and scoped Stage 1 visual language", async () => {
  const [home, homeStyles, page] = await Promise.all([
    readSource("components/learning-home.tsx"),
    readSource("components/learning-home.module.css"),
    readSource("app/page.tsx"),
  ]);

  assert.match(home, /deriveHomeRecommendation\(progress\)/);
  assert.match(home, /deriveConceptState\(conceptId, progress\)/);
  assert.match(home, /ConceptNode/);
  assert.match(home, /Understand one financial idea at a time/);
  assert.match(home, /Explore reviewed companies/);
  assert.doesNotMatch(home, /prototype\/visual-redesign|StageZero|Sandbox/);
  assert.doesNotMatch(home, /GOOGL|AMZN|TSLA/);
  assert.match(homeStyles, /var\(--fp-/);
  assert.doesNotMatch(homeStyles, /url\(/);
  assert.match(page, /getSupportedCompanies\(\)/);
  assert.match(page, /selectHomeCompanies/);
});
