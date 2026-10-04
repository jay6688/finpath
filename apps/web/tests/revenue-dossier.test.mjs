import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  moveRevenueSelection,
  selectRevenueRecord,
} from "../src/lib/revenue-dossier.ts";

const readSource = (relativePath) =>
  readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");

const records = [
  {
    fact: {
      fiscalYear: 2023,
      value: 100,
      endDate: "2023-09-30",
      accession: "0000000000-23-000001",
    },
    valueRole: "reported",
    evidence: { sourceCapability: { filingLink: "available" } },
  },
  {
    fact: {
      fiscalYear: 2024,
      value: 120,
      endDate: "2024-09-28",
      accession: "0000000000-24-000002",
    },
    valueRole: "reported",
    evidence: null,
  },
];

test("period selection returns one intact Revenue record", () => {
  const selected = selectRevenueRecord(records, 2023);

  assert.equal(selected.fact.value, 100);
  assert.equal(selected.fact.endDate, "2023-09-30");
  assert.equal(selected.fact.accession, "0000000000-23-000001");
  assert.equal(selected.valueRole, "reported");
  assert.equal(selected.evidence?.sourceCapability.filingLink, "available");
  assert.throws(() => selectRevenueRecord(records, 2022), /not available/i);
});

test("keyboard period movement follows the native radio sequence", () => {
  assert.equal(moveRevenueSelection(records, 2023, 1), 2024);
  assert.equal(moveRevenueSelection(records, 2024, -1), 2023);
  assert.equal(moveRevenueSelection(records, 2024, 1), 2023);
});

test("reviewed Revenue records bind every annual value to its own evidence", async () => {
  const data = await readSource("lib/company-revenue-data.ts");

  assert.match(data, /overview\.series\.map/);
  assert.match(data, /valueRole:\s*"reported"/);
  assert.match(data, /buildReportedEvidence/);
  assert.match(data, /fact,/);
  assert.doesNotMatch(data, /416161000000|fallbackRevenue|hardcoded/i);
});

test("company workspace migrates Apple Revenue while retaining transitional company bodies", async () => {
  const [companyPage, workspace, workspaceStyles] = await Promise.all([
    readSource("app/company/[ticker]/page.tsx"),
    readSource("components/company-research-workspace.tsx"),
    readSource("components/company-workspace.module.css"),
  ]);

  assert.match(companyPage, /company\.ticker === "AAPL"/);
  assert.match(companyPage, /isDossier=\{isApple\}/);
  assert.match(companyPage, /<MetricDossier/);
  assert.match(companyPage, /<LegacyCompanyResearch/);
  assert.match(companyPage, /getCompanyRevenueData\(company\)/);
  assert.match(workspace, /Reviewed company workspace/);
  assert.match(workspace, /Explore/);
  assert.match(workspace, /Transitional workspace/);
  assert.match(workspaceStyles, /var\(--fp-v2-/);
  assert.doesNotMatch(`${companyPage}\n${workspace}`, /Apple logo|Microsoft logo|Walmart logo/i);
});

test("Apple Revenue is one accessible Object to Trace to Passport dossier", async () => {
  const [dossier, selector, passport, styles] = await Promise.all([
    readSource("components/metric-dossier.tsx"),
    readSource("components/period-selector.tsx"),
    readSource("components/number-passport.tsx"),
    readSource("components/metric-dossier.module.css"),
  ]);

  assert.match(dossier, /money Apple reported from customers before costs and expenses/i);
  assert.match(dossier, /selectRevenueRecord/);
  assert.match(dossier, /aria-live="polite"/);
  assert.match(dossier, /<PeriodSelector/);
  assert.match(dossier, /<NumberPassport/);
  assert.match(dossier, /href=\{`\/learn\/company-analysis\/revenue\?company=\$\{company\.slug\}`\}/);
  assert.doesNotMatch(dossier, /Number[\s\S]*Trend[\s\S]*Evidence/);

  assert.match(selector, /<fieldset/);
  assert.match(selector, /<legend/);
  assert.match(selector, /type="radio"/);
  assert.match(selector, /checked=\{/);
  assert.match(selector, /onKeyDown/);
  assert.match(selector, /moveRevenueSelection/);
  assert.match(selector, /Scale: USD billions/);
  assert.match(selector, /baseline \$0B/i);

  assert.match(passport, /<details/);
  assert.match(passport, /<summary/);
  assert.match(passport, /Close record/);
  assert.match(passport, /Value role/);
  assert.match(passport, /Reported/);
  assert.match(passport, /Evidence availability/);
  assert.match(passport, /Official SEC filing/);
  assert.doesNotMatch(passport, /Source location/);

  assert.match(styles, /@media \(min-width: 48rem\)/);
  assert.match(styles, /@media \(min-width: 75rem\)/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});

test("Revenue dossier remains outside progress and market-data concerns", async () => {
  const sources = await Promise.all([
    readSource("components/company-research-workspace.tsx"),
    readSource("components/metric-dossier.tsx"),
    readSource("components/number-passport.tsx"),
    readSource("lib/company-revenue-data.ts"),
  ]);
  const combined = sources.join("\n");

  assert.doesNotMatch(combined, /useLearningProgress|LearningProgressProvider|isHydrated/);
  assert.doesNotMatch(combined, /share price|price chart|daily movement|analyst target|BUY|SELL/i);
  assert.doesNotMatch(combined, /416161000000|fallbackRevenue|hardcoded/i);
});
