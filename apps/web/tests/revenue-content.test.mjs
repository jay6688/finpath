import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (relativePath) =>
  readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");

const contentUrl = new URL("../src/content/concepts/revenue.json", import.meta.url);
const content = JSON.parse(await readFile(contentUrl, "utf8"));

test("Revenue content supplies English and Chinese explanations", () => {
  assert.equal(content.conceptId, "revenue");
  assert.ok(content.locales.en.simpleDefinition.length > 40);
  assert.ok(content.locales.en.comparison.includes("Profit"));
  assert.ok(content.locales["zh-CN"].simpleDefinition.length > 20);
});

test("Revenue teaching content carries reviewable provenance", () => {
  assert.ok(content.sources.length >= 2);

  for (const source of content.sources) {
    const url = new URL(source.url);
    assert.equal(url.protocol, "https:");
    assert.ok(source.publisher);
    assert.ok(source.supports.length > 0);
    assert.match(source.accessedAt, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test("Production Revenue teaches one reported top-line reference without becoming an Explore dossier", async () => {
  const [lesson, styles, page] = await Promise.all([
    readSource("components/revenue-learning.tsx"),
    readSource("components/revenue-learning.module.css"),
    readSource("app/learn/company-analysis/revenue/page.tsx"),
  ]);

  assert.match(page, /RevenueLearning/);
  assert.match(page, /completeCurrentOnNext/);
  assert.match(lesson, /Top-line reference/);
  assert.match(lesson, /Reported/);
  assert.match(lesson, /before the costs and expenses that lead to Profit/i);
  assert.match(lesson, /does not mean[^]*collected as cash/is);
  assert.match(lesson, /not Profit[^]*company value or Market Cap/is);
  assert.match(lesson, /revenueEvidence/);
  assert.doesNotMatch(lesson, /selectRevenueRecord|moveRevenueSelection|Number Passport/);
  assert.match(styles, /width:\s*100%/);
  assert.doesNotMatch(`${lesson}\n${styles}`, /416161000000|416\.161B/);
});
