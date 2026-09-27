"use client";

import Link from "next/link";

import { useLearningProgress } from "@/components/learning-progress-provider";
import type { SupportedCompany } from "@/lib/api";
import {
  getAdjacentLessons,
  type ConceptId,
} from "@/lib/lesson-catalog";

type LessonSequenceNavigationProps = {
  completeCurrentOnNext?: boolean;
  currentConceptId: ConceptId;
  selectedCompany?: Pick<SupportedCompany, "name" | "slug" | "ticker">;
  showExploreCompany?: boolean;
};

export function LessonSequenceNavigation({
  completeCurrentOnNext = false,
  currentConceptId,
  selectedCompany,
  showExploreCompany = true,
}: LessonSequenceNavigationProps) {
  const { markExplored, progress } = useLearningProgress();
  const { previous, next } = getAdjacentLessons(currentConceptId);
  const isCurrentPathComplete =
    currentConceptId === "capstone" &&
    progress.exploredConceptIds.includes("capstone");
  const companyQuery = selectedCompany ? `?company=${selectedCompany.slug}` : "";
  const companyAwareLessons = new Set<ConceptId>([
    "revenue",
    "revenue-growth",
    "balance-sheet",
    "cash-and-debt",
    "eps-and-share-count",
    "market-cap",
    "pe-ratio",
    "business-model",
    "capstone",
  ]);
  const previousHref =
    previous && companyAwareLessons.has(previous.id)
      ? `${previous.href}${companyQuery}`
      : previous?.href;
  const nextHref =
    next && companyAwareLessons.has(next.id)
      ? `${next.href}${companyQuery}`
      : next?.href;

  return (
    <footer className="lesson-sequence">
      <nav aria-label="Lesson sequence">
        {previous ? (
          <Link className="lesson-sequence__previous" href={previousHref ?? previous.href}>
            <span>Previous lesson</span>
            <strong>← {previous.title}</strong>
          </Link>
        ) : (
          <span className="lesson-sequence__edge" aria-hidden="true" />
        )}

        {next ? (
          <Link
            className="lesson-sequence__next"
            href={nextHref ?? next.href}
            onClick={() => {
              if (completeCurrentOnNext) markExplored([currentConceptId]);
            }}
          >
            <span>Next lesson</span>
            <strong>{next.title} →</strong>
          </Link>
        ) : (
          <div className="lesson-sequence__coming">
            <span>
              {isCurrentPathComplete
                ? "Current path complete"
                : currentConceptId === "capstone"
                  ? "Final lesson"
                  : "More concepts coming"}
            </span>
            <strong>
              {isCurrentPathComplete
                ? "Company Analysis Basics complete"
                : currentConceptId === "capstone"
                  ? "Finish the Capstone to complete this path."
                  : "The next concept is still being validated."}
            </strong>
          </div>
        )}
      </nav>

      {showExploreCompany ? (
        <div className="lesson-explore-link">
          <div>
            <span>Explore this company</span>
            <strong>
              Inspect {selectedCompany?.name ?? "Apple Inc."}&apos;s real financial record.
            </strong>
          </div>
          <Link href={`/company/${selectedCompany?.slug ?? "aapl"}`}>
            Explore {selectedCompany?.ticker ?? "AAPL"} →
          </Link>
        </div>
      ) : null}
    </footer>
  );
}
