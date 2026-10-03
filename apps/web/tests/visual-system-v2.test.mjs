import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (relativePath) =>
  readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("V2 exports the approved financial-domain primitives and object family", async () => {
  const source = await readSource("src/components/design-system-v2/index.ts");
  for (const name of [
    "FinancialObject",
    "FinancialObjectGlyph",
    "ConceptLens",
    "RelationshipTrace",
    "QuantitativeLedger",
    "SignedAdjustmentMarker",
    "MetricDossier",
    "NumberPassport",
  ]) {
    assert.match(source, new RegExp(`\\b${name}\\b`), `missing ${name} export`);
  }

  const glyph = await readSource("src/components/design-system-v2/financial-object.tsx");
  for (const kind of [
    "business",
    "revenue",
    "profit",
    "cash-flow",
    "financial-position",
    "per-share",
    "valuation",
  ]) {
    assert.match(glyph, new RegExp(`\"${kind}\"`), `missing ${kind} object`);
  }
  assert.match(glyph, /<title/);
  assert.match(glyph, /<desc/);
});

test("Concept Lens keeps graph items directly operable as semantic buttons", async () => {
  const source = await readSource("src/components/design-system-v2/concept-lens.tsx");

  assert.match(source, /role="listitem"[^]*<button type="button"/);
  assert.doesNotMatch(source, /<button[^>]+role="listitem"/);
  assert.match(source, /disabled=\{object\.unavailable\}/);
});

test("the proof composes inside the application landmark without nesting main", async () => {
  const source = await readSource("src/components/design-system-v2/proof-surface.tsx");
  assert.doesNotMatch(source, /<main\b/);
});

test("the ledger consumes validated percentages and preserves signed adjustments", async () => {
  const source = await readSource("src/components/design-system-v2/quantitative-ledger.tsx");

  assert.match(source, /percentOfRevenue:\s*number/);
  assert.match(source, /role:[^;]+\"signed-adjustment\"/);
  assert.match(source, /SignedAdjustmentMarker/);
  assert.match(source, /Before/);
  assert.match(source, /Adjustment/);
  assert.match(source, /After/);
  assert.doesNotMatch(source, /revenue\s*[-+*/]\s*(cost|income|expense)/i);
  assert.doesNotMatch(source, /Math\.max\([^,]+,\s*(?:1|2|3|4|5)\s*\)/);
});

test("Passport remains attached to a number and exposes an explicit state machine", async () => {
  const source = await readSource("src/components/design-system-v2/number-passport.tsx");

  assert.match(source, /closed.*opening.*open.*closing/s);
  assert.match(source, /aria-expanded/);
  assert.match(source, /aria-controls/);
  assert.match(source, /unavailable/);
  assert.match(source, /Official source/);
  assert.doesNotMatch(source, /source location[^]*unknown/i);
});

test("Metric Dossier composes meaning, periods, trace, status, Learn, and Passport", async () => {
  const source = await readSource("src/components/design-system-v2/metric-dossier.tsx");

  assert.match(source, /meaning:\s*string/);
  assert.match(source, /periods:/);
  assert.match(source, /role=\"radiogroup\"/);
  assert.match(source, /Reported/);
  assert.match(source, /Learn/);
  assert.match(source, /NumberPassport/);
  assert.doesNotMatch(source, />Number<|>Trend<|>Evidence</);
});

test("V2 has responsive, focus, touch, and reduced-motion contracts", async () => {
  const files = await Promise.all([
    readSource("src/styles/visual-system-v2.css"),
    readSource("src/components/design-system-v2/financial-object.module.css"),
    readSource("src/components/design-system-v2/concept-lens.module.css"),
    readSource("src/components/design-system-v2/quantitative-ledger.module.css"),
    readSource("src/components/design-system-v2/metric-dossier.module.css"),
    readSource("src/components/design-system-v2/number-passport.module.css"),
  ]);
  const css = files.join("\n");

  assert.match(css, /:focus-visible/);
  assert.match(css, /min-(?:block-size|height):\s*(?:44px|2\.75rem)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /@media\s*\(min-width:\s*48rem\)/);
  assert.match(css, /@media\s*\(min-width:\s*75rem\)/);
});

test("the proof route is internal, reviewed-data-backed, and absent from navigation", async () => {
  const [page, navigation] = await Promise.all([
    readSource("src/app/design-lab/visual-system-v2/page.tsx"),
    readSource("src/components/app-navigation.tsx"),
  ]);

  assert.match(page, /getCompanyIncomeStatement/);
  assert.match(page, /getCompanyOverview/);
  assert.match(page, /Promise\.all/);
  assert.match(page, /validateProfitStatementForLesson/);
  assert.doesNotMatch(page, /416_161_000_000|112_010_000_000/);
  assert.doesNotMatch(navigation, /design-lab\/visual-system-v2/);
});

test("the V2 specification records truth boundaries and the Stage 1 disposition", async () => {
  const source = await readSource("../../docs/design/visual-system-v2.md");

  assert.match(source, /OBJECT[^]*TRACE[^]*PASSPORT/);
  assert.match(source, /Scale is Syntax/i);
  assert.match(source, /KEEP[^]*ADAPT[^]*REPLACE[^]*RETIRE/s);
  assert.match(source, /do not calculate financial truth/i);
  assert.match(source, /production pages remain unchanged/i);
});
