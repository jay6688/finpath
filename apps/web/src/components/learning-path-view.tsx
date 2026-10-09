"use client";

import Link from "next/link";

import { useLearningProgress } from "@/components/learning-progress-provider";
import { lessonChapters } from "@/lib/lesson-chapters";
import { lessonCatalog } from "@/lib/lesson-catalog";
import {
  deriveConceptState,
  deriveHomeRecommendation,
  type ConceptProgressState,
} from "@/lib/learning-progress";

import styles from "./learning-path-view.module.css";

function actionLabel(state: ConceptProgressState, firstLesson = false): string {
  if (state === "explored") return "Review";
  if (state === "current") return firstLesson ? "Start" : "Continue";
  return "Open";
}

function LearningState({ state }: { state: ConceptProgressState | null }) {
  if (!state) return <span className={styles.lessonState}>Progress pending</span>;

  const labels: Record<ConceptProgressState, string> = {
    explored: "Complete",
    current: "Current",
    available: "Available",
  };
  return <span className={styles.lessonState}>{labels[state]}</span>;
}

export function LearningPathView() {
  const learningProgress = useLearningProgress();
  const recommendation = learningProgress.isHydrated
    ? deriveHomeRecommendation(learningProgress.progress)
    : null;
  const completedCount = learningProgress.isHydrated
    ? learningProgress.progress.exploredConceptIds.length
    : null;
  const isPathComplete = completedCount === lessonCatalog.length;
  const currentLesson = recommendation
    ? lessonCatalog.find((lesson) => lesson.id === recommendation.conceptId)
    : null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.modeLabel}>
          Learn <span aria-hidden="true">·</span> Guided understanding
        </p>
        <h1>Company Analysis Basics</h1>
        <p>
          Build a company view one connection at a time. Each lesson explains an
          idea, then grounds it in reviewed real-company evidence.
        </p>
      </header>

      <div className={styles.layout}>
        <aside
          className={styles.currentPanel}
          aria-busy={!learningProgress.isHydrated || undefined}
          aria-labelledby="current-lesson-heading"
        >
          <div className={styles.currentIdentity}>
            <p>
              {!learningProgress.isHydrated
                ? "Your learning path"
                : isPathComplete
                  ? "Company Analysis Basics complete."
                  : "Your current lesson"}
            </p>
            <span>
              {currentLesson
                ? `Lesson ${currentLesson.number} of ${lessonCatalog.length}`
                : "Progress pending"}
            </span>
          </div>
          <h2 id="current-lesson-heading">
            {recommendation?.title ?? "Loading saved progress…"}
          </h2>
          <p className={styles.currentGoal}>
            {recommendation?.goal ?? "Your saved place will appear here."}
          </p>
          <div className={styles.progressSummary}>
            {completedCount === null ? (
              <>
                <p><strong>Progress pending</strong></p>
                <progress
                  aria-label="Loading saved learning progress"
                  max={lessonCatalog.length}
                />
              </>
            ) : (
              <>
                <p><strong>{completedCount} / {lessonCatalog.length}</strong> complete</p>
                <progress
                  aria-label={`${completedCount} of ${lessonCatalog.length} lessons complete`}
                  max={lessonCatalog.length}
                  value={completedCount}
                />
              </>
            )}
          </div>
          {recommendation ? (
            <Link className={styles.primaryAction} href={recommendation.href}>
              {isPathComplete ? "Review Capstone" : `${recommendation.action} lesson`}
              <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <span
              aria-hidden="true"
              className={`${styles.primaryAction} ${styles.pendingAction}`}
            >
              Lesson action pending
            </span>
          )}
          <small>Progress is saved in this browser and is not synced to an account.</small>
        </aside>

        <section className={styles.path} aria-labelledby="learning-path-heading">
          <header className={styles.pathHeader}>
            <p>Seven chapters <span aria-hidden="true">·</span> Fifteen lessons</p>
            <h2 id="learning-path-heading">See how each idea connects.</h2>
          </header>

          <div className={styles.chapters}>
            {lessonChapters.map((chapter, chapterIndex) => {
              const chapterCompleted = learningProgress.isHydrated
                ? chapter.lessons.filter((lesson) =>
                    learningProgress.progress.exploredConceptIds.includes(lesson.id),
                  ).length
                : null;
              const headingId = `chapter-${chapter.id}`;

              return (
                <section
                  className={styles.chapter}
                  data-tone={chapter.tone}
                  aria-labelledby={headingId}
                  key={chapter.id}
                >
                  <header className={styles.chapterHeader}>
                    <div className={styles.chapterTrace} aria-hidden="true">
                      <span>{String(chapterIndex + 1).padStart(2, "0")}</span>
                      <i />
                    </div>
                    <p>{chapter.objectLabel}</p>
                    <h3 id={headingId}>{chapter.title}</h3>
                    <p>{chapter.purpose}</p>
                    <span className={styles.chapterProgress}>
                      {chapterCompleted === null
                        ? "Progress pending"
                        : `${chapterCompleted} / ${chapter.lessons.length} complete`}
                    </span>
                  </header>

                  <ol className={styles.lessonList} start={chapter.lessons[0].number}>
                    {chapter.lessons.map((lesson) => {
                      const state = learningProgress.isHydrated
                        ? deriveConceptState(lesson.id, learningProgress.progress)
                        : null;
                      return (
                        <li
                          aria-current={state === "current" ? "step" : undefined}
                          data-state={state}
                          key={lesson.id}
                        >
                          <Link href={lesson.href}>
                            <span className={styles.lessonNumber} aria-hidden="true">
                              {String(lesson.number).padStart(2, "0")}
                            </span>
                            <span className={styles.lessonCopy}>
                              <strong>{lesson.title}</strong>
                              <span>{lesson.shortGoal}</span>
                            </span>
                            <LearningState state={state} />
                            <span className={styles.lessonAction}>
                              {state ? actionLabel(state, lesson.id === "revenue") : "Open"}{" "}
                              <span aria-hidden="true">→</span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              );
            })}
          </div>

          <aside className={styles.modeNote} aria-labelledby="learn-explore-heading">
            <div>
              <p>Learn explains the connections.</p>
              <h2 id="learn-explore-heading">Research stays separate.</h2>
              <p>Explore lets you inspect a company&apos;s reviewed record directly.</p>
            </div>
            <Link href="/company/aapl">
              Explore Apple <span aria-hidden="true">→</span>
            </Link>
          </aside>
        </section>
      </div>
    </div>
  );
}
