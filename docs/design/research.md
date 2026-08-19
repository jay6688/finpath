# V0 Design Research and Direction

**Collected:** 2026-08-19

> This remains the approved company-metric detail direction. It is no longer
> proposed as the global app language; see
> [`product-visual-direction.md`](product-visual-direction.md) for the revised
> product shell and responsive system awaiting approval.

## Product-pattern findings

- Simply Wall St demonstrates useful progressive disclosure, but a single visual score can over-compress a nuanced company judgment.
- Koyfin demonstrates strong financial chart/table workflows, but its default information density is too high for FinPath's first user.
- Quartr reinforces the value of first-party material and source traceability.
- Investopedia demonstrates a useful definition → example → comparison → FAQ teaching structure, but separates learning from live company exploration.
- Duolingo's guided path demonstrates the value of one clear next step and built-in review.
- Zogo demonstrates short, gamified financial content, while FinPath must keep learning—not reward redemption or trading—central.

## Direction: Annotated Financial Record

FinPath should feel like a trustworthy company record that teaches in its margins, not a financial terminal and not a children's game.

The first visual signature is **Learning Margin**: the metric, its period, source, meaning, importance, and limitation remain visually connected.

```text
Revenue $416.2B
      │
      └──────── What is Revenue?
                Why it matters
                What it cannot tell you
                Revenue ≠ profit
```

On desktop the explanation occupies a companion margin. On mobile it opens in the document flow directly below the related metric. V0 avoids chatbot bubbles and AI mascots.

## Initial tokens

| Role | Value |
|---|---|
| Canvas | `#F4F7F8` |
| Surface | `#FFFFFF` |
| Ink | `#14232B` |
| Muted | `#60717B` |
| Trust / jade | `#176B5B` |
| Learning / amber | `#C87924` |
| Divider | `#D7E0E3` |

Planned type roles are Public Sans for UI/body, IBM Plex Mono for financial values, and Source Serif 4 for explanatory prose. The scaffold uses safe local fallbacks until font files and licenses are deliberately added.

## Chart direction

Revenue history is discrete annual data, so the default V0 visualization is a five-year bar chart rather than a continuous line. It must have a visible table equivalent, keyboard focus, exact values, explicit periods, and non-color cues.

## Skill review

Anthropic's `frontend-design` directory was inspected. It contains only `SKILL.md` and an Apache-2.0 license, with no executable scripts or extra assets. Its subject-grounded planning and self-critique process is suitable guidance for the implementation stage, but it was not installed.

Anthropic's `webapp-testing` includes a Python server-management script that launches shell commands and writes test artifacts. A public 2026 issue also notes missing permission declarations. FinPath will instead keep Playwright tests in this repository and use already-available browser tooling for visual QA.

## Sources reviewed

- https://simplywall.st/stocks/us/tech/nasdaq-aapl/apple
- https://www.koyfin.com/features/
- https://quartr.com/
- https://www.investopedia.com/terms/r/revenue.asp
- https://blog.duolingo.com/new-duolingo-home-screen-design/
- https://zogo.com/
- https://github.com/anthropics/skills/tree/main/skills/frontend-design
- https://github.com/anthropics/skills/tree/main/skills/webapp-testing
