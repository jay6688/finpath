"use client";

import Link from "next/link";
import { useState } from "react";

import { useLearningProgress } from "@/components/learning-progress-provider";
import { deriveHomeRecommendation } from "@/lib/learning-progress";

import styles from "./reconcept.module.css";

type NodeId = "business" | "revenue" | "profit" | "cash" | "position" | "per-share" | "valuation";

const concepts: Array<{
  id: NodeId;
  label: string;
  short: string;
  learnHref: string;
  connections: string;
  icon: string;
}> = [
  { id: "business", label: "Business", short: "What the company sells", learnHref: "/learn/company-analysis/business-model", connections: "Business creates Revenue through products, customers and markets.", icon: "▥" },
  { id: "revenue", label: "Revenue", short: "Money from customers", learnHref: "/learn/company-analysis/revenue", connections: "Revenue starts with the business and becomes the starting line for Profit.", icon: "▥" },
  { id: "profit", label: "Profit", short: "What remains after costs", learnHref: "/learn/company-analysis/profit", connections: "Profit connects Revenue to earnings, cash analysis and per-share results.", icon: "●" },
  { id: "cash", label: "Cash Flow", short: "How cash moves", learnHref: "/learn/company-analysis/operating-cash-flow", connections: "Cash Flow tests how accounting Profit connects to actual operating cash movement.", icon: "↝" },
  { id: "position", label: "Financial Position", short: "What it owns and owes", learnHref: "/learn/company-analysis/balance-sheet", connections: "Financial Position is the reporting-date home of cash, assets, claims and equity.", icon: "▣" },
  { id: "per-share", label: "Per Share", short: "Earnings for each share", learnHref: "/learn/company-analysis/eps-and-share-count", connections: "Per Share connects company-level Profit to the share count used for investors.", icon: "◒" },
  { id: "valuation", label: "Valuation", short: "How the market prices it", learnHref: "/learn/company-analysis/market-cap", connections: "Valuation adds a market assumption to reviewed company facts. FinPath keeps those roles separate.", icon: "▥" },
];

const edges: Array<[NodeId, NodeId]> = [
  ["business", "revenue"], ["revenue", "profit"], ["profit", "cash"],
  ["cash", "position"], ["profit", "per-share"], ["per-share", "valuation"],
  ["position", "valuation"],
];

export function ReconceptHome() {
  const { progress } = useLearningProgress();
  const recommendation = deriveHomeRecommendation(progress);
  const [active, setActive] = useState<NodeId>("profit");
  const selected = concepts.find((concept) => concept.id === active) ?? concepts[2];
  const related = new Set(edges.filter(([a, b]) => a === active || b === active).flat());
  const completed = progress.exploredConceptIds.length;

  return (
    <div className={styles.homeCanvas}>
      <section className={styles.homeHero}>
        <div className={styles.homePromise}>
          <p className={styles.kicker}>Real companies · connected records</p>
          <h1>Understand companies by exploring how their numbers <em>connect.</em></h1>
          <p>Start with a financial relationship, inspect it visually, then trace the real company record behind it.</p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} href={recommendation.href}>
              {recommendation.action} {recommendation.title} <span aria-hidden="true">→</span>
            </Link>
            <Link className={styles.secondaryAction} href="/design-lab/reconcept/apple">
              Explore Apple <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className={styles.atlasPanel}>
          <header className={styles.atlasHeading}>
            <div>
              <span>The Financial System</span>
              <strong>Concept relationships, not lesson order</strong>
            </div>
            <p>Choose an object to trace its role.</p>
          </header>

          <div className={styles.atlasMap} data-active={active}>
            <svg className={styles.atlasConnections} viewBox="0 0 760 510" role="img" aria-labelledby="atlas-title atlas-desc">
              <title id="atlas-title">Connected company financial concepts</title>
              <desc id="atlas-desc">Business connects to Revenue, Revenue to Profit, Profit to Cash Flow and Per Share, then into Financial Position and Valuation.</desc>
              <defs>
                <marker id="atlas-arrow" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
                  <path d="M0 0 8 4 0 8Z" />
                </marker>
              </defs>
              <path data-edge="business-revenue" d="M382 120 C310 135 255 168 222 215" />
              <path data-edge="revenue-profit" d="M280 252 C325 252 357 252 386 252" />
              <path data-edge="profit-cash" d="M477 240 C535 220 563 188 580 154" />
              <path data-edge="cash-position" d="M586 190 C565 285 500 350 430 391" />
              <path data-edge="profit-per-share" d="M445 301 C460 337 490 370 543 401" />
              <path data-edge="per-share-valuation" d="M599 418 C645 414 676 397 694 367" />
              <path data-edge="position-valuation" d="M478 420 C555 454 633 432 684 382" />
            </svg>
            {concepts.map((concept) => (
              <button
                aria-pressed={active === concept.id}
                className={styles.atlasNode}
                data-node={concept.id}
                data-related={related.has(concept.id)}
                key={concept.id}
                onClick={() => setActive(concept.id)}
                onFocus={() => setActive(concept.id)}
                onMouseEnter={() => setActive(concept.id)}
                type="button"
              >
                <span aria-hidden="true">{concept.icon}</span>
                <strong>{concept.label}</strong>
                <small>{concept.short}</small>
              </button>
            ))}
            <aside className={styles.atlasInspector} aria-live="polite">
              <span>Tracing now</span>
              <strong>{selected.label}</strong>
              <p>{selected.connections}</p>
              <div>
                <Link href={selected.learnHref}>Learn this concept →</Link>
                <Link href="/design-lab/reconcept/apple">See it in Apple →</Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className={styles.homeModes} aria-label="Ways to use FinPath">
        <article className={styles.modeLearn}>
          <div className={styles.modeGraphic} aria-hidden="true"><span>Revenue</span><i>→</i><span>Profit</span></div>
          <div><span>Guided understanding</span><h2>Learn</h2><p>Zoom into one relationship and build it step by step.</p></div>
          <Link href="/design-lab/reconcept/profit">Open the Profit lesson →</Link>
        </article>
        <article className={styles.modeExplore}>
          <div className={styles.modeGraphic} aria-hidden="true"><span>$416.161B</span><i>↗</i><span>SEC 10-K</span></div>
          <div><span>Independent research</span><h2>Explore</h2><p>Move through a real company record with evidence always recoverable.</p></div>
          <Link href="/design-lab/reconcept/apple">Open Apple research →</Link>
        </article>
        <aside className={styles.homeProgress}>
          <span>Your path</span>
          <strong>{completed} / 15 concepts explored</strong>
          <div aria-hidden="true"><span style={{ width: `${(completed / 15) * 100}%` }} /></div>
          <p>Next: {recommendation.title}</p>
        </aside>
      </section>
    </div>
  );
}
