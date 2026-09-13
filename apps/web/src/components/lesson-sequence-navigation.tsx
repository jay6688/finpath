"use client";

import Link from "next/link";

import { useLearningProgress } from "@/components/learning-progress-provider";
import {
  getAdjacentLessons,
  type ConceptId,
} from "@/lib/lesson-catalog";

type LessonSequenceNavigationProps = {
  completeCurrentOnNext?: boolean;
  currentConceptId: ConceptId;
};

export function LessonSequenceNavigation({
  completeCurrentOnNext = false,
  currentConceptId,
}: LessonSequenceNavigationProps) {
  const { markExplored } = useLearningProgress();
  const { previous, next } = getAdjacentLessons(currentConceptId);

  return (
    <footer className="lesson-sequence">
      <nav aria-label="Lesson sequence">
        {previous ? (
          <Link className="lesson-sequence__previous" href={previous.href}>
            <span>Previous lesson</span>
            <strong>← {previous.title}</strong>
          </Link>
        ) : (
          <span className="lesson-sequence__edge" aria-hidden="true" />
        )}

        {next ? (
          <Link
            className="lesson-sequence__next"
            href={next.href}
            onClick={() => {
              if (completeCurrentOnNext) markExplored([currentConceptId]);
            }}
          >
            <span>Next lesson</span>
            <strong>{next.title} →</strong>
          </Link>
        ) : (
          <div className="lesson-sequence__coming">
            <span>More concepts coming</span>
            <strong>The next concept is still being validated.</strong>
          </div>
        )}
      </nav>

      <div className="lesson-explore-link">
        <div>
          <span>Explore this company</span>
          <strong>Inspect Apple’s real financial record.</strong>
        </div>
        <Link href="/company/aapl">Explore Apple →</Link>
      </div>
    </footer>
  );
}
