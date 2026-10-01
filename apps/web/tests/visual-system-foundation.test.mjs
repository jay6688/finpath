import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const webRoot = join(import.meta.dirname, "..");

function read(relativePath) {
  return readFileSync(join(webRoot, relativePath), "utf8");
}

function customProperties(css) {
  return new Map(
    [...css.matchAll(/(--fp-[\w-]+)\s*:\s*([^;]+);/g)].map((match) => [
      match[1],
      match[2].trim(),
    ]),
  );
}

function relativeLuminance(hex) {
  const channels = hex
    .slice(1)
    .match(/../g)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

const requiredTokens = [
  "--fp-brand",
  "--fp-brand-strong",
  "--fp-brand-soft",
  "--fp-text-primary",
  "--fp-text-secondary",
  "--fp-text-tertiary",
  "--fp-text-inverse",
  "--fp-canvas",
  "--fp-surface",
  "--fp-surface-raised",
  "--fp-learn-canvas",
  "--fp-learn-surface",
  "--fp-research-canvas",
  "--fp-research-surface",
  "--fp-research-strong",
  "--fp-evidence-canvas",
  "--fp-sandbox-canvas",
  "--fp-sandbox-border",
  "--fp-role-reported",
  "--fp-role-derived",
  "--fp-role-narrative",
  "--fp-role-verification",
  "--fp-role-learner-input",
  "--fp-role-unknown",
  "--fp-diagram-revenue",
  "--fp-diagram-cost",
  "--fp-diagram-expense",
  "--fp-diagram-adjustment",
  "--fp-diagram-subtotal",
  "--fp-diagram-final",
  "--fp-font-ui",
  "--fp-font-teaching",
  "--fp-font-data",
  "--fp-type-display",
  "--fp-type-lesson-title",
  "--fp-type-section-title",
  "--fp-type-research-company-title",
  "--fp-type-metric-value",
  "--fp-type-metric-label",
  "--fp-type-body",
  "--fp-type-secondary-body",
  "--fp-type-eyebrow",
  "--fp-type-technical-metadata",
  "--fp-type-annotation",
  "--fp-width-reading",
  "--fp-width-content",
  "--fp-width-research",
  "--fp-radius-control",
  "--fp-radius-surface",
  "--fp-radius-immersive",
  "--fp-motion-quick",
  "--fp-motion-stage",
  "--fp-motion-data",
];

test("the visual system defines the approved semantic foundation", () => {
  const css = read("src/styles/visual-system.css");
  const tokens = customProperties(css);

  for (const token of requiredTokens) {
    assert.ok(tokens.has(token), `missing ${token}`);
  }

  const evidenceRoles = [
    "reported",
    "derived",
    "narrative",
    "verification",
    "learner-input",
    "unknown",
  ].map((role) => tokens.get(`--fp-role-${role}`));
  assert.equal(new Set(evidenceRoles).size, evidenceRoles.length);

  const diagramRoles = ["revenue", "cost", "expense", "adjustment", "subtotal", "final"].map(
    (role) => tokens.get(`--fp-diagram-${role}`),
  );
  assert.equal(new Set(diagramRoles).size, diagramRoles.length);
});

test("motion and responsive tokens include reduced-motion and canonical breakpoints", () => {
  const css = read("src/styles/visual-system.css");

  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /@media\s*\(min-width:\s*48rem\)/);
  assert.match(css, /@media\s*\(min-width:\s*75rem\)/);
});

test("core text tokens meet normal-text contrast on the base surface", () => {
  const tokens = customProperties(read("src/styles/visual-system.css"));
  const surface = tokens.get("--fp-surface");

  for (const token of ["--fp-text-primary", "--fp-text-secondary", "--fp-text-tertiary", "--fp-brand"]) {
    assert.ok(contrastRatio(tokens.get(token), surface) >= 4.5, `${token} lacks 4.5:1 contrast`);
  }
});

test("the root layout loads tokens before the unchanged legacy stylesheet", () => {
  const layout = read("src/app/layout.tsx");
  const foundationIndex = layout.indexOf('import "@/styles/visual-system.css";');
  const legacyIndex = layout.indexOf('import "./globals.css";');

  assert.ok(foundationIndex >= 0, "visual-system.css is not imported by the root layout");
  assert.ok(foundationIndex < legacyIndex, "foundation tokens must load before existing production CSS");
});

test("the foundation exports explicit FinPath domain primitives", () => {
  const exports = read("src/components/visual-system/index.ts");
  const expected = [
    "PageModeShell",
    "SectionEyebrow",
    "MetricValue",
    "ReportedValue",
    "DerivedValue",
    "EvidenceAnchor",
    "FinancialEquation",
    "LearningAnnotation",
    "ConceptNode",
    "ConceptConnector",
    "EducationalSandboxSurface",
    "ResearchSection",
  ];

  for (const name of expected) {
    assert.match(exports, new RegExp(`\\b${name}\\b`), `missing ${name} export`);
  }
});

test("MetricValue names every supported numeric evidence role without color alone", async () => {
  const { metricEvidenceLabels } = await import(
    "../src/components/visual-system/evidence-roles.ts"
  );
  const component = read("src/components/visual-system/content-primitives.tsx");
  const styles = read("src/components/visual-system/content-primitives.module.css");

  assert.deepEqual(metricEvidenceLabels, {
    reported: "Reported",
    derived: "FinPath derived",
    verification: "Verification",
    "learner-input": "Learner input",
    unknown: "Role unavailable",
  });
  assert.doesNotMatch(Object.keys(metricEvidenceLabels).join(" "), /narrative/);
  assert.match(component, /styles\.metricRole[^]*metricEvidenceLabels\[role\]/);

  for (const role of Object.keys(metricEvidenceLabels)) {
    assert.match(styles, new RegExp(`data-evidence-role=["']${role}["']`));
  }
});

test("financial visuals consume validated display values instead of calculating finance", () => {
  const diagram = read("src/components/visual-system/financial-diagram.tsx");
  const equation = read("src/components/visual-system/financial-equation.tsx");

  assert.match(diagram, /displayValue:\s*string/);
  assert.match(diagram, /magnitudePercent:\s*number/);
  assert.match(diagram, /aria-describedby/);
  assert.doesNotMatch(diagram, /revenue\s*[-+*/]\s*(cost|income|expense)/i);
  assert.match(equation, /accessibleLabel:\s*string/);
  assert.doesNotMatch(equation, /parseFloat|Number\(|Math\./);
});

test("the design document records boundaries and the Stage 2 migration order", () => {
  const doc = read("../../docs/design/visual-system-v1.md");

  assert.match(doc, /visuals? (?:must|do) not calculate financial truth/i);
  assert.match(doc, /reported, derived, narrative, verification, learner input, and unknown/i);
  assert.match(doc, /not good or bad/i);
  assert.match(doc, /production pages remain unchanged/i);
  assert.match(doc, /Stage 2 migration order/i);
});
