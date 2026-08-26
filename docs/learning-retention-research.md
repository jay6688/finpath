# FinPath Learning & Retention Research

**Status:** Draft for review  
**Date:** 2026-08-26  
**Scope:** Research and product recommendation only. No product code or package changes.

## Executive decision

FinPath should not try to retain beginners with a feed, a streak, or a chatbot. Its strongest loop is:

> **See a real fact → notice something → understand it → use the idea once → verify the evidence → continue.**

The current Revenue page already handles “real fact” and “understand it” reasonably well. Its next weakness is the gap between the five bars and a useful observation. The chart is accurate, but it gives the beginner no job to do and no help separating a measurable change from a possible explanation.

The recommended next implementation milestone is therefore one controlled vertical slice: **Guided Revenue History Insight for AAPL**. It is specified at the end of this document. It does not add Profit, a news feed, accounts, gamification, or the AI Tutor.

## 1. What the product research says

The products below are useful because of specific mechanics, not because FinPath should resemble them visually. Vendor-published efficacy or engagement figures are treated as self-reported rather than independent proof.

### Learning and motivation products

| Product | Actual loop | Genuine learning value | Other retention pressure | Copy the principle | Do not copy the implementation |
|---|---|---|---|---|---|
| Duolingo | Guided next lesson → short practice → immediate result → path continues → scheduled review returns later | A linear path removes planning; practice and stories are interleaved; review is treated as progress; spacing is built into the path | Streak, XP, leagues, gems, hearts, reminders and social comparison | One obvious next step; automatic revisit; mix instruction with real contexts | A daily-loss streak, energy system, leaderboard, or XP as the meaning of progress |
| Khan Academy | Learn/practice → explanatory feedback → skill state changes → recommended next activity | Mastery states make progress legible without a school grade; feedback explains errors | Completion pressure can turn mastery into perfectionism | Concept states and a recommended next action | Requiring “Mastered” before exploration or making users chase 100% |
| Brilliant | A question or visual problem appears before a full explanation → learner acts → tailored feedback → difficulty increases | One concept per lesson; worked examples and gradually reduced scaffolding; low-stakes practice | Streak, XP and leagues | Let the beginner observe or predict before explaining; fade help gradually | Locked content, streak pressure, leagues, or puzzle mechanics where a plain explanation is better |
| Quizlet | Short adaptive retrieval session → focus on weak items → increasing difficulty → revisit later | Active recall and spacing can strengthen memory when feedback is immediate | Test-oriented completion signals | One small recall or comparison prompt after learning | Turning FinPath into flashcards or exam preparation |
| Codecademy | Guided module → applied project → less hand-holding over time → portfolio artifact | Concepts are used in progressively more independent work | Career and completion motivation | Move from “read an example” to “explain a real company” and later “write a small thesis” | Large projects before the learner has the vocabulary to reason about them |
| Zogo | Two-minute module → points/reward → another module; personalized topics and fresh trivia/news | Short sessions lower activation energy; financial concepts can connect to timely life situations | Redeemable rewards and sponsor/product-adoption incentives | Very small lessons and relevant examples | Reward marketplace, bank-product adoption goals, or points as a substitute for understanding |

