import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildRevenueGrowthRows,
  formatRevenueGrowthRate,
} from "../src/lib/history-insight.ts";

function fact(fiscalYear, value, suffix = "") {
  return {
    fiscalYear,
    value,
    startDate: `${fiscalYear - 1}-10-01`,
    endDate: `${fiscalYear}-09-30`,
    form: "10-K",
    filedAt: `${fiscalYear}-11-01`,
    accession: `${fiscalYear}${suffix}`,
    sourceUrl: "https://www.sec.gov/",
  };
}

const aaplSeries = [
  fact(2021, 365817000000),
  fact(2022, 394328000000),
  fact(2023, 383285000000),
  fact(2024, 391035000000),
  fact(2025, 416161000000),
];

test("builds the canonical AAPL Revenue Growth history from exact values", () => {
  const rows = buildRevenueGrowthRows(aaplSeries);

  assert.equal(rows.length, 5);
  assert.deepEqual(rows[0], {
    state: "unavailable",
    fiscalYear: 2021,
    current: aaplSeries[0],
    reason: "no-prior-year",
  });

  const available = rows.filter((row) => row.state === "available");
  assert.deepEqual(
    available.map((row) => row.absoluteChange),
    [28511000000, -11043000000, 7750000000, 25126000000],
  );
  assert.deepEqual(
    available.map((row) => row.percentageChange.toFixed(9)),
    ["7.793787604", "-2.800460530", "2.021994078", "6.425511783"],
  );
  assert.deepEqual(
    available.map((row) => formatRevenueGrowthRate(row.percentageChange)),
    ["+7.8%", "−2.8%", "+2.0%", "+6.4%"],
  );
});

test("sorts shuffled input without mutating it", () => {
  const shuffled = [aaplSeries[3], aaplSeries[0], aaplSeries[4], aaplSeries[1], aaplSeries[2]];
  const originalOrder = shuffled.map((item) => item.fiscalYear);
  const rows = buildRevenueGrowthRows(shuffled);

  assert.deepEqual(shuffled.map((item) => item.fiscalYear), originalOrder);
  assert.deepEqual(rows.map((row) => row.fiscalYear), [2021, 2022, 2023, 2024, 2025]);
});

test("does not treat a gap as a year-over-year comparison", () => {
  const rows = buildRevenueGrowthRows([fact(2021, 100), fact(2023, 120)]);

  assert.equal(rows[1].state, "unavailable");
  assert.equal(rows[1].reason, "missing-prior-year");
});

test("does not divide by a zero base, but permits a valid fall to zero", () => {
  const zeroBase = buildRevenueGrowthRows([fact(2021, 0), fact(2022, 100)]);
  assert.equal(zeroBase[1].state, "unavailable");
  assert.equal(zeroBase[1].reason, "zero-base");

  const fallToZero = buildRevenueGrowthRows([fact(2021, 100), fact(2022, 0)]);
  assert.equal(fallToZero[1].state, "available");
  assert.equal(fallToZero[1].percentageChange, -100);
});

test("duplicate years invalidate the year and any comparison using it as a base", () => {
  const firstDuplicate = fact(2022, 110, "a");
  const secondDuplicate = fact(2022, 111, "b");
  const input = [fact(2021, 100), secondDuplicate, fact(2023, 120), firstDuplicate];
  const reversed = [...input].reverse();

  const rows = buildRevenueGrowthRows(input);
  const reversedRows = buildRevenueGrowthRows(reversed);

  assert.equal(rows[1].state, "unavailable");
  assert.equal(rows[1].reason, "duplicate-current-year");
  assert.equal(rows[2].state, "unavailable");
  assert.equal(rows[2].reason, "duplicate-prior-year");
  assert.deepEqual(
    rows.map(({ state, fiscalYear, ...row }) => ({ state, fiscalYear, reason: row.reason })),
    reversedRows.map(({ state, fiscalYear, ...row }) => ({ state, fiscalYear, reason: row.reason })),
  );
});

test("rejects missing, non-finite, negative, and non-numeric Revenue values", () => {
  const invalidValues = [undefined, null, Number.NaN, Number.POSITIVE_INFINITY, -1, "100", true];

  for (const invalidValue of invalidValues) {
    const rows = buildRevenueGrowthRows([
      fact(2021, 100),
      fact(2022, invalidValue),
      fact(2023, 120),
    ]);

    assert.equal(rows[1].state, "unavailable");
    assert.equal(rows[1].reason, "invalid-current-value");
    assert.equal(rows[2].state, "unavailable");
    assert.equal(rows[2].reason, "invalid-prior-value");
  }
});

test("rejects invalid fiscal years instead of comparing a record with itself", () => {
  for (const invalidYear of [Number.NaN, Number.POSITIVE_INFINITY, 2022.5]) {
    const invalidFact = fact(invalidYear, 100);
    const rows = buildRevenueGrowthRows([invalidFact, fact(2021, 90)]);

    assert.equal(rows[0].state, "unavailable");
    assert.equal(rows[0].fiscalYear, null);
    assert.equal(rows[0].reason, "invalid-fiscal-year");
    assert.equal(rows.some((row) => row.state === "available"), false);
  }
});

test("handles empty and one-year histories without inventing growth", () => {
  assert.deepEqual(buildRevenueGrowthRows([]), []);
  assert.deepEqual(buildRevenueGrowthRows([fact(2025, 100)]), [
    {
      state: "unavailable",
      fiscalYear: 2025,
      current: fact(2025, 100),
      reason: "no-prior-year",
    },
  ]);
});

test("formats tiny and unchanged rates without a misleading negative zero", () => {
  assert.equal(formatRevenueGrowthRate(0), "0.0%");
  assert.equal(formatRevenueGrowthRate(-0), "0.0%");
  assert.equal(formatRevenueGrowthRate(0.0001), "+<0.1%");
  assert.equal(formatRevenueGrowthRate(-0.0001), "−<0.1%");
});

test("uses conventional half-up display rounding without changing the raw rate", () => {
  assert.equal(formatRevenueGrowthRate(3.05), "+3.1%");
  assert.equal(formatRevenueGrowthRate(-3.05), "−3.1%");
});

test("the component source keeps calculation, uncertainty, interaction, and exact-record boundaries", async () => {
  const explorer = await readFile(
    new URL("../src/components/revenue-growth-explorer.tsx", import.meta.url),
    "utf8",
  );
  const history = await readFile(
    new URL("../src/components/revenue-history.tsx", import.meta.url),
    "utf8",
  );
  const companyPage = await readFile(
    new URL("../src/app/company/aapl/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(explorer, /Year-over-year \(YoY\) Revenue Growth is the percentage change/);
  assert.match(explorer, /Current Revenue − Previous Revenue/);
  assert.match(explorer, /It does not show Profit or explain/);
  assert.match(explorer, /aria-pressed/);
  assert.match(explorer, /aria-live="polite"/);
  assert.match(history, /Exact record/);
  assert.match(history, /sourceUrl/);
  assert.match(companyPage, /const orderedSeries = overview \? orderRevenueSeries/);
  assert.match(companyPage, /const latest = orderedSeries\.at\(-1\)/);
});
