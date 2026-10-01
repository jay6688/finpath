# FinPath Visual System v1

**Status:** Stage 1 foundation implemented; production migration has not started

**Source:** Approved Stage 0 visual prototypes and the repository's validated product contracts

**Applies to:** Future FinPath web UI work

## Purpose and boundary

This foundation translates the approved Stage 0 visual language into reusable tokens and explicit financial-learning primitives. It does not replace existing production styling. The production pages remain unchanged until a separately approved Stage 2 migration.

The design system must serve FinPath's learning model and its data trust model. Visuals must not calculate financial truth. Components receive validated labels, display values, magnitudes, states, provenance, and educational boundaries from existing application logic.

Visual geometry must never override financial truth. If geometry encodes magnitude, it must come from validated values. Reported / derived / learner input / unknown must remain visibly distinct.

## Four product modes

| Mode | Purpose | Visual character | Default surface |
| --- | --- | --- | --- |
| Learn | Explain one concept in a guided sequence | Warm, calm, spacious | `--fp-learn-canvas` / `--fp-learn-surface` |
| Research | Inspect a real company and its reported records | Denser, cooler, professional | `--fp-research-canvas` / `--fp-research-surface` |
| Evidence | Trace a displayed number or derived result | Neutral and quiet | `--fp-evidence-canvas` |
| Sandbox | Try an explicitly hypothetical learner input | Warm boundary with visible disclosure | `--fp-sandbox-canvas` / `--fp-sandbox-border` |

`PageModeShell` exposes these modes without changing application navigation or data behavior. A mode is a page-level context, not a decoration to apply to every card.

## Visual hierarchy

### Typography roles

- **Display:** rare product-level statements and Home hero copy.
- **Lesson title:** the concept currently being learned.
- **Section title:** the next meaningful content boundary.
- **Research company title:** company identity in Explore/Research.
- **Metric value:** validated financial display value with tabular numerals.
- **Metric label:** the accounting or metric label paired with a value.
- **Body:** primary explanation.
- **Secondary body:** context, limitations, and support copy.
- **Eyebrow:** short navigation or category cue; never the primary accounting label.
- **Technical metadata:** periods, filings, accession numbers, and units.
- **Annotation:** Learning Trace notes close to the number or line they explain.

The initial font stacks use system or locally available fonts. No font package or external font request is part of Stage 1. The teaching serif is reserved for explanatory emphasis; UI controls and data remain sans-serif/monospace. All fluid sizes have a mobile floor that remains usable at 320px.

### Spacing and width

The scale uses eight spacing steps, three content widths, a responsive page gutter, and one section-gap token. The reading width protects lesson comprehension; the research width supports financial records without forcing lesson copy across a wide measure.

Canonical layout breakpoints:

- below `48rem`: single-column/mobile composition;
- `48rem` and above: tablet/intermediate composition;
- `75rem` and above: wide research/desktop composition.

These breakpoints are the destination for migrated components. Existing production media queries are not rewritten in Stage 1.

## Surfaces and depth

Use surface changes to express context or hierarchy:

1. Canvas establishes the current product mode.
2. A normal surface groups content that genuinely belongs together.
3. A raised surface marks a local layer that must separate from its surroundings.
4. Borders express structure and provenance more often than shadows.
5. The stronger shadow is reserved for transient overlays, not ordinary content.

Do not wrap every paragraph, row, or metric in its own card. Prefer typography, whitespace, alignment, and restrained separators. Rounded corners must not erase the difference between a lesson, a reported record, and a learner sandbox.

## Evidence language

Evidence roles are reported, derived, narrative, verification, learner input, and unknown. They are categories, not good or bad states.

- **Reported:** a value reported in a validated source record.
- **Derived:** a deterministic FinPath calculation from validated inputs.
- **Narrative:** reviewed explanatory context, not a numeric source fact.
- **Verification:** a reconciliation or check of existing values.
- **Learner input:** an explicitly hypothetical value supplied for learning.
- **Unknown:** a value whose stronger presentation role is unavailable.

Role color is never the only label. Copy, structure, and accessible names must identify the role. `ReportedValue` and `DerivedValue` are deliberately distinct wrappers so a migration cannot silently collapse the trust boundary into generic metric styling.

## Financial diagram categories

Revenue, cost, expense, adjustment, subtotal, and final are categorical roles. Their colors are not good or bad signals and must not imply investment performance.

`FinancialDiagram` and `DiagramMagnitude` accept already-reviewed display values and an already-derived visual magnitude. The visual layer may validate that a percentage is within its geometry contract, but it must not calculate Revenue, Profit, margin, growth, Market Cap, or any other financial result.

Every diagram must provide:

- a visible title;
- a concise text description;
- visible labels and values;
- a text-equivalent reading order;
- current/pending/revealed state that does not rely on color;
- a mobile composition that does not require horizontal scrolling;
- a meaningful reduced-motion experience.

Inline SVG may express a connector or relationship. SVG is decorative when adjacent text already communicates that relationship; otherwise it needs an accessible text equivalent. Connectors never establish accounting truth by themselves.

## Shared domain primitives

Stage 1 provides a deliberately small set:

