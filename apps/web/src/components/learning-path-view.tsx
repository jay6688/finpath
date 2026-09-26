"use client";

import Link from "next/link";

import { useLearningProgress } from "@/components/learning-progress-provider";
import {
  deriveConceptState,
  type ConceptProgressState,
} from "@/lib/learning-progress";
import { lessonCatalog } from "@/lib/lesson-catalog";

function actionLabel(state: ConceptProgressState, firstLesson = false): string {
  if (state === "explored") return "Review";
  if (state === "current") return firstLesson ? "Start" : "Continue";
  return "Open now";
}

function LearningState({ state }: { state: ConceptProgressState }) {
  return <span className="learning-state">{state}</span>;
}

export function LearningPathView() {
  const { progress } = useLearningProgress();

  return (
    <div className="learn-shell">
      <header className="learn-header">
        <p className="eyebrow">Learning path</p>
        <h1>Company Analysis Basics</h1>
        <p>
          Thirteen concepts, with reviewed real-company examples. Follow the
          recommended order or revisit any lesson you have explored.
        </p>
      </header>

      <div className="learn-layout">
        <ol className="learn-path" aria-label="Company Analysis Basics concepts">
          {lessonCatalog.map((lesson) => {
            const state = deriveConceptState(lesson.id, progress);
            return (
              <li
                aria-current={state === "current" ? "step" : undefined}
                data-state={state}
                key={lesson.id}
              >
                <span className="learn-path__marker" aria-hidden="true">
                  {String(lesson.number).padStart(2, "0")}
                </span>
                <article>
                  <header>
                    <h2>{lesson.title}</h2>
                    <LearningState state={state} />
                  </header>
                  <p>{lesson.shortGoal}</p>
                  <Link href={lesson.href}>
                    {actionLabel(state, lesson.id === "revenue")} lesson
                    <span aria-hidden="true">→</span>
                  </Link>
                </article>
              </li>
            );
          })}
        </ol>

        <aside className="learn-aside" aria-labelledby="learn-explore-heading">
          <p className="eyebrow">Explore freely</p>
          <h2 id="learn-explore-heading">Research stays separate.</h2>
          <p>
            Lessons explain financial concepts. Explore lets you inspect a company&apos;s
            real reported record directly.
          </p>
          <Link href="/company/aapl">Explore Apple →</Link>
          <small>
            Learning progress is saved in this browser for now. It is not synced
            to an account.
          </small>
        </aside>
      </div>

      <p className="learn-coming-later">
        <strong>More concepts coming.</strong> The next concept is still being validated.
      </p>
    </div>
  );
}
