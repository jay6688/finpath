import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (relativePath) =>
  readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("Concept Lens preserves each focused edge, its label, and its direction", async () => {
  const { getFocusedRelationships } = await import(
    "../src/components/design-system-v2/relationship-model.ts"
  );
  const relationships = [
    { from: "business", to: "revenue", label: "Business activity produces Revenue" },
    { from: "revenue", to: "profit", label: "Revenue starts the Profit path" },
    { from: "profit", to: "cash-flow", label: "Profit is not Cash Flow" },
  ];

  assert.deepEqual(getFocusedRelationships(relationships, "revenue"), [
    {
      from: "business",
      to: "revenue",
      label: "Business activity produces Revenue",
      direction: "incoming",
      counterpart: "business",
    },
    {
      from: "revenue",
      to: "profit",
      label: "Revenue starts the Profit path",
      direction: "outgoing",
      counterpart: "profit",
    },
  ]);
});

test("Concept Lens renders one accessible trace per directed relationship", async () => {
  const [lens, trace] = await Promise.all([
    readSource("src/components/design-system-v2/concept-lens.tsx"),
    readSource("src/components/design-system-v2/relationship-trace.tsx"),
  ]);

  assert.match(lens, /focusedRelationships\.map/);
  assert.match(lens, /relationship\.from/);
  assert.match(lens, /relationship\.to/);
  assert.match(lens, /relationship\.label/);
  assert.match(trace, /sourceLabel/);
  assert.match(trace, /destinationLabel/);
  assert.match(trace, /aria-label/);
});

test("Passport separates value role from evidence availability", async () => {
  const source = await readSource("src/components/design-system-v2/number-passport.tsx");

  assert.match(source, /valueRole:\s*(?:ValueEvidenceRole|Role)/);
  assert.match(source, /availability:\s*EvidenceAvailability/);
  assert.match(source, /record\.valueRole/);
  assert.match(source, /record\.availability/);
  assert.match(source, /Evidence details are unavailable/);
  assert.doesNotMatch(source, /status:[^;]+Unavailable/);
  assert.doesNotMatch(source, /disabled=\{unavailable\}/);
});

test("Metric Dossier is explicitly restricted to Reported values", async () => {
  const source = await readSource("src/components/design-system-v2/metric-dossier.tsx");

  assert.match(source, /valueRole:\s*"Reported"/);
  assert.match(source, /PassportRecord<"Reported">/);
  assert.doesNotMatch(source, /<small>Reported<\/small>/);
});

test("historical period selection uses native radio semantics", async () => {
  const source = await readSource("src/components/design-system-v2/metric-dossier.tsx");

  assert.match(source, /<fieldset/);
  assert.match(source, /<legend/);
  assert.match(source, /<input[^>]+type="radio"/);
  assert.match(source, /checked=\{period\.id === selectedPeriodId\}/);
  assert.match(source, /disabled=\{period\.unavailable\}/);
  assert.match(source, /onChange=/);
  assert.doesNotMatch(source, /button[^>]+role="radio"/);
});

test("glyphs are informative alone and decorative beside authoritative text", async () => {
  const source = await readSource("src/components/design-system-v2/financial-object.tsx");

  assert.match(source, /decorative:\s*true/);
  assert.match(source, /aria-hidden=\{decorative/);
  assert.match(source, /decorative \? null : <title/);
  assert.match(source, /<FinancialObjectGlyph[^>]+decorative/);
});

test("closed Passport does not reserve a desktop evidence column", async () => {
  const [dossier, styles] = await Promise.all([
    readSource("src/components/design-system-v2/metric-dossier.tsx"),
    readSource("src/components/design-system-v2/metric-dossier.module.css"),
  ]);

  assert.match(dossier, /data-passport-expanded=\{passportExpanded\}/);
  assert.match(styles, /data-passport-expanded="true"/);
  assert.doesNotMatch(styles, /\.body\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(15rem/s);
});

test("Scale is Syntax has no cosmetic minimum and declares the Dossier reference", async () => {
  const [ledger, ledgerStyles, dossier, dossierStyles] = await Promise.all([
    readSource("src/components/design-system-v2/quantitative-ledger.tsx"),
    readSource("src/components/design-system-v2/quantitative-ledger.module.css"),
    readSource("src/components/design-system-v2/metric-dossier.tsx"),
    readSource("src/components/design-system-v2/metric-dossier.module.css"),
  ]);

  assert.doesNotMatch(ledger, /Math\.max\([^,]+,\s*(?:1|2|3|4|5)\s*\)/);
  assert.doesNotMatch(ledgerStyles, /\.measure\s*>\s*i\s*\{[^}]*min-(?:width|inline-size)/s);
  assert.match(dossier, /geometryReference:\s*string/);
  assert.match(dossier, /className=\{styles\.geometryReference\}/);
  assert.doesNotMatch(dossierStyles, /\.periodMark\s*\{[^}]*min-height/s);
});
