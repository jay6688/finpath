import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildYearOverYearObservations,
  selectGuidedRevenueObservation,
} from "../src/lib/history-insight.ts";

const series = [
  { fiscalYear: 2021, value: 365817000000 },
  { fiscalYear: 2022, value: 394328000000 },
  { fiscalYear: 2023, value: 383285000000 },
  { fiscalYear: 2024, value: 391035000000 },
  { fiscalYear: 2025, value: 416161000000 },
].map((fact) => ({
  ...fact,
  startDate: "",
  endDate: `${fact.fiscalYear}-09-30`,
  form: "10-K",
  filedAt: "",
  accession: "",
  sourceUrl: "https://www.sec.gov/",
}));

test("calculates every consecutive AAPL Revenue YoY change", () => {
  const observations = buildYearOverYearObservations(series);

  assert.equal(observations.length, 4);
  assert.deepEqual(
    observations.map((observation) => observation.absoluteChange),
    [28511000000, -11043000000, 7750000000, 25126000000],
  );
  assert.equal(observations[1].percentageChange.toFixed(6), "-2.800461");
});

test("the deterministic mixed-series rule selects the FY2023 decline", () => {
  const selected = selectGuidedRevenueObservation(series);

  assert.ok(selected);
  assert.equal(selected.previous.fiscalYear, 2022);
  assert.equal(selected.current.fiscalYear, 2023);
  assert.equal(selected.absoluteChange, -11043000000);
  assert.equal(selected.selectionRule, "largest-decline-in-mixed-series");
});

test("reviewed content keeps source, uncertainty, and continuation boundaries", async () => {
  const contentUrl = new URL(
    "../src/content/history-insights/aapl-revenue-fy2023.json",
    import.meta.url,
  );
  const content = JSON.parse(await readFile(contentUrl, "utf8"));

  assert.equal(content.selectedFiscalYear, 2023);
  assert.equal(content.question.supportedChoiceId, "revenue-declined");
  assert.match(content.unknown, /cannot|whether/i);
  assert.match(content.nextPreview, /^Next: Profit/);
  assert.equal(content.sources[0].accession, "0000320193-23-000106");
  assert.equal(new URL(content.sources[0].url).hostname, "www.sec.gov");
});

test("the interaction gives feedback without a score or a fake Profit link", async () => {
  const component = await readFile(
    new URL("../src/components/revenue-history-insight.tsx", import.meta.url),
    "utf8",
  );

  assert.match(component, /This is practice, not a score/);
  assert.match(component, /Observable fact/);
  assert.match(component, /Apple reported/);
  assert.match(component, /FinPath interpretation/);
  assert.match(component, /Still unknown/);
  assert.match(component, /Preview only\. The Profit lesson is not available yet/);
  assert.doesNotMatch(component, /href=.*profit/i);
});
