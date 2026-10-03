import Link from "next/link";
import type { ReactNode } from "react";

import { LessonProgressSummary } from "@/components/lesson-progress-summary";
import { LessonSequenceNavigation } from "@/components/lesson-sequence-navigation";
import type { SupportedCompany } from "@/lib/api";
import { getLessonChapter } from "@/lib/lesson-chapters";
import {
  getLesson,
  lessonCatalog,
  type ConceptId,
} from "@/lib/lesson-catalog";

import styles from "./lesson-chrome.module.css";

type LessonShellProps = {
  children: ReactNode;
  completeCurrentOnNext?: boolean;
  conceptId: ConceptId;
  example: string;
  exampleSelector?: ReactNode;
  selectedCompany?: Pick<SupportedCompany, "name" | "slug" | "ticker">;
  showExploreCompany?: boolean;
};

export function LessonShell({
  children,
  completeCurrentOnNext = false,
  conceptId,
  example,
  exampleSelector,
  selectedCompany,
  showExploreCompany = true,
}: LessonShellProps) {
  const lesson = getLesson(conceptId);
  const chapter = getLessonChapter(conceptId);

  return (
    <div className={`company-shell profit-page-shell lesson-page-shell ${styles.page}`}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/learn">Learn</Link>
        <span aria-hidden="true">/</span>
        <strong>{lesson.title}</strong>
      </nav>

      <header className={styles.chrome}>
        <div className={styles.identity}>
          <p className={styles.modeLabel}>
            Learn <span aria-hidden="true">·</span> Guided understanding
          </p>
          <p className={styles.position}>
            <span>Company Analysis Basics</span>
            <span aria-hidden="true">·</span>
            Lesson {lesson.number} of {lessonCatalog.length}
            <span aria-hidden="true">·</span>
            <span>{chapter.title}</span>
          </p>
          <h1>{lesson.title}</h1>
          <p className={styles.goal}>{lesson.shortGoal}</p>
        </div>

        <aside className={styles.context} aria-label="Lesson context">
          <LessonProgressSummary conceptId={conceptId} />
          <div className={styles.example}>
            <span>Reviewed example</span>
            <strong>{example}</strong>
            {exampleSelector}
          </div>
        </aside>
      </header>

      <div className={styles.body}>{children}</div>

      <LessonSequenceNavigation
        completeCurrentOnNext={completeCurrentOnNext}
        currentConceptId={conceptId}
        selectedCompany={selectedCompany}
        showExploreCompany={showExploreCompany}
      />
    </div>
  );
}
