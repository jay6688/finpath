# FinPath Visual System V2

Status: production foundation, approved creative direction. The global shell and Home are the first approved production migration; Learn, Explore, company research, and lessons remain on their existing content system.

## Product grammar

FinPath is an interactive financial atlas, a visual financial learning lab, and a beginner company-research workspace. Its recurring grammar is:

**OBJECT → TRACE → PASSPORT**, with contextual **LEARN**.

- **Object** answers what financial thing is being inspected.
- **Trace** shows a defensible relationship, change, or transformation.
- **Passport** keeps the selected number attached to its reporting record.
- **Learn** explains why the relationship matters without interrupting research.

Home emphasizes Object + Trace. Learn emphasizes Trace + explanation. Explore composes Object + Trace + Passport. Sandbox adds manipulation to a Trace. Evidence expands the Passport.

## Scale is Syntax

Quantitative width, height, area, and position are mathematical statements. They use one declared reference scale and never gain a cosmetic minimum. Tiny quantities use a locator rule, marker, or non-quantitative annotation. The hit area may be larger than the visible mark.

Visual components receive reviewed domain records and do not calculate financial truth. A component may convert a validated amount into documented presentation geometry. Revenue, Profit, margin, EPS, P/E, Market Cap, cash-flow identities, and balance-sheet identities stay in domain logic.

Color identifies categorical roles, not good or bad performance. Text, labels, geometry, and accessible descriptions preserve meaning without color.

## Semantic foundation

`visual-system-v2.css` owns additive V2 tokens. Names are intentionally versioned while production V1 remains live. The foundation defines:

- ink, ivory, paper, neutral, and boundary roles;
- jade, cobalt, muted coral, amber, and violet categorical roles;
- conceptual serif, UI sans, and tabular numerical roles;
- four target compositions: 320, 390, 768, and 1440, expressed through mobile base rules plus 48rem and 75rem changes;
- restrained attached depth, clear focus, 44px touch targets, and reduced-motion timing.

The serif is for conceptual hierarchy, not every heading. Sans is for controls, labels, technical context, and body copy. Numbers use tabular forms and strong contrast.

## Financial object family

`FinancialObjectGlyph` uses one rounded frame, one stroke system, a central-node or axis idea, and shared trace terminals. Business, Revenue, Profit, Cash Flow, Financial Position, Per Share, and Valuation vary their internal relationship rather than becoming seven unrelated illustrations. A standalone informative glyph supplies an SVG title and description. The same glyph is `aria-hidden` when it sits beside the authoritative `FinancialObject` label and meaning, preventing duplicate announcements. The geometry is optically checked at 16px and 20px, remains legible at 48px, and survives monochrome/forced-color presentation.

No external icon dependency or company brand asset is introduced.

## Domain contracts

### FinancialObject

Pairs a family glyph with its domain label and short meaning. Tone is categorical. Selected and unavailable states have non-color cues.

### ConceptLens

Receives an explicit directed relationship graph and a controlled focused object. Every focused edge preserves its `from`, `to`, label, and direction; parallel edges are not collapsed into a generic neighbour list. Each visible relationship has its own trace and directly selectable counterpart. It has no index, previous, or next semantics. Mobile is a focused lens; tablet and desktop may expose more of the graph without turning it into a lesson sequence.

### RelationshipTrace

Names a relationship and renders a directional trace. Direction is descriptive, not a hidden financial calculation. Text remains the authoritative relationship description.

### QuantitativeLedger

Receives validated display values and `percentOfRevenue` geometry. Revenue is the 100% reference. Rows separate labels from their quantitative tracks, so longer copy cannot distort width. A selected transforming line may expose Before → Adjustment → After.

`SignedAdjustmentMarker` accepts positive or negative signs. The approved Apple FY2025 record is negative, but the reusable pattern does not classify Other Income / (Expense) as an inherent deduction. A tiny 0.08% value remains a truthful one-pixel locator rule; the containing 44px row is the interaction target.

### MetricDossier

One metric remains one research object: concise meaning, current reported state, annual trace, period selection, Reported status, contextual Learn bridge, related trace, and attached Number Passport. Number, Trend, and Evidence are not equal tabs.

Periods are native radio inputs, retaining browser keyboard, focus, pointer, touch, selected, and unavailable behavior. The host supplies reviewed display values, source records, normalized presentation percentages, and a human-readable geometry reference naming the record that represents 100%. Server components can prepare the reviewed records and pass serializable data into the interactive client boundary.

### NumberPassport

The Passport belongs to the selected number. Value/evidence role (`Reported`, `Derived`, or `Verification`) and evidence availability (`available` or `unavailable`) are independent fields: unavailable evidence never changes a reported value into a fourth role. The V2 Revenue Dossier intentionally restricts its values to `Reported`.

