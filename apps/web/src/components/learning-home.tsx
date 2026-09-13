"use client";

import Link from "next/link";

import { useLearningProgress } from "@/components/learning-progress-provider";
import { deriveHomeRecommendation } from "@/lib/learning-progress";
import { lessonCatalog } from "@/lib/lesson-catalog";

export function LearningHome() {
  const { progress } = useLearningProgress();
  const recommendation = deriveHomeRecommendation(progress);
  const exploredCount = progress.exploredConceptIds.length;

  return (
    <div className="home-shell learning-home">
      <section className="home-intro learning-home__intro" aria-labelledby="home-heading">
        <p className="eyebrow">Learn with real company data</p>
        <h1 id="home-heading">Understand one financial idea at a time.</h1>
        <p className="home-intro__copy">
          Follow a guided learning path, or inspect Apple&apos;s real financial
          record when you want to explore.
        </p>
      </section>

      <section className="home-learning-next" aria-labelledby="next-step-heading">
        <div className="home-learning-next__main">
          <p className="eyebrow">Your next step</p>
          <h2 id="next-step-heading">{recommendation.title}</h2>
          <p>{recommendation.goal}</p>
          <Link className="primary-action" href={recommendation.href}>
            {recommendation.action} lesson
            <span aria-hidden="true">→</span>
          </Link>
        </div>
        <aside className="home-learning-next__context" aria-label="Learning path context">
          <span>Company Analysis Basics</span>
          <strong>
            {exploredCount} of {lessonCatalog.length} concepts explored
          </strong>
          <Link href="/learn">View learning path →</Link>
        </aside>
      </section>

      <section className="home-explore home-explore--clear" aria-labelledby="home-explore-heading">
        <div>
          <p className="eyebrow">Explore real companies</p>
          <h2 id="home-explore-heading">Apple Inc.</h2>
          <p>View real financial records, exact reporting periods, and SEC evidence.</p>
        </div>
        <Link href="/company/aapl">Explore Apple →</Link>
      </section>
    </div>
  );
}
