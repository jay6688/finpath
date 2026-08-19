# FinPath Product Visual Direction

**Status:** Proposal only — requires approval before frontend implementation
**Reviewed:** 2026-08-19
**Scope:** Global information architecture and responsive visual system; no new product functionality

## Decision in one sentence

FinPath should become a calm, modern learning product whose research surfaces can become professionally dense, while the current **Annotated Financial Record + Learning Margin** remains the signature company-metric detail pattern rather than the visual language of every screen.

## What the V0 taught us

The V0 succeeds at one important job: it makes a real number understandable and traceable. Its weakness as a future global shell is the same thing that makes the company page good: the whole experience feels like a carefully annotated financial document. That is appropriate for deep research, but too static and editorial for Home, short lessons, practice, progress, and repeated mobile use.

The redesign should therefore preserve the V0's truth chain:

```text
Metric + period + exact value + source
                       |
                       +-- meaning + importance + limitation
```

It should change the surrounding product architecture, not replace that chain.

## Production-interface research

These products were reviewed for patterns, not surface styling. FinPath should not clone any of them.

| Product | Pattern worth borrowing | What FinPath should avoid |
|---|---|---|
| Simply Wall St | A recognizable overview can orient a user, then disclose valuation, growth, performance, health, and other checks progressively. | A red/green summary shape can read like a verdict even when its maker states that it is not a buy/sell recommendation. FinPath should open every summary into evidence and explanation. [Snowflake method](https://support.simplywall.st/hc/en-us/articles/360001740916-How-does-the-Snowflake-work) |
| Koyfin | A chart and an exact table can be two views of the same information; expert users can later receive compact one-page research views. | Resizable widgets, customizable dashboards, and broad tool density make beginners design their own learning journey. [Earnings History](https://www.koyfin.com/help/earnings-history/), [mobile product](https://www.koyfin.com/help/topic/mobile/) |
| Quartr | Put the first-party source beside the claim and link to the exact supporting material. Desktop can use side-by-side context while mobile stays sequential. | Chat should not become the product shell. FinPath's default sequence remains fact → explanation → source. [Source-linked research](https://quartr.com/features/ai-chat), [mobile product](https://quartr.com/products/mobile-app) |
| TradingView | Financial charts need keyboard access, contrast, descriptions, and an exact table alternative. | The chart cockpit, toolbars, indicators, screeners, and trading controls are inappropriate for a beginner default. [Accessibility](https://www.tradingview.com/charting-library-docs/latest/configuration/accessibility/), [chart table view](https://www.tradingview.com/support/solutions/43000765410-how-to-view-chart-data-as-a-table/) |
| Moomoo | Keep company-specific financials and context around the active company, and let desktop/mobile prioritize different tasks. | Trade calls to action, rankings, heat maps, bullish/bearish signals, and rapid-refresh framing reward action rather than understanding. [Desktop overview](https://www.moomoo.com/us/learn/detail-quick-overview-117528-241097058), [stock analysis](https://www.moomoo.com/us/feature/stocks-analysis) |
| Finimize | Separate a personal home, discovery, deeper research, and saved history. Short daily context and a weekly zoom-out create different return rhythms. | Do not turn Home into an endless personalized market-news feed. [App structure](https://intercom.help/finimize-help/en/articles/11644100-explore-the-app), [daily and weekly briefs](https://intercom.help/finimize-help/en/articles/11643165-daily-brief-and-weekly-review) |
| The Economist | Reading-time labels, read state, and content suited to the time available help serious material fit a user's day. | Breadth, carousels, editions, audio, video, games, and alerts must not bury the one recommended next step. [App experience](https://www.economist.com/pro/app) |
| Duolingo | Give the learner one clear next lesson, integrate review into forward progress, and keep mobile navigation stable. Measure meaningful learning rather than raw session or XP volume. | Do not copy the winding game-board skin, characters, punitive streak logic, leagues, or XP grinding. [Guided path](https://blog.duolingo.com/new-duolingo-home-screen-design/), [learning-quality metric](https://blog.duolingo.com/time-spent-learning-well/) |
| Zogo | A personal path can drive Home while Explore keeps the wider library freely accessible; financial lessons benefit from short modules. | Redeemable coins, hearts, leaderboards, sponsor promotions, and streak loss would make FinPath feel transactional. [2025 app structure](https://zogofinancesupport.zendesk.com/hc/en-us/articles/33169055733659-Zogo-2025-App-Relaunch), [educator product](https://zogo.com/educators) |

The shared lesson is not “make a dashboard.” It is to choose a clear task for each surface, preserve evidence, and disclose complexity only when the user asks for it.

## Revised global information architecture

```text
FinPath
├── Home
│   ├── Your next step
│   ├── Weekly Momentum
│   ├── Continue / recently explored
│   └── one contextual story or practice invitation
├── Learn
│   ├── Guided learning path
│   ├── Current lesson
│   └── Concept library and review
├── Explore
│   ├── Companies
│   ├── ETFs and other assets later
│   ├── Watchlist later
│   └── Saved / recently viewed
├── Practice
│   ├── My First RM500
│   └── Paper portfolio later
├── News
│   ├── Malaysia
│   ├── Global economy
│   └── Companies and markets
├── Tutor
│   ├── Contextual explanation from a concept, metric, or story
│   └── Dedicated history later
└── Progress
    ├── Weekly Momentum
    ├── Concept familiarity
    └── Achievements later
```

Utility navigation later owns Profile, Demo Profile, Privacy, and Settings. It
does not compete with the learning destinations.

This is an architectural map, not a request to expose empty destinations. Navigation should appear only as working routes are approved. In V0, Apple remains an explicit first-company entry rather than a fake global search field.

### Navigation rollout

- **Current V0:** keep the simple Home → Apple flow and breadcrumb; add no empty rail or bottom destinations.
- **First product shell:** introduce only the working destinations once at least Home, Learn, and Explore have real routes. A three-item mobile bar is acceptable at that stage.
- **Stable target:** add Practice and Progress only when they work, then hold the mobile bar at five destinations. News and Tutor remain contextual/mobile-secondary unless usage proves they deserve a swap.

“Stable five-destination” is therefore the long-term target, not permission to render five dead tabs now.

## Three layout modes inside one system

The shell stays recognizable, but content density changes by task:

1. **Guide mode — Home and Learn:** one dominant action, narrow reading measure, generous spacing, little financial density.
2. **Workspace mode — Explore and company research:** wider canvas, compact identity and period labels, charts/tables, optional side-by-side Learning Margin.
3. **Reflection mode — Practice and Progress:** decisions and evidence in the main column, calm feedback in a supporting column; no profit-celebration visuals.

The mode changes density, not brand. Navigation, typography roles, color meanings, focus states, and the Learning Trace remain consistent.

## Desktop app shell

```text
┌──────────────────┬──────────────────────────────────────────────────────────┐
│ FINPATH          │ Context title                        Search*   Profile*   │
│                  ├──────────────────────────────────────────────────────────┤
│ Home             │                                                          │
│ Learn            │  Page canvas — Guide / Workspace / Reflection mode       │
│ Explore          │                                                          │
│ Practice         │  Content width responds to the task, not a card grid.     │
│ News             │                                                          │
│                  │                                                          │
│ Tutor            │                                                          │
│ Progress         │                                                          │
│                  │                                                          │
│ Privacy / source │                                                          │
└──────────────────┴──────────────────────────────────────────────────────────┘
* only when the feature exists
```

- A 208–224 px rail gives destinations stable locations without imitating a trading terminal.
- The top utility bar is quiet and context-specific. It does not carry ticker tape, market heat, or decorative statistics.
- Home and Learn use a maximum reading width inside the canvas. Company research may use the full canvas.
- Tutor is a destination and a contextual action, never a floating robot/chat bubble that competes with the current task.
- Only one surface per screen should be visibly elevated. Lists and secondary sections use spacing and rules rather than identical rounded cards.

## Mobile app shell

```text
┌─────────────────────────────┐
│ FinPath        Context / me │  compact app bar
├─────────────────────────────┤
│                             │
│ task-specific mobile flow   │
│                             │
│ no compressed desktop rail  │
│                             │
├─────────────────────────────┤
│ Home  Learn  Explore  Practice  Progress │
└─────────────────────────────┘
```

- Once all five routes work, use the stable target bar: Home, Learn, Explore, Practice, Progress.
- Tutor enters from the active lesson, metric, story, or decision and remains available inside those destinations. News begins from Home/Explore until real usage justifies replacing a bottom destination.
- Mobile content uses 16 px side gutters, touch targets of at least 44 px, and a single vertical narrative.
- Company tabs may scroll horizontally, but core identity, the active metric, its period, and its source do not require horizontal scrolling.
- Desktop comparison tools may be omitted or simplified on mobile. Responsive design means task parity, not identical controls.

### Intermediate widths

- **1180 px and wider:** expanded 208–224 px rail; company record and Learning Margin may remain side by side.
- **840–1179 px:** 64–72 px compact rail; labels move to accessible tooltips, and the Learning Margin stacks below the record below roughly 1040 px.
- **Below 840 px:** mobile app bar and bottom navigation; one-column task flow.
- Exact-value tables may scroll inside a clearly labelled region on tablet. On mobile, “View exact values” expands semantic period rows in the page rather than opening a modal or forcing a five-column table.

## Homepage wireframe

The homepage is a return point, not a finance dashboard and not a marketing landing page.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Good afternoon                                      Week of 17–23 Aug   │
│ Continue your financial journey                                         │
│                                                                         │
│ ┌─ YOUR NEXT STEP ────────────────────────┐  WEEKLY MOMENTUM             │
│ │ What is inflation?              6 min   │  2 learning sessions         │
│ │ Prices change. What happens to the      │  4 concepts explored         │
│ │ value of your savings?                  │  1 company researched        │
│ │ [Continue]                              │  No streak penalty           │
│ └─────────────────────────────────────────┘                              │
│                                                                         │
│ LEARN                 Continue your path                     →           │
│ ─────────────────────────────────────────────────────────────────────   │
│ EXPLORE               Research a real company                →           │
│   Recently explored   Apple · Revenue $416.2B · SEC 10-K ↗               │
│ ─────────────────────────────────────────────────────────────────────   │
│ PRACTICE              Try My First RM500 safely              →           │
│ ─────────────────────────────────────────────────────────────────────   │
│ TODAY'S STORY         One event · what happened · why it matters →       │
└─────────────────────────────────────────────────────────────────────────┘
```

Important revisions from a typical dashboard:

- “Your next step” is the only raised focus module.
- Learn, Explore, Practice, and Today's Story are structured launch rows, not four equal cards.
- Weekly Momentum reports meaningful actions and never says a missed day broke anything.
- The real Apple record remains visible as evidence of progress, not as a decorative market widget.
- The greeting is a small orientation line, not oversized hero copy.

## Company research wireframe

### Desktop

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Apple Inc.  AAPL · Nasdaq · SEC CIK 0000320193          Watch later*   │
│ Overview   Financials   Filings   Learn                                │
├─────────────────────────────────────────────────────────────────────────┤
│ COMPANY OVERVIEW                                                       │
│ What Apple does · how it makes money · questions to investigate        │
├─────────────────────────────────────────────────────────────────────────┤
│ Revenue          Net income*       Free cash flow*       Debt*          │
│ $416.2B selected · other metric names become available only with data   │
│ FY2025 · USD · year ended 2025-09-27 · SEC 10-K ↗                      │
├──────────────────────────────────────────────┬──────────────────────────┤
│ REVENUE                                      │ LEARNING MARGIN          │
│ $416.2B ───────── Learning Trace ────────────┤ What does Revenue mean?  │
│                                              │                          │
│ annual chart                                 │ Why this matters         │
│                                              │ What it cannot tell you  │
│ exact-value / filing table                   │ Revenue ≠ Profit         │
│                                              │ 中文解释 · Sources       │
└──────────────────────────────────────────────┴──────────────────────────┘
* future slot, not V0 functionality
```

- Compact the current company header by roughly 15–20%; company identity is context, not a hero.
- Surface `SEC 10-K ↗` beside the period. Filing date, accession, exact table, and retrieval state remain available below.
- The metric index can grow later, but it remains a compact text/data selector rather than a row of colored KPI cards. V0 still renders Revenue only; empty future metrics must not be shown in implementation.
- The current annotated record becomes the focused detail section below a concise company overview.
- Beginner/advanced density can later change the amount of company information, but it never removes provenance or educational context.

### Mobile

```text
┌─────────────────────────────┐
│ ← Apple Inc.          AAPL  │
│ Overview  Financials  Learn │
├─────────────────────────────┤
│ Revenue                     │
│ $416.2B                     │
│ FY2025 · USD                │
│ 2025-09-27 · SEC 10-K ↗     │
│                             │
│ annual chart                │
│ tap/focus for exact value   │
│ [View exact values]         │
├─────────────────────────────┤
│ LEARNING MARGIN             │
│ What does Revenue mean?  ▾  │  open by default
│ Why this matters         ▾  │
│ What it cannot tell you  ›  │
│ Revenue vs Profit        ›  │
│ Explain in Chinese       ›  │
│ Sources                  ›  │
└─────────────────────────────┘
```

The Learning Margin moves into document flow. Definition and “Why this matters” can be open initially; longer sections become progressive disclosure. The source remains one tap away before the explanation begins.

## Design-token direction

### Color

| Token | Proposed value | Job |
|---|---:|---|
| Mineral canvas | `#F1F5F4` | Cool, quiet product background; avoids the generic warm editorial-paper default. |
| Record surface | `#FFFFFF` | Data, lessons, and focused work surfaces. |
| Deep ink | `#142B31` | Primary text and navigation. |
| Trust jade | `#126B5C` | Primary actions, selected destination, verified state. |
| Learning amber | `#C97C24` | Learning Trace and concept anchors only. |
| Quiet rule | `#CFDAD8` | Dividers, table rules, inactive chart grid. |

Semantic success, caution, and error colors remain separate and always pair with text/icons. Red and green must never automatically mean “sell” and “buy.” No brand gradient is required.

### Interaction and data states

- Focus ring: `#1E5AA8`, 2 px with a 2 px canvas offset; it must remain visible in high-contrast and keyboard use.
- Hover and pressed states deepen Trust jade without changing a control's meaning; disabled controls retain their label, use `aria-disabled` where appropriate, and do not respond to hover.
- `live`: jade marker plus “Live from SEC”; `cached`: outlined ink marker plus “Cached”; `stale`: amber warning shape plus dark-ink “Last known data.” Color is never the only cue.
- Learning amber is a line/anchor or large graphical accent, not small body text on white; its contrast is insufficient for that role.
- Quiet rule is organizational only. It cannot be the sole boundary of a meaningful control or the sole distinction between chart values.

### Typography roles

- **Public Sans:** global UI, navigation, controls, headings, and ordinary explanatory copy.
- **IBM Plex Mono:** financial values, tickers, periods where alignment matters, and compact data labels; use tabular numerals.
- **Source Serif 4:** only the deeper teaching voice inside Learning Margin or long lesson explanations.

This preserves the useful current sans/mono/serif distinction while preventing serif typography from making the whole product feel like a report. Font files and licenses should be reviewed before implementation; safe local fallbacks remain until then.

### Spacing and density

- Base unit: 4 px.
- Working scale: 4, 8, 12, 16, 24, 32, 48, 64.
- Mobile gutters: 16 px; desktop canvas gutter: 32–48 px.
- Guide mode favors 24–32 px section spacing; Workspace mode may compress to 12–24 px.
- Keep a readable 60–72 character measure for learning prose even when the research canvas is wide.

### Radius and elevation

- 6 px: inputs, table controls, compact data surfaces.
- 12 px: the single current-focus module.
- 18–20 px: mobile sheets or rare immersive lesson surfaces.
- Pills only for a true status, filter, or compact category—not ordinary buttons and labels.
- Default organization uses alignment, spacing, and rules. Elevation marks priority, not every section.

### Data and chart style

- Use jade for the primary data series; reserve amber for the selected concept/annotation relationship.
- Keep visible units, fiscal year, period end, form, filed date, retrieval state, and source.
- Exact-value tables remain available and reflect the active chart data.
- Hover, keyboard focus, and mobile tap reveal the same precise value and period.
- Use restrained grid lines, no decorative area gradients, no red/green performance verdicts, and no motion required to understand the chart.
- Respect reduced motion; ordinary state transitions should complete in roughly 120–180 ms.

## Distinctive signature: the Learning Trace

The **Learning Trace** evolves the current annotation line into a reusable, semantic connection:

```text
real fact or decision  ──────┐
                             ├─ meaning / limitation
official source       ───────┘
```

It is a thin amber rule with a squared anchor, used only when FinPath can answer “what is connected, and why?” Its invariant is:

1. an origin node: a real fact, sourced claim, or reviewed concept;
2. a teaching node: meaning, limitation, or decision criterion;
3. a provenance node whenever the origin is an external value or claim.

The visual rule is decorative to assistive technology; the semantic DOM links the teaching content with `aria-describedby` or an equivalent labelled relationship. Keyboard focus or mobile tap highlights every node in the same trace. On mobile, a shared squared anchor and short left rule replace the desktop-spanning line.

- Company: Revenue value → Learning Margin → SEC source.
- Lesson: concept → real Apple example → source.
- News later: claim → concepts involved → original reporting/data.
- Practice later: use it only when an allocation choice is connected to reviewed liquidity/risk/time-horizon teaching content.

Progress paths, generic navigation, decoration, and unsourced motivational copy must not use the Trace. If the minimum nodes do not exist, use ordinary layout instead. This is the one visual risk; everything around it stays disciplined.

## One system for research, learning, and future gamification

| Layer | Visual behavior | Shared identity |
|---|---|---|
| Professional research | Higher density, mono numerals, sharper rules, chart/table equivalence, visible dates and sources. | Deep ink, jade actions, Learning Trace, same shell. |
| Beginner learning | Narrower measure, simpler hierarchy, Source Serif teaching voice, progressive disclosure, one next action. | Same vocabulary, periods, source behavior, and trace. |
| Future gamification | Confined to Progress/path surfaces; restrained color and motion; rewards concept use, review, and research. | Uses existing amber anchors and jade completion—not a new neon/game theme. |

Future XP, levels, collections, or Knowledge Chests stay operationally constrained: no reward currency, leaderboard, streak-loss state, profit-based reward, or gamification inside a research record; at most one acknowledgement after a meaningful learning action; no blocking celebration; any completion motion ends within 800 ms and disappears entirely under reduced motion. Progress can acknowledge “Revenue revisited” without turning the Learning Trace into a generic progress path.

## First-visit and empty states

- “Your next step” becomes a real first lesson such as Money & Saving, or the approved Apple Revenue entry while V0 remains the only loop.
- Weekly Momentum does not fabricate zeros or activity. It says what will appear after the first learning session and offers the same start action.
- “Recently explored” becomes the explicit “Explore our first company — Apple” entry until a real history exists.
- Practice and Today's Story do not appear until those products have real content. The remaining rows reflow rather than leaving decorative placeholders.

## Anti-AI critique and revision

The first planning pass still had four templated risks:

1. A left rail plus a grid of rounded Home cards would be an ordinary SaaS dashboard.
2. Warm paper, serif headlines, amber accents, and hairline rules would extend a now-common AI editorial preset.
3. A winding progress path and circular nodes would read as a Duolingo imitation.
4. A permanent Tutor bubble would make the product look AI-first rather than learning-first.

A second critique of the surviving direction found three more risks: the rail could still become generic SaaS furniture, the company metric index could become a KPI strip, and the Learning Trace could become an amber decoration placed everywhere.

The proposal above was revised before presentation:

- Home now has one raised next-step module and structured launch rows, not a bento/card grid.
- The global canvas is cool mineral, sans-first, and product-like; serif is isolated to the teaching voice.
- The Learning Trace is straight, restrained, and semantic. It appears only when it connects evidence, meaning, or review.
- Tutor is contextual and navigable, not an omnipresent mascot or glowing chat control.
- No oversized marketing hero, purple/blue gradient, glass surface, glowing border, decorative coin, or fake data widget is part of the direction.
- Dead navigation and fake search are explicitly disallowed. The shell grows as real routes become available.
- The rail is delayed until three real destinations exist and carries no decorative workspace widgets.
- The company metric index is one compact selector with period/source context, never a set of equal promotional cards.
- The Learning Trace now has mandatory semantic nodes and explicit prohibited uses.

The remaining conventional elements—desktop rail and mobile bottom navigation—are intentionally familiar navigation infrastructure. FinPath's distinctiveness is spent on the evidence-to-learning relationship, not on making basic wayfinding surprising.

## What current code should be preserved

- The entire FastAPI, SEC, cache, normalization, and provenance pipeline.
- The `CompanyOverview` frontend contract and the rule that missing data never becomes a hard-coded financial value.
- `RevenueHistory` as a chart plus exact source table pattern.
- The source row, fiscal period, filing date, accession, and retrieval-state semantics.
- `revenue.json`, including English, Chinese, limitations, and reviewed explanation sources.
- The current company page's server-side data loading and honest error state.
- Learning Margin's content hierarchy and responsive move into mobile document flow.

## What should change only after approval

- `layout.tsx`: introduce the real app shell as working destinations are built.
- Home: replace the V0 landing composition with the one-next-step product home; do not fabricate unavailable modules.
- Company header: become more compact and move development labels such as `V0 supported` out of user-facing UI.
- Company information architecture: add overview/tabs only when their underlying content exists.
- Learning Margin: extract a reusable pattern and strengthen the metric-to-explanation Learning Trace.
- Revenue chart: improve mobile value hierarchy, touch/focus details, contrast, and semantics while preserving the exact table.
- Global CSS: convert current values into explicit tokens and layout modes rather than accumulating page-specific rules.
- Mobile explanations: use progressive disclosure when real content length requires it.

No visual code should change until this proposal is reviewed. No backend rewrite, second metric, search expansion, authentication, Tutor backend, news, practice, gamification, PWA, or deployment work is implied by this document.

## Skill review

The official Anthropic [`frontend-design`](https://github.com/anthropics/skills/tree/main/skills/frontend-design) directory was inspected before use. It contains only `SKILL.md` and an [Apache-2.0 license](https://github.com/anthropics/skills/blob/main/skills/frontend-design/LICENSE.txt), with no scripts, binaries, templates, or other resources to execute. Nothing was installed or copied into FinPath.

Its useful influence here was process rather than visual styling: ground choices in the real subject, define type/color/layout/signature, spend boldness in one place, critique templated defaults, and revise before implementation. FinPath's brief remains authoritative.