Closed is a quiet attached provenance rail and does not reserve a desktop evidence column. Its explicit states are closed, opening, open, and closing. Open may consume adjacent desktop space while preserving the selected metric and period; on mobile it continues beneath the research trace. It reveals only supported value role, reporting period, form, filing date, official source, and source location when available. Missing metadata is omitted, not invented. An unavailable Passport remains operable so its explicit unavailability can be disclosed.

## Interaction and accessibility

- Hover is supplementary; no information depends on it.
- Buttons use pressed, selected, radio, expanded, or disabled semantics as appropriate.
- Concept selection, Ledger selection, period selection, and Passport disclosure are keyboard and touch operable.
- Focus-visible rings are never removed and logical DOM order matches visual reading order.
- Minimum interactive block size is 44px.
- Reduced motion removes the Passport reveal animation and shortens shared timings.
- Figures and SVGs have text equivalents; quantitative values are also present as text.
- Contrast is designed against paper/ivory surfaces and color is not the only signal.

This foundation is accessibility-oriented but is not a claim of screen-reader certification.

## Responsive composition

The system uses a mobile base, a 48rem tablet change, and a 75rem wide-desktop change. The targets are 320, 390, 768, and 1440—not a collection of arbitrary breakpoints.

- At 320/390, Concept Lens shows one focus and directly selectable neighbours; Ledger labels and measures stack without changing scale.
- At 768, promise and financial-system proof can coexist. A closed Passport remains a full-width attached rail; an open Passport may attach beside the trace.
- At 1440, research surfaces gain breadth, not decorative emptiness. The Passport remains attached without reserving an empty closed column, and the trace keeps one declared scale.

Responsive components change composition. They do not duplicate financial truth or shrink a desktop map into a phone.

## Surfaces and modes

Ivory supports teaching and relationship inspection. Paper holds reviewed records. Neutral separates technical provenance. Ink establishes the research frame. Depth communicates attachment or layering only; it is not a generic card treatment. Domain components own scoped CSS Modules, while page composition uses its own module.

## Stage 1 audit

| Stage 1 decision | Disposition | V2 decision |
| --- | --- | --- |
| Evidence roles and explicit labels | **KEEP** | Reported, derived, and verification remain value/evidence roles. Available and unavailable are a separate evidence-availability axis; learner input and narrative remain explicitly labelled content types. |
| Serif/sans role split | **KEEP** | Retained and strengthened with a numerical role. |
| Reduced motion and visible focus | **KEEP** | Retained as global timing plus component behavior. |
| Semantic color discipline | **KEEP** | Retained; categorical color never means good/bad. |
| Green/cream-only identity | **ADAPT** | Expanded to the locked ink/ivory plus restrained jade, cobalt, coral, amber, and violet family. |
| Fixed density across modes | **ADAPT** | Mode-specific composition and attached evidence density replace a single shell density. |
| `ConceptNode` and `ConceptConnector` | **REPLACE** | `FinancialObject`, `ConceptLens`, and `RelationshipTrace` encode the relationship graph directly. |
| `FinancialDiagram` and `DiagramMagnitude` | **REPLACE** | `QuantitativeLedger` makes the common reference scale and tiny-value rule explicit. |
| Generic `MetricValue` research composition | **REPLACE** | `MetricDossier` binds meaning, state, trace, Learn, and Passport. |
| `EvidenceAnchor` as detached link | **REPLACE** | `NumberPassport` attaches provenance to its number and preserves closed/open states. |
| `PageModeShell` as the main composition abstraction | **RETIRE** | Pages compose domain primitives for their mode; no universal panel shell is required. |
| Generic card-dominant surface hierarchy | **RETIRE** | Spatial traces and attached structures carry hierarchy. |

Historical V1 documentation is preserved unchanged.

## Architecture and migration boundary

- `src/styles/visual-system-v2.css`: global additive semantic foundation.
- `src/components/design-system-v2/*.tsx`: domain-explicit components and contracts.
- colocated `*.module.css`: component visuals and states.
- `src/components/home-financial-system.tsx`: production Home composition for the object graph and focused relationship lens.

Legacy `globals.css` and V1 content components remain for unmigrated routes. Stage 3 CSS is evidence, not a copied dependency. No proof or design-lab route is exposed in production navigation.

The Home graph begins with Revenue as a stable conceptual entry point because it is a clear bridge from business activity into the financial statements. This default is not derived from lesson progress, does not imply a canonical concept order, and is not persisted. Graph focus and curriculum progress remain separate state domains.

## Anti-patterns

Do not introduce generic Card, Panel, Tile, or Widget APIs for these product concepts. Do not add chart libraries for simple record traces. Do not use equal Number/Trend/Evidence tabs. Do not imply canonical concept order. Do not stretch tiny values. Do not invent market data, source locations, or fallback financial records. Do not substitute color for labels. Do not add Apple artwork as a company identity shortcut.
