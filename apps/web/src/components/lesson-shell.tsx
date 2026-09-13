import Link from "next/link";
import type { ReactNode } from "react";

import { LessonSequenceNavigation } from "@/components/lesson-sequence-navigation";
import {
  getLesson,
  lessonCatalog,
  type ConceptId,
} from "@/lib/lesson-catalog";

type LessonShellProps = {
  children: ReactNode;
  completeCurrentOnNext?: boolean;
  conceptId: ConceptId;
  example: string;
};

export function LessonShell({
  children,
  completeCurrentOnNext = false,
  conceptId,
  example,
}: LessonShellProps) {
  const lesson = getLesson(conceptId);

  return (
    <div className="company-shell profit-page-shell lesson-page-shell">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/learn">Learn</Link>
        <span aria-hidden="true">/</span>
        <Link href="/learn">Company Analysis Basics</Link>
        <span aria-hidden="true">/</span>
        <strong>{lesson.title}</strong>
      </nav>

      <header className="lesson-context-header">
        <div>
          <p className="eyebrow">Company Analysis Basics</p>
          <p className="lesson-context-header__position">
            Lesson {lesson.number} of {lessonCatalog.length}
          </p>
          <h1>{lesson.title}</h1>
        </div>
        <p className="lesson-context-header__example">
          <span>Real example</span>
          <strong>{example}</strong>
        </p>
      </header>

      {children}

      <LessonSequenceNavigation
        completeCurrentOnNext={completeCurrentOnNext}
        currentConceptId={conceptId}
      />
    </div>
  );
}
