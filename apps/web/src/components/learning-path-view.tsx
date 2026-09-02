"use client";

import Link from "next/link";

import { useLearningProgress } from "@/components/learning-progress-provider";
import {
  deriveConceptState,
  type ConceptProgressState,
} from "@/lib/learning-progress";

function actionLabel(state: ConceptProgressState, startWhenCurrent = false): string {
  if (state === "explored") return "Review";
  if (state === "current") return startWhenCurrent ? "Start" : "Continue";
  return "Open now";
}

function LearningState({ state }: { state: ConceptProgressState }) {
  return <span className="learning-state">{state}</span>;
}

export function LearningPathView() {
  const { progress } = useLearningProgress();
  const revenueState = deriveConceptState("revenue", progress);
  const growthState = deriveConceptState("revenue-growth", progress);
  const profitState = deriveConceptState("profit", progress);
  const marginState = deriveConceptState("net-profit-margin", progress);

  return (
    <div className="learn-shell">
      <header className="learn-header">
        <p className="eyebrow">Learning path</p>
        <h1>Company Analysis Basics</h1>
        <p>
          Learn in this recommended order, revisit anything you have explored,
          or open any available lesson when you have a question.
        </p>
      </header>

      <div className="learn-layout">
        <ol className="learn-path" aria-label="Company Analysis Basics concepts">
          <li data-state={revenueState} aria-current={revenueState === "current" ? "step" : undefined}>
            <span className="learn-path__marker" aria-hidden="true" />
            <article>
              <header><h2>Revenue</h2><LearningState state={revenueState} /></header>
              <p>Understand what Apple earned from selling products and services before costs and expenses.</p>
              <div className="learn-path__substep" data-state={growthState}>
                <div><strong>Revenue Growth</strong><p>Compare annual Revenue and calculate year-over-year change inside the Revenue lesson.</p></div>
                <LearningState state={growthState} />
              </div>
              <Link href={growthState === "explored" ? "/company/aapl" : "/company/aapl#revenue-growth"}>
                {actionLabel(revenueState, revenueState === "current")} Revenue
                <span aria-hidden="true">→</span>
              </Link>
            </article>
          </li>

          <li data-state={profitState} aria-current={profitState === "current" ? "step" : undefined}>
            <span className="learn-path__marker" aria-hidden="true" />
            <article>
              <header><h2>Profit / Net Income</h2><LearningState state={profitState} /></header>
              <p>Trace Apple&apos;s reported income-statement lines from Revenue to Net Income, without confusing profit with cash.</p>
              <Link href="/company/aapl/profit">
                {actionLabel(profitState)} lesson
                <span aria-hidden="true">→</span>
              </Link>
            </article>
          </li>

          <li data-state={marginState} aria-current={marginState === "current" ? "step" : undefined}>
            <span className="learn-path__marker" aria-hidden="true" />
            <article>
              <header><h2>Net Profit Margin</h2><LearningState state={marginState} /></header>
              <p>Compare Net Income with Revenue to ask how much Net Income Apple reported for every $100 of Revenue.</p>
              <Link href="/company/aapl/profit-margin">
                {actionLabel(marginState)} lesson
                <span aria-hidden="true">→</span>
              </Link>
            </article>
          </li>

          <li data-state="coming-later">
            <span className="learn-path__marker" aria-hidden="true" />
            <article>
              <header><h2>More concepts coming</h2><span className="learning-state">Coming later</span></header>
              <p>The next company-analysis concept has not been chosen or built yet.</p>
            </article>
          </li>
        </ol>

        <aside className="learn-aside" aria-labelledby="learn-explore-heading">
          <p className="eyebrow">Explore freely</p>
          <h2 id="learn-explore-heading">The path guides. It does not lock.</h2>
          <p>Company research stays separate, so you can inspect Apple&apos;s real financial record at any time.</p>
          <Link href="/company/aapl">Explore Apple →</Link>
          <small>Learning progress is saved in this browser for now. It is not synced to an account.</small>
        </aside>
      </div>
    </div>
  );
}
