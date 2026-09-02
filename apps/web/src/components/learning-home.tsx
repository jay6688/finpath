"use client";

import Link from "next/link";

import { useLearningProgress } from "@/components/learning-progress-provider";
import {
  deriveConceptState,
  deriveHomeRecommendation,
  type ConceptProgressState,
} from "@/lib/learning-progress";

function StateLabel({ state }: { state: ConceptProgressState }) {
  return <span className="learning-state">{state}</span>;
}

export function LearningHome() {
  const { progress } = useLearningProgress();
  const recommendation = deriveHomeRecommendation(progress);
  const revenueState = deriveConceptState("revenue", progress);
  const growthState = deriveConceptState("revenue-growth", progress);
  const profitState = deriveConceptState("profit", progress);
  const marginState = deriveConceptState("net-profit-margin", progress);

  return (
    <div className="home-shell learning-home">
      <section className="home-intro learning-home__intro" aria-labelledby="home-heading">
        <p className="eyebrow">Learn with real company data</p>
        <h1 id="home-heading">Understand one financial idea at a time.</h1>
        <p className="home-intro__copy">
          Follow a recommended path, or explore Apple&apos;s real financial records
          whenever curiosity takes you elsewhere.
        </p>
      </section>

      <section className="home-learning-next" aria-labelledby="next-step-heading">
        <div className="home-learning-next__main">
          <p className="eyebrow">Your next step</p>
          <h2 id="next-step-heading">{recommendation.title}</h2>
          <p>{recommendation.goal}</p>
          <Link className="primary-action" href={recommendation.href}>
            {recommendation.action}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
        <aside className="home-learning-next__context" aria-label="Learning path context">
          <span>Path</span>
          <strong>Company Analysis Basics</strong>
          <span>Approach</span>
          <p>Recommended order. Existing lessons remain open.</p>
        </aside>
      </section>

      <section className="home-path-preview" aria-labelledby="home-path-heading">
        <header>
          <div>
            <p className="eyebrow">Learning path</p>
            <h2 id="home-path-heading">See where this leads</h2>
          </div>
          <Link href="/learn">View full learning path →</Link>
        </header>

        <ol>
          <li data-state={revenueState} aria-current={revenueState === "current" ? "step" : undefined}>
            <span className="home-path-preview__marker" aria-hidden="true" />
            <div>
              <strong>Revenue</strong>
              <small>Understand Apple&apos;s top line</small>
              <div className="home-path-preview__substep">
                <span>Revenue Growth</span>
                <StateLabel state={growthState} />
              </div>
            </div>
            <StateLabel state={revenueState} />
          </li>
          <li data-state={profitState} aria-current={profitState === "current" ? "step" : undefined}>
            <span className="home-path-preview__marker" aria-hidden="true" />
            <div><strong>Profit / Net Income</strong><small>Follow reported costs and expenses</small></div>
            <StateLabel state={profitState} />
          </li>
          <li data-state={marginState} aria-current={marginState === "current" ? "step" : undefined}>
            <span className="home-path-preview__marker" aria-hidden="true" />
            <div><strong>Net Profit Margin</strong><small>Put Net Income on a $100 Revenue scale</small></div>
            <StateLabel state={marginState} />
          </li>
          <li data-state="coming-later">
            <span className="home-path-preview__marker" aria-hidden="true" />
            <div><strong>More concepts coming</strong><small>No unbuilt lesson is being promised yet</small></div>
            <span className="learning-state">Coming later</span>
          </li>
        </ol>

      </section>

      <section className="home-explore" aria-labelledby="home-explore-heading">
        <div>
          <p className="eyebrow">Explore freely</p>
          <h2 id="home-explore-heading">The path guides. It does not lock.</h2>
          <p>Inspect Apple&apos;s Revenue and SEC provenance at any time.</p>
        </div>
        <Link href="/company/aapl">Explore Apple →</Link>
      </section>
    </div>
  );
}