Evidence and current product descriptions: [Duolingo path redesign](https://blog.duolingo.com/new-duolingo-home-screen-design/), [Duolingo learning model and spaced practice](https://blog.duolingo.com/how-we-learn-how-you-learn/), [Duolingo product mechanics](https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo/), [Khan Academy Unit Mastery](https://support.khanacademy.org/hc/en-us/articles/115002552631--Beta-What-is-Unit-Mastery-), [Khan Academy learning science](https://blog.khanacademy.org/an-introduction-to-learning-science-at-khan-academy/), [Brilliant learning approach](https://brilliant.org/about/), [Brilliant features](https://brilliant.org/help/features/), [Quizlet Learn](https://quizlet.com/features/learn), [Codecademy portfolio projects](https://www.codecademy.com/resources/blog/portfolio-projects-in-career-paths), [Zogo](https://zogo.com/), and [Zogo for educators](https://zogo.com/educators).

### Finance and editorial products

| Product | What keeps it useful | Copy the principle | Do not copy the implementation |
|---|---|---|---|
| Finimize | A short recurring brief compresses “what happened” and “why it matters”; topic preferences, history and bookmarks support continuity | Editorial compression, explicit significance, a predictable cadence, and “empower rather than advise” | An opportunity-seeking market feed or pressure to check every day |
| Investopedia | Definitions, worked examples, author/reviewer/fact-check roles, update dates, corrections and primary references | Stable definitions with editorial ownership and provenance; explain a standard term without replacing it with a cute synonym | An encyclopedia-sized surface with no guided path |
| Money with Katie | A recognizable human point of view connects personal finance to economics, policy and culture; a multi-day email sequence builds lessons in order | Specific examples, question-led explanations, a weekly rather than frantic rhythm, visible sourcing and editing | Imitating one creator’s personality or relying on personality instead of evidence |
| Morning Brew’s former Money Scoop | Readers valued concise, relatable, actionable explanations | Relatable framing and a bounded edition | Treating an ended newsletter as current product evidence or copying its voice |
| Zogo | Current events and tiny modules make finance feel immediately relevant | Connect a familiar concept to a timely event only when the link is real | Daily trivia as filler or sponsored product promotion |

Evidence: [Finimize Daily Brief](https://finimize.com/newsletter), [Finimize app guide](https://intercom.help/finimize-help/en/articles/11644100-explore-the-app), [Finimize about](https://finimize.com/business/why-finimize/about-us), [Investopedia editorial standards](https://www.investopedia.com/about-us-5093223), [Investopedia policies](https://www.investopedia.com/legal-4768893), [Money with Katie](https://moneywithkatie.com/), [Money with Katie about](https://moneywithkatie.com/about), [Investing 101 sequence](https://newsletter.moneywithkatie.com/subscribe/investing-101), and [Money Scoop’s final issue](https://www.morningbrew.com/stories/2023/09/28/thats-all-folks).

### Company research and source products

| Product | Strong mechanism | Beginner risk | FinPath lesson |
|---|---|---|---|
| Quartr | First-party filings, slides, transcripts and audio remain traceable; search returns the exact paragraph plus event, date and speaker | Professional density and an AI search surface can still assume market knowledge | Show the evidence excerpt and metadata before the raw document; let the user jump to context |
| Simply Wall St | Visual summaries compress many dimensions; reports move from summary toward detail and disclose data sources | A red/green visual or single score can feel like a verdict | Progressive disclosure is useful; never turn complex company quality into “good/bad” |
| TradingView | Period controls, event markers, annotations and detailed financial series | A tool-first trading workspace asks the beginner to know what matters | Mark meaningful events on history; omit trading controls and red/green urgency |
| Koyfin | Mature annual/quarterly/TTM comparisons and growth calculations | Hundreds of fields create an expert’s blank canvas | Reuse period semantics later; do not expose the field universe now |

Evidence: [Quartr mobile product](https://quartr.com/products/mobile-app), [Quartr transcript search](https://quartr.com/features/transcript-search), [Quartr API principles](https://quartr.com/docs/introduction), [Simply Wall St company reports](https://support.simplywall.st/hc/en-us/articles/360001845296--Getting-Started-with-Company-Reports), [Simply Wall St data sources](https://simplywall.st/analysis-and-financial-data-sources), [TradingView financial data](https://www.tradingview.com/support/solutions/43000543506-how-to-access-financial-data-on-tradingview/), [TradingView earnings markers](https://www.tradingview.com/support/solutions/43000629790-earnings/), and [Koyfin financial templates](https://www.koyfin.com/help/financial-analysis-templates/).

## 2. Retention without manipulation

### The useful loop

1. **Trigger:** a remembered question, the next concept, a scheduled review, or a relevant company event.
2. **Small action:** inspect one fact, choose an observation, explain a difference, or verify one source.
3. **Payoff:** “I understand something I did not understand five minutes ago.”
4. **Visible continuity:** the concept state changes because of real use, not because the user checked a box.
5. **Next meaningful step:** exactly one recommendation, with free exploration still available.
6. **Reason to return:** a later revisit, the next concept, or a new real-world example that depends on prior knowledge.

### What different mechanics actually do

| Mechanic | Value | Risk | FinPath position |
|---|---|---|---|
| Learning progression | Builds competence and curiosity | Can feel restrictive | Primary loop; guide, never lock |
| Spaced revisit | Improves later retrieval when feedback is present | Can become repetitive testing | Use as a 30–90 second “remember and apply” prompt |
| Fresh content | Makes learned ideas feel alive | Becomes a feed and editorial burden | Only surface events mapped to concepts the user knows |
| Weekly recap | Gives a forgiving cadence and synthesis | Empty if the user did little | Use once there are at least two learned concepts |
| Event-driven update | High relevance | Irregular and easy to sensationalize | Use for filings or material company events, not market noise |
| Curiosity continuation | Turns a real question into the next lesson | Clickbait if the answer is withheld artificially | Use a genuine information gap and answer it honestly |
| Progress state | Makes learning visible | Encourages completion theatre | Infer from use; no grades |
| Streak | Creates habit | Loss aversion, guilt and minimum-effort behavior | Do not center FinPath on it |
| Notifications | Can remind at a chosen time | External pressure and fatigue | Opt-in later; content must be meaningful without the notification |
| Social comparison | Can motivate a subset of users | Status anxiety and speed over understanding | Avoid for beginner finance |

Retrieval and spacing have a strong evidence base, but they are not magic. Benefits depend on successful retrieval, feedback, the material, and the delay; complex understanding still needs examples and application. See the [Nature Reviews Psychology review of spacing and retrieval](https://doi.org/10.1038/s44159-022-00089-1) and the [Annual Review of Psychology review of retrieval practice](https://www.annualreviews.org/content/journals/10.1146/annurev-psych-010419-051019). Curiosity helps when a learner can perceive a real information gap; manufactured suspense is not required. See [Markey and Loewenstein’s review](https://www.cmu.edu/dietrich/sds/docs/loewenstein/Curiosity_IntlHandbookEmotEduc.pdf) and this [randomized curiosity intervention](https://pubs.aeaweb.org/doi/10.1257/aer.20230084).

### Realistic V1 return loop

The first sustainable loop should be **progression plus gentle revisit**, not daily news:

- At the end of Revenue: “Next: Profit — what is left after expenses?”
- Two to four days later: one short Revenue revisit using a different company or scenario when available.
- After two or more concepts: a weekly recap that asks the learner to connect them in one real case.
- When a relevant filing occurs: a concept-linked story only if the user already knows the required concept.
- No streak loss, no generic market feed, and no need to publish daily filler.

This loop will need more than the current V0 content, so it is a V1 design recommendation, not the next implementation milestone.

## 3. Beginner learning path

This is a guided route, not an access-control system. Users may open Apple or any later concept at any time; unfamiliar terms should link back to their prerequisites.

| # | Concept | Prerequisite | Learning goal | Real-world example | Next | Common misconception |
|---:|---|---|---|---|---|---|
| 1 | Money has jobs | None | Separate money for spending now, near-term safety and future goals | RM500 split among bills, buffer and a future goal | Saving plan | Every ringgit should be invested |
| 2 | Saving and cash flow | Money has jobs | Understand income, spending and the amount left | Monthly pay minus essentials | Emergency fund | Saving is whatever happens to remain |
| 3 | Emergency fund | Saving | Explain why liquidity comes before return | A car repair paid without selling an investment | Interest and FD | Emergency money should earn the highest possible return |
| 4 | Interest and FD | Emergency fund | Read principal, rate, term and liquidity trade-off | RM1,000 in a 12-month FD | Compound growth | The advertised annual rate is the cash earned every month |
| 5 | Compound growth | Interest | Understand returns earning returns over time | RM100 added monthly for several years | Inflation | Compounding guarantees a high return |
| 6 | Inflation and purchasing power | Saving, compound growth | Explain why the same RM buys less over time | Grocery cost rising while cash balance is unchanged | Time horizon | Inflation means every price rises equally |
| 7 | Time horizon | Emergency fund, inflation | Match money to when it will be needed | Tuition next year versus retirement decades away | Risk and return | Long term means losses cannot happen |
| 8 | Risk and return | Time horizon | Recognize uncertainty and the price of seeking higher returns | FD certainty versus share-price movement | Asset classes | Higher risk guarantees higher return |
| 9 | Asset classes | Risk and return | Distinguish cash, deposits, bonds, equities and property at a basic level | Where RM500 could sit | Diversification | Asset classes are just different stock sectors |
| 10 | Diversification | Asset classes | Explain why one outcome should not decide the whole plan | One company versus a broad basket | What investing is | Owning many random assets is automatically diversified |
| 11 | What investing is | Inflation, risk, diversification | Separate productive ownership from saving and speculation | Funding a business in exchange for a claim on future results | ETFs | Investing is a quicker form of saving |
| 12 | ETFs | Diversification, investing | Understand a fund, its holdings, index, fee and tracking | A broad-market ETF holding many companies | Stocks | Every ETF is low risk |
| 13 | Stocks and ownership | Investing | Explain what a share represents and why price can move | One small ownership claim in Apple | Business model | A famous product makes a good stock at any price |
| 14 | How a company makes money | Stocks | Identify customer, offer, payment and major costs | Apple sells devices and services | Revenue | The share price shows how much the company earns |
| 15 | Revenue | Business model | Read the top line, period and units; distinguish it from profit | Apple FY2025 Total net sales | Costs and profit | Revenue is money the owners can keep |
| 16 | Costs and profit | Revenue | Explain what remains after expenses and why definitions differ | High sales with rising costs | Margins | Higher Revenue always means higher Profit |
| 17 | Margins | Revenue, profit | Compare profit relative to Revenue across time | RM20 profit on RM100 sales | Cash flow | A higher margin is always sustainable or “better” in isolation |
| 18 | Cash flow and FCF | Profit, business model | Distinguish accounting profit from cash movement and capital spending | Profit rises while cash is tied up or equipment is purchased | Balance sheet | Cash flow is the same as cash balance |
| 19 | Balance sheet and debt | Cash flow | Read assets, liabilities and equity as a dated snapshot | Cash and debt on year end | Financial statements together | Debt is always bad, or cash is always idle |
| 20 | Three statements together | Revenue through balance sheet | Trace one business event through income, cash flow and balance sheet | Selling a phone on credit, then collecting cash | Valuation | Each statement tells a separate, complete story |
| 21 | Valuation and P/E | Profit, risk | Explain that price must be compared with a claim on business results | Two profitable firms with different expectations | Company analysis | A low P/E means cheap and a high P/E means bad |
| 22 | Company analysis and portfolio thinking | All prior core concepts | Form a modest thesis, name unknowns and size exposure around uncertainty | Compare business, trend, cash, debt, price and risks before deciding | Revisit and deepen | Research removes uncertainty or produces a BUY/SELL answer |

## 4. Standard FinPath lesson anatomy

A standard lesson should take about five to eight minutes. It may be shorter when revisiting a concept.

1. **Reconnect (15–30 seconds).** One sentence recalls the prerequisite: “Revenue is sales before costs. Today we will see what happens after costs.” Skip this for the first concept.
2. **Real hook.** Ask a concrete question that the evidence can answer: “Apple sold more in 2025. Did it also keep more?”
3. **See and notice.** Show one real number, chart, statement line or scenario. Give the learner a small job: choose what changed, tap the notable year, or state what is still unknown.
4. **Plain explanation.** Name the standard English term, define it in one or two sentences, and connect it to the visible example.
5. **Boundary and contrast.** State what the concept cannot prove and compare it with the nearest confusing concept.
6. **Use it once.** A low-pressure application, not an exam: pick the better description, explain the difference in the learner’s own words, or inspect a second example. Give explanatory feedback immediately.
7. **Verify.** Show the evidence excerpt, period, unit, filing and source confidence. Opening raw SEC is optional depth, not the default teaching action.
8. **Continue or revisit.** Acknowledge the exact learning action, schedule a gentle revisit, and show one next concept. Free exploration remains available.

### Progressive disclosure

- Default mobile view: hook, real fact, one observation, definition, one limitation, one action and next step.
- Expandable depth: methodology, longer comparison, Chinese explanation, source detail and exact table.
- Do not collapse the central limitation; beginners need to see what a metric cannot tell them.
- A concept state should be inferred: **Introduced** after reading, **Used** after applying it, **Revisited** after later recall, **Familiar** after successful use in more than one context.

### English first, Chinese rescue

- Keep the standard English term visible: `Revenue（营业收入）`.
- Offer Chinese when requested, when the learner selects “simpler”, or after repeated difficulty.
- Translate the explanation, not just the term. Keep the English term beside it so the learner can recognize it elsewhere.
- Do not maintain two disconnected vocabularies or force every learner through duplicated bilingual content.

## 5. History Insight: turn a chart into teaching

### The ideal beginner interaction

1. The chart loads with one understated annotation on a defensible, mechanically selected observation.
2. Before showing a cause, FinPath asks: **“What do you notice?”** The learner can tap a year or choose among two or three descriptions. There is no score.
3. FinPath reveals the **data observation**: for example, “Revenue fell 2.8% from FY2022 to FY2023.” This is computed from the displayed facts.
4. The learner may open **“What changed around this year?”**
5. FinPath shows separately:
   - **Reported fact:** the values, periods, units and calculation.
   - **Sourced context:** what Apple or another reliable source reported about products, regions, currency, demand or an event.
   - **Interpretation:** a carefully worded connection, labelled as interpretation.
   - **Still unknown:** factors the available evidence cannot isolate.
6. A final question checks the boundary: “Does one year of falling Revenue prove the company is bad?” Feedback explains why the chart alone cannot answer that.

### Selecting the notable change

Use deterministic rules before any editorial or AI layer:

- calculate year-over-year absolute and percentage changes;
- detect the largest percentage move in the visible series;
- detect a direction reversal after at least two consecutive moves;
- prefer a recent reversal over an older, slightly larger move when the rule is stated;
- flag non-comparable periods, restatements, currency changes, acquisitions or 52/53-week years when known;
- if no change is genuinely notable, say “Revenue was relatively stable” rather than manufacturing a story.

The rule and the displayed values must be testable. The UI should never silently choose a dramatic year because it makes better copy.

### Chart behavior

- Keyboard-focusable bars or data points, with visible focus and a text alternative.
- Tap/Enter reveals exact value, fiscal year, start/end dates and year-over-year change.
- The chart and the exact table remain two views of the same data.
- Color is not the only indicator of increase/decrease.
- On mobile, do not force all labels under every bar; show years clearly and move exact numbers into the selected detail.
- Context is attached to a year, not presented as a free-floating AI paragraph.

### Content contract for a History Insight

```text
observation
  values + calculation + period + source fact ids

context[]
  claim + source + date + evidence excerpt + claim type

interpretation
  wording + author/reviewer + confidence + alternatives

uncertainties[]
  what the evidence does not establish
```

An AI system may help draft or locate candidate context later, but the published claim must be backed by selected sources and reviewed. The chart must work without an AI-generated narrative.

## 6. Source Explainer: from provenance to comprehension

### User-facing design

The first source action should open a readable FinPath evidence panel:

```text
FinPath used this figure

Total net sales ........ $416,161 million

Apple FY2025 Form 10-K
Year ended 2025-09-27 · Filed 2025-10-31
Consolidated Statements of Operations

Why this matches
Same value · same period · USD · annual filing

[View this statement in context]
[Open the filing on SEC]
```

The panel must also expose the XBRL concept, unit and matching status for advanced inspection, but those are not the beginner’s headline.

### What SEC data can and cannot guarantee

The [SEC EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces) provide company submissions and aggregated XBRL facts. Company Facts supplies taxonomy concepts and fact records tied to values, units, periods, forms, filed dates, fiscal metadata and accession numbers. This is enough to identify the filing and the reported fact. It does **not** by itself provide a reliable human-readable statement line or printed page.

[Inline XBRL](https://www.sec.gov/data-research/structured-data/inline-xbrl) embeds machine-readable facts in the human-readable HTML filing. The SEC viewer can navigate tagged facts and sections, show context and distinguish standard, custom, dimensional and hidden facts. This makes a line-level locator feasible for many filings. It is not universally one-to-one:

- the same value/concept/period may appear in more than one place;
- a fact can be dimensional, scaled, nil, duplicated or hidden;
- companies may use custom tags;
- an amended filing can supersede or restate earlier facts;
- an HTML table has no stable “page” in the browser;
- a printed page number may exist in the filing, but should be stored only when verified;
- a value visible to the reader can map through Inline XBRL transformations rather than the literal machine value text.

The current [EDGAR XBRL Guide](https://www.sec.gov/files/edgar/filer-information/specifications/xbrl-guide.pdf) explicitly describes visible and hidden Inline XBRL facts and the SEC-specific mechanism that can display a hidden fact in the document body. The [SEC Inline XBRL Viewer](https://www.sec.gov/ixviewer/ix.html?doc=%2FArchives%2Fedgar%2Fdata%2F0001326801%2F000132680123000050%2Fmeta-20230414.htm) demonstrates fact filters, section navigation and fact review.

### Reliability levels

| Level | FinPath can say | Automation confidence |
|---|---|---|
| Filing metadata | “This fact came from this accession/form/filed date” | High; already supported |
| XBRL fact match | “Same concept/value/unit/period in this filing” | High when unique; record the match inputs |
| Statement/section | “Shown in Consolidated Statements of Operations” | Medium to high after parsing and section validation |
| Exact HTML fact | “Open the tagged fact in context” | Medium to high when a unique Inline XBRL element is found |
| Printed page | “Page 29” | Conditional; never infer from browser position |
| Causal explanation | “This happened because…” | Not established by XBRL; requires separate cited context and cautious language |

### Proposed evidence record

```json
{
  "filing": {
    "cik": "0000320193",
    "accession": "0000320193-25-000079",
    "form": "10-K",
    "filedAt": "2025-10-31",
    "filingIndexUrl": "official SEC index URL"
  },
  "fact": {
    "concept": "us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax",
    "value": 416161000000,
    "unit": "USD",
    "startDate": "...",
    "endDate": "2025-09-27"
  },
  "locator": {
    "primaryDocumentUrl": "from SEC submissions metadata",
    "statement": "Consolidated Statements of Operations",
    "factElementId": "only when uniquely matched",
    "printedPage": null
  },
  "evidence": {
    "displayedText": "Total net sales ... $416,161 million",
    "matchStatus": "exact | ambiguous | metadata-only",
    "reviewedAt": "...",
    "notes": []
  }
}
```

Do not guess the primary document filename. Obtain it from SEC submissions/filing metadata. Keep the robust accession-based filing index as the fallback. If multiple candidates remain, show the filing and statement but label the exact-line locator unavailable rather than selecting one silently.

### Accessibility and mobile

- Evidence is real text, not a screenshot of a filing.
- The excerpt uses a semantic table or definition list with clear units and period.
- “Open original SEC filing” has a descriptive accessible name and warns that it opens a dense external document.
- Source depth is an expandable panel on mobile; the filing identity and match explanation remain visible.
- A screen reader should receive the number, unit, period and source in that order.

## 7. Gamification policy

### Use now

- Acknowledge the actual action: “You used Revenue to describe a real change.”
- Concept states: Not seen → Introduced → Used → Revisited → Familiar.
- One visible next step.
- Weekly Momentum based on sessions, concepts used and companies researched, with no loss state.
- Credit source verification as learning, not as points.

### Use later, after the learning loop is proven

- A path map showing prerequisites and available branches.
- Optional weekly missions such as “Use one old concept on a new company.”
- Collections for concepts, company notes or source evidence.
- Milestone badges for meaningful firsts, such as reading the first financial statement.
- Cosmetics that do not affect financial decisions.

### Avoid

- Daily streak reset, streak repair purchases, hearts/energy and punishment for absence.
- Leaderboards based on speed, lesson count, XP or activity volume.
- Random loot as the main reward.
- Rewards for number of trades, returns, volatility, risky choices or frequent checking.
- Red/green celebration of short-term paper gains.
- Notifications that imply urgency or shame.

## 8. FinPath Editorial & Teaching Style Guide v0.1

### Voice

FinPath is a calm, specific teacher beside a real financial record. It is curious without being cute, confident about facts, explicit about uncertainty, and never excited merely because a number moved.

### Core rules

1. Lead with the learner’s question or the useful result.
2. One new idea per paragraph; usually one unfamiliar term at a time.
3. Keep the standard English financial term. Explain it immediately in ordinary words.
4. Prefer a real amount, company, date or household decision over an abstract analogy.
5. State the period and unit whenever a financial number could be misunderstood.
6. Put the limitation close to the claim, not in a disclaimer at the bottom.
7. Never turn management commentary into an objective cause. Label who said it.
8. Never use price movement as proof that a business became better or worse.
9. Do not end every section with a motivational slogan or summary of the summary.
10. A human editor owns published lessons; AI may assist drafting but is not the source.

### Length and structure

- Definition: one or two sentences, normally under 45 words.
- Why this matters: one concrete consequence, normally 40–90 words.
- Limitation: one direct sentence plus an example when needed, normally 25–70 words.
- History observation: one sentence with the numbers and calculation.
- Sourced context: two to four short paragraphs or bullets, each independently cited.
- Mobile default: no more than one screen of required reading before the learner can act.
- These are editing targets, not automatic quality scores. Do not force prose into a fixed sentence count.

### Definitions

Use this pattern:

> **Revenue is the money a company records from selling its products or services before subtracting its costs.** Apple calls this “Total net sales” in its annual report.

Do not define a term with another unexplained term. Do not say “Revenue is the top line” until “top line” is explained as a nickname.

### “Why this matters”

Connect the concept to one decision the learner can make:

> Revenue shows whether customers are buying more or less from the business. It does not show how much the company kept, so the next useful check is Profit.

Avoid generic importance claims such as “Revenue is a crucial metric that provides powerful insights into company performance.”

### Limitations

Use a direct boundary:

> Revenue alone cannot tell you whether Apple became more profitable. Costs may have risen faster than sales.

Avoid burying the limitation after a positive conclusion. Avoid “however, it is important to note that…”

### Fact, source claim, interpretation and uncertainty

Use explicit labels in content models and, when helpful, the UI:

- **Fact:** “FY2023 Revenue was 2.8% lower than FY2022.” Computed from cited values.
- **Company reported:** “Apple said foreign-exchange weakness reduced net sales.” This is management’s statement, with source.
- **Interpretation:** “Currency appears to be one contributor, but the filing does not isolate every cause.” Named as analysis.
- **Unknown:** “This evidence cannot tell us how much each customer decision contributed.”

Use **is/was** only for directly supported facts. Use **reported/said** for attributed claims. Use **may/could/appears consistent with** for plausible interpretation. Use **the available evidence does not establish** when a cause cannot be supported.

### Questions

- Ask questions the displayed evidence can answer.
- Use one question to direct attention, not five rhetorical questions to manufacture energy.
- Reveal the answer after a real attempt; do not hold basic information hostage.
- “What do you notice?” should be followed by useful options or a clear tap target for a complete beginner.

### Analogies and humour

- An analogy is optional. Use it only if it preserves the financial boundary.
- Do not keep extending an analogy after the concept is clear.
- Mild humour can acknowledge a familiar confusion, but never joke about losses, debt distress or user ignorance.

### Chinese rescue

- Keep the English term first or beside the Chinese term.
- Explain the idea naturally in Chinese; do not translate the English sentence word for word when that sounds unnatural.
- Preserve figures, dates, source labels and uncertainty exactly.
- Chinese is an explanation route, not a separate factual layer.

### Phrases and habits to remove

- “In today’s fast-paced financial landscape…”
- “Let’s dive in.”
- “Unlock powerful insights.”
- “Navigate the complexities of…”
- “Whether you’re a beginner or a seasoned investor…”
- “It is important to note that…”
- “Game-changing”, “revolutionary”, “seamless”, “robust” when no specific property follows.
- Vague authority: “experts say”, “research shows”, “many believe” without a source.
- Fake intimacy: “Great question!”, “You’re absolutely right!”, “Don’t worry, we’ve got you.”
- Repeated three-item slogans, repeated “not X, but Y”, and a tidy inspirational conclusion on every lesson.

### Citation and review checklist

Before publishing a financial claim:

- Can a reviewer open the source?
- Does the source support this exact wording and period?
- Is the source primary where practical?
- Are management statements attributed?
- Are calculations reproducible from displayed values?
- Are alternatives or uncertainty visible?
- Did an editor verify that the explanation did not change the fact?
- Does the definition’s local JSON include its reviewed `sources`?

Investopedia’s public policies are a useful operational reference: content has authorship, review/fact checking, update dates, corrections and primary sourcing. FinPath should use the process, not copy the prose. See [Investopedia About Us](https://www.investopedia.com/about-us-5093223).

## 9. Agent Skills audit

No external Skill was installed or executed. Popularity is a weak trust signal; licensing, source scope and execution behavior matter more. Repository observations are as of 2026-08-26.

Classification summary: **Use directly — none. Use selectively — `ux-writing-skill`, `blader/humanizer`, and the WCAG Skill after manual verification. Reference only — Anthropic `frontend-design`. Avoid installing — `researcher_agent`.**

| Candidate | Repository and maintenance signal | Contents / execution | License | FinPath judgement |
|---|---|---|---|---|
| `content-designer/ux-writing-skill` | About 155 stars, 119 commits, active 2026 project | 417-line `SKILL.md`; accessibility, voice, patterns, examples and templates; a small build script only packages local files into a ZIP and removes the previous ZIP | MIT | **Use selectively.** Useful for button labels, errors, empty states and a content review checklist. Do not accept its precise comprehension percentages, active-voice quotas or grade-level targets without primary evidence. It is UX copy guidance, not financial teaching or fact checking. |
| `blader/humanizer` | About 37.9k stars, 54 commits, version 2.11.2 and active maintenance | Primarily a Markdown editing prompt; repository also contains packaging/agent support. Current instructions preserve claims and forbid invented facts | MIT | **Use selectively, post-fact.** Good as a final prose smell check for inflated claims, filler and chatbot habits. It must never rewrite numbers, citations or uncertainty. Some surface heuristics can make technical prose worse if treated as bans. “Human-sounding” is not evidence of quality. |
| `anthropics/skills` → `frontend-design` | Very popular, actively maintained official repository; compact 55-line Skill | No task-specific script; design instructions emphasize subject-specific structure, typography and anti-template choices | Apache-2.0 for this Skill | **Reference only for FinPath editorial work.** It supports the existing anti-AI visual principle, but its encouragement of aesthetic risk and motion is not a learning-content method and can pull a restrained finance product off course. |
| `84emllc/claude-wcag-skill` | New/small: 0 stars, 9 commits | `SKILL.md`, a 55-item A/AA checklist, verbatim WCAG reference, `curl + pandoc` reference-build script and a Node consistency validator | MIT for Skill/scripts; W3C Document License for the reproduced spec | **Use selectively after manual review.** Strong separation of automated, keyboard, zoom/reflow and screen-reader passes. Do not run its network build script for ordinary use; cite W3C directly and preserve W3C attribution if redistributing the bundled spec. Small adoption means FinPath must verify the checklist itself. |
| `drader/researcher_agent` → `research` | 1 star, 3 commits; version 1.0.0 published in 2026 | Large multi-mode framework with 21 sub-agent personas, templates, scripts, web/database searches, file output and mandatory checkpoints | CC BY-NC 4.0; commercial use restricted | **Avoid installing.** Its primary-source, no-fabrication and disagreement rules are worth referencing, but the license conflicts with a possible future commercial FinPath and the orchestration/permissions are far beyond the need. |

Sources inspected: [`ux-writing-skill` SKILL.md](https://github.com/content-designer/ux-writing-skill/blob/main/SKILL.md), [its MIT license](https://github.com/content-designer/ux-writing-skill/blob/main/LICENSE), [its packaging script](https://github.com/content-designer/ux-writing-skill/blob/main/build-skill.sh), [`blader/humanizer`](https://github.com/blader/humanizer), [`frontend-design` SKILL.md](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md), [its Apache-2.0 license](https://github.com/anthropics/skills/blob/main/skills/frontend-design/LICENSE.txt), [`claude-wcag-skill`](https://github.com/84emllc/claude-wcag-skill), and [`researcher_agent` research Skill](https://github.com/drader/researcher_agent/blob/main/skills/research/SKILL.md).

### Humanizer-specific conclusion

The inspected `humanizer` guidance influenced this draft only as a checklist against puffed significance, vague sources, filler, chatbot praise and repetitive cadence. I did **not** adopt its more subjective “add personality/soul” advice for financial facts. That advice can introduce unsourced opinion, fake anecdotes or unnecessary informality. FinPath’s better safeguard is an evidence-locked draft followed by human editorial review.

### Recommended future internal Skill

Do not install any candidate now. After the style guide has been tested on at least three concepts and one real user session, create a small internal `.codex/skills/finpath-editorial/SKILL.md` if the workflow is genuinely repetitive.

It should:

- load the reviewed FinPath style guide and lesson schema;
- freeze numbers, dates, units, citations and source labels before editing;
- require a fact/source/interpretation/unknown classification;
- reject vague causal claims and BUY/SELL language;
- preserve English terms in Chinese explanations;
- output a short editorial QA report;
- contain no executable scripts or network permissions in its first version.

No external candidate currently combines beginner financial pedagogy, FinPath’s evidence contract, bilingual rescue and its advice boundary well enough to use directly.

## 10. Content source hierarchy

### Tier 1 — primary evidence

- SEC and other regulator filings.
- Company investor-relations releases, presentations and call transcripts.
- Government statistics, central banks and official agencies such as Bank Negara Malaysia, DOSM, the Federal Reserve, BLS and World Bank datasets where appropriate.
- Statutes, rules and regulator guidance for legal/regulatory explanations.

Use for reported values, dates, company statements, official definitions and policy facts. A company’s explanation remains attributed to the company; primary does not mean unbiased.

### Tier 2 — high-quality synthesis and reporting

- Reputable financial journalism with named authors, dates, corrections and links to evidence.
- Research from established institutions with disclosed methods and conflicts.
- Peer-reviewed learning science for teaching-system claims.

Use to supply context, alternative explanations and synthesis. Do not let one article become the sole evidence for a causal claim when the underlying primary source is available.

### Tier 3 — reviewed educational/reference material

- Investor.gov, Investopedia and other reference sources with visible editorial processes.
- Textbooks and professional educational bodies.

Use for definitions, examples and misconception checks. Definitions stored in FinPath must still list their reviewed sources and review date.

### Tier 4 — community and experience

- User interviews, support messages, forums, app reviews, Reddit and social posts.

Use for language, confusion, sentiment and lived experience. Never use as the source of a financial fact or a claim about why a company’s results changed.

### Claim language policy

| Evidence state | Allowed wording |
|---|---|
| Directly reported or reproducibly calculated | “is/was”, with source, period and unit |
| A named source’s own explanation | “Apple reported/said/attributed…”, with source |
| Multiple credible facts support a connection but do not prove it | “may”, “could”, “appears consistent with”, and name the evidence |
| Competing explanations remain | “Possible contributors include…; the available evidence does not isolate them” |
| Evidence is insufficient | “The cause is uncertain” or omit the explanation |

## 11. AI Tutor boundary and roadmap

The Tutor should enter only after FinPath has:

1. a reviewed concept graph and prerequisite states;
2. a stable lesson/content schema with source fields;
3. at least several human-reviewed lessons and examples;
4. a tested fact/source/interpretation/unknown contract;
5. explicit advice and escalation policies;
6. evaluation cases for English and Chinese explanations.

That places Tutor **after the structured learning loop is proven**, not as the next milestone.

### Appropriate eventual roles

- Rephrase a reviewed explanation at a simpler level.
- Answer “why?” while identifying which part is fact, context or interpretation.
- Connect the current concept to one the learner already used.
- Provide a Chinese explanation while preserving the English term.
- Guide the learner through a source excerpt.
- Generate a small hypothetical example clearly labelled as hypothetical.
- Suggest the next investigation, not the conclusion.
- Remember lightweight concept states with the user’s consent.

### Hard boundaries

- No BUY/SELL/HOLD recommendation or price target.
- No claim to predict performance.
- No unaudited causal story generated from a chart.
- No replacing the path with a blank chat box.
- No silent change to financial facts, sources or uncertainty.
- No uploading sensitive finance details merely to personalize an explanation.
- When current or high-stakes facts matter, retrieve and cite; otherwise state that the Tutor does not know.

Brilliant’s tutor framing is useful here: ask and scaffold rather than immediately tell, then reduce support as the learner gains competence. The Tutor should eventually make itself less necessary for familiar concepts, not become the product’s permanent front door. See [Brilliant’s learning approach](https://brilliant.org/about/).

## 12. The FinPath learning model

### Core philosophy

> **See it. Notice it. Explain it. Use it. Verify it. Continue.**

- **See it:** begin with real money, a company fact or a real decision.
- **Notice it:** give the beginner one clear observational job.
- **Explain it:** name the standard term and connect it to what is visible.
- **Use it:** one low-pressure application with feedback.
- **Verify it:** show the evidence and its limits.
- **Continue:** one next concept plus a later revisit.

### How the parts fit

```text
Guided concept path
        |
        v
Real fact or decision ---> one guided observation
        |                         |
        v                         v
Learning Margin ---------> one small application
        |                         |
        +-----------> Source Explainer
                               |
                               v
                    concept state + next step
                               |
                               v
                      gentle later revisit
```

The “Learning Trace” remains the visual signature, but it now has a pedagogical contract: every trace should connect a real fact to meaning, limitation and evidence, then ask the learner to do one useful thing.

## 13. Product risks and countermeasures

| Drift | Early warning | Countermeasure |
|---|---|---|
| Generic finance dashboard | More metrics appear without a learning job | Every metric needs prerequisite, purpose, limitation and next investigation |
| News aggregator | Daily publishing target creates unrelated stories | Publish only concept-linked stories with a reason they matter to this learner |
| AI chatbot wrapper | Home becomes an empty prompt box | Structured path and real records remain primary; Tutor is contextual |
| Duolingo clone | XP/streak work ships before retention evidence | Track understanding and revisit, not activity volume |
| Trading app | Price, P&L and urgency dominate | Business evidence and learning state dominate; no trade execution |
| Beginner feature maze | Navigation advertises unbuilt or unexplained areas | Keep one next step and progressive disclosure |
| False causal confidence | Chart narration says “because” from correlation | Separate observation, attributed context, interpretation and unknown |
| Source theatre | A SEC link exists but no one can use it | Show evidence excerpt and match logic before the raw filing |
| Content at scale, quality later | AI drafts dozens of lessons | Human-reviewed content schema, source hierarchy and small release batches |
| Bilingual fragmentation | Chinese translation replaces the English vocabulary | Preserve English terms and translate explanations, sources and uncertainty consistently |

## 14. Exactly one next implementation milestone

> **Milestone: Guided Revenue History Insight for AAPL**

### Why this is the highest-leverage next step

It addresses the strongest observed failure in the live product: the learner sees five correct bars and does not know what to do with them. It also tests the proposed FinPath learning model using the existing real SEC pipeline and existing Revenue concept. No second metric or new product area is required.

The slice should:

- calculate year-over-year changes from the existing normalized annual Revenue series;
- select one notable observation using a documented deterministic rule;
- ask one beginner observation question before revealing the explanation;
- show the directly observable fact separately from any sourced business context;
- include one boundary question such as “Does this alone prove the company became worse?”;
- preserve the exact table, periods and current SEC provenance;
- work with keyboard, screen reader, desktop and mobile;
- use reviewed static/sourced context for the selected Apple period, not an AI-generated story.

### What it deliberately does not solve

- It does not add Profit or another metric.
- It does not implement the full Source Explainer or exact Inline XBRL line locator.
- It does not create accounts, progress sync, notifications or a return schedule.
- It does not add news, Tutor, gamification or personalized content.
- It does not generalize causal context to every company.

### Success in a real-user test

After using the page once, a complete beginner should be able to answer, without guessing:

1. What was the most notable change in the displayed Revenue history?
2. Which part came directly from the numbers?
3. Which part was context reported by a source?
4. Why does the change alone not prove the company became good or bad?
5. What would they investigate next?

Success is not time-on-page or another click. It is the learner correctly separating observation from explanation and asking a better next question.

## Research limitations

- Most product documentation explains intended behavior, not independent learning outcomes. Vendor engagement and efficacy claims were not treated as causal proof.
- Public product pages cannot reveal every current onboarding or notification variant without creating accounts and running longitudinal tests.
- The learning path is a research-backed product hypothesis. It still needs beginner interviews and comprehension tests.
- Inline XBRL line matching must be prototyped against multiple issuers, custom tags, duplicate facts and amended filings before FinPath promises exact source locations.
- No external Skill was installed, so candidate behavior was assessed from its repository, `SKILL.md`, bundled resources, scripts and license rather than from running it.
