import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (relativePath) =>
  readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");

test("Home presents the approved hybrid path without fake destinations", async () => {
  const home = await readSource("components/learning-home.tsx");
  const navigation = await readSource("components/app-navigation.tsx");
  const styles = await readSource("app/globals.css");

  assert.match(home, /Understand one financial idea at a time/);
  assert.match(home, /Your next step/);
  assert.match(home, /View learning path/);
  assert.match(home, /concepts explored/);
  assert.doesNotMatch(home, /home-path-preview/);
  assert.doesNotMatch(home, /APPLE FIRST|About 7 minutes|about 5 min/i);
  assert.doesNotMatch(navigation, /News|Tutor|Practice|Progress/);
  assert.match(navigation, /label: "Home"/);
  assert.match(navigation, /label: "Learn"/);
  assert.match(navigation, /label: "Explore"/);
  assert.match(
    styles,
    /\.mobile-navigation\s*\{[^}]*grid-template-columns: repeat\(3, 1fr\)/,
  );
});

test("Company research keeps provenance and mobile-native exact records", async () => {
  const company = await readSource("app/company/aapl/page.tsx");
  const snapshot = await readSource("components/revenue-metric-snapshot.tsx");
  const exactRecords = await readSource("components/revenue-exact-records.tsx");

  assert.match(company, /Company research/);
  assert.match(company, /Learn Revenue/);
  assert.match(company, /Learn Revenue Growth/);
  assert.doesNotMatch(company, /LearningUpNext|Understand the number/);
  assert.match(snapshot, /SEC \{latest\.form\}/);
  assert.match(exactRecords, /className="mobile-records"/);
  assert.match(exactRecords, /Open SEC filing/);
  assert.match(exactRecords, /fact\.accession/);
});

test("Production data requests require an explicit HTTPS API origin", async () => {
  const apiClient = await readSource("lib/api.ts");

  assert.match(apiClient, /FINPATH_API_BASE_URL is required for a production deployment/);
  assert.match(apiClient, /parsedUrl\.protocol !== "https:"/);
  assert.match(apiClient, /return "http:\/\/127\.0\.0\.1:8000"/);
});
