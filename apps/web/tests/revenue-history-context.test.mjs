import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (relativePath) =>
  readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");

test("FY2023 company context preserves reviewed Apple reporting and boundaries", async () => {
  const content = JSON.parse(
    await readSource("content/company-context/aapl-revenue-fy2023.json"),
  );
  const reported = content.reportedContext.join(" ");

  assert.equal(content.previousFiscalYear, 2022);
  assert.equal(content.selectedFiscalYear, 2023);
  assert.match(reported, /weaker foreign currencies against the U\.S\. dollar/i);
  assert.match(reported, /accounted for more than the full year-over-year decrease/);
  assert.match(reported, /lower Mac and iPhone net sales/);
  assert.match(reported, /partly offset by higher Services net sales/);
  assert.equal(content.takeaway, "This was not a one-cause story.");
  assert.match(content.interpretation, /useful next things to investigate/);
  assert.match(content.limitation, /cannot show exactly how much each factor contributed/);
  assert.match(content.limitation, /what happened to Profit/);
  assert.equal(content.sources[0].accession, "0000320193-23-000106");
  assert.equal(new URL(content.sources[0].url).hostname, "www.sec.gov");
});

test("the old mandatory History Insight interaction is retired", async () => {
  const [context, history] = await Promise.all([
    readSource("components/revenue-history-context.tsx"),
    readSource("components/revenue-history.tsx"),
  ]);

  assert.doesNotMatch(context, /useState|<form|type="radio"|markExplored/);
  assert.doesNotMatch(context, /Check my observation|Observable fact|correct|incorrect/i);
  assert.doesNotMatch(context, /Next: Profit|LearningUpNext/);
  assert.match(history, /<RevenueGrowthExplorer/);
  assert.match(history, /<RevenueHistoryContext/);
  assert.match(history, /Exact record/);
});

test("optional context is a collapsed native disclosure with an accessible source", async () => {
  const component = await readSource("components/revenue-history-context.tsx");

  assert.match(component, /<details>/);
  assert.doesNotMatch(component, /<details[^>]+open(?:=|\s|>)/);
  assert.match(component, /\{contextContent\.trigger\}/);
  assert.match(component, /Apple reported/);
  assert.match(component, /FinPath learning takeaway/);
  assert.match(component, /What the annual totals cannot show/);
  assert.match(component, /href=\{source\.url\}/);
  assert.match(component, /target="_blank"/);
});