- `PageModeShell` — establishes Learn, Research, Evidence, or Sandbox context.
- `SectionEyebrow` — subordinate section orientation.
- `MetricValue`, `ReportedValue`, `DerivedValue` — value hierarchy with explicit evidence roles.
- `EvidenceAnchor` — accessible link to an existing validated source destination.
- `FinancialEquation` — responsive composition for supplied terms and operators.
- `LearningAnnotation` — Learning Trace explanation adjacent to its subject.
- `FinancialDiagram` / `DiagramMagnitude` — accessible, data-driven financial magnitude display.
- `ConceptNode` / `ConceptConnector` — learning-path relationships with text states.
- `EducationalSandboxSurface` — visible boundary around hypothetical inputs and results.
- `ResearchSection` — semantic research grouping without mandatory card treatment.

These are domain primitives, not a configurable component factory. Add a new primitive only after at least one real migration demonstrates a repeated semantic need.

## Motion

Motion is optional support for state change, progressive reveal, or preserving visual continuity. It is not a reward and must not carry meaning on its own.

The foundation exposes quick, stage, and data-change durations plus one standard easing curve. Under `prefers-reduced-motion: reduce`, these durations collapse to effectively immediate changes. No animation package is introduced.

## Accessibility rules

- Use native headings, links, buttons, inputs, figures, and disclosures first.
- Preserve one logical DOM order that remains understandable without CSS.
- Keep keyboard focus visible with the shared focus token.
- Provide labels, descriptions, and text equivalents for financial visuals.
- Do not communicate evidence role, completion, or financial category with color alone.
- Keep interactive controls at least the shared control height where practical.
- Avoid horizontal scrolling at 320px.
- Reduced motion must preserve every explanation and state.

Stage 1 creates conventions and typed components; it does not claim WCAG certification.

## CSS destination architecture

The destination is incremental:

```text
src/
├─ styles/
│  └─ visual-system.css          # semantic tokens and canonical responsive values
├─ app/
│  └─ globals.css                # reset, existing shell, and legacy production styles
└─ components/
   └─ visual-system/
      ├─ *.tsx                   # explicit FinPath domain primitives
      └─ *.module.css            # locally scoped component styling
```

During migration, `globals.css` remains the legacy production stylesheet. New component styles belong in CSS Modules. Shared tokens remain truly global. Page-specific visual rules belong with the migrated lesson, research, or sandbox component rather than returning to one giant stylesheet.

## Stage 0 prototype disposition

No Stage 0 page or large stylesheet is copied wholesale into production.

| Classification | Stage 0 material | Stage 1 decision |
| --- | --- | --- |
| A — reusable idea | Four visual modes; Learning Trace; concept map; reported/derived distinction; magnitude-led Profit visual; static ratio explanation; clearly bounded Market Cap sandbox | Encode as rules, tokens, and domain semantics |
| B — reusable code | Small semantic structures and inline SVG connector ideas | Re-create only through reviewed primitives; no bulk copy |
| C — prototype-only | Prototype routes, isolated navigation/footer, demo composition, shell overrides, screenshot-specific spacing | Keep isolated on the prototype branch; do not migrate |
| D — rewrite cleanly | The large prototype stylesheet, page-specific cards, hard-wired waterfall layout, breakpoint overrides, and one-off metric treatments | Rebuild per production route using tokens and CSS Modules when approved |

This prevents a prototype optimized for visual comparison from becoming the production architecture by accident.

## Data and product boundaries

- Existing financial calculations and validations remain the source of truth.
- Existing API, evidence, provenance, company, and progress contracts remain unchanged.
- A component may format layout, but it may not invent a value, infer a missing metric, or silently substitute a company-specific label.
- The sandbox must visibly distinguish reported SEC inputs, learner input, and derived educational output.
- Unknown or unsupported data must stay unknown; styling cannot upgrade its certainty.
- Research density may increase, but provenance and periods must remain discoverable.
- Learn may simplify sequencing, but it must not remove accounting truth.

## What not to do

- Do not use one visual treatment for reported facts, FinPath calculations, and learner-entered hypotheticals.
- Do not turn every content group into an identical rounded card.
- Do not make a larger shape merely because a hard-coded mockup looked better.
- Do not use green/red alone to imply good/bad financial performance.
- Do not replace exact labels, units, periods, or provenance with decorative shorthand.
- Do not make motion, hover, or color the only way to understand a relationship.
- Do not import the prototype's page shell, route overrides, or large stylesheet into production.

## Stage 2 migration order

Recommended order, each as a separately reviewed slice:

1. **Global production shell and Home:** establish shared gutters, typography, navigation states, and the Learn/Explore distinction without changing routes or product promises.
2. **Explore and company research shell:** exercise the research width, company hierarchy, reported metrics, exact records, and evidence links.
3. **Revenue lesson:** migrate the simplest representative Learn flow and Evidence boundary before complex diagrams.
4. **Profit lesson:** migrate the progressive magnitude/statement composition after the core Learn primitives prove stable.
5. **Market Cap sandbox:** exercise native numeric input, learner-input role, equation layout, validation, and hypothetical boundary.
6. **Remaining lesson families:** group by visual pattern rather than converting all fifteen pages at once.
7. **Evidence Inspector refinements:** adopt the shared evidence tokens last, preserving its already-reviewed progressive-disclosure and trust behavior.

At every step, compare desktop, tablet, 390px, and 320px; run the complete current tests; and inspect the diff for changes to financial or product contracts.
