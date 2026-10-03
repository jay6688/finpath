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

function LearningState({ state }: { state: ConceptProgressState }) {
  const labels: Record<ConceptProgressState, string> = {
    explored: "Complete",
    current: "Current",
    available: "Available",
  };
  return <span className={styles.lessonState}>{labels[state]}</span>;
}

export function LearningPathView() {
  const { progress } = useLearningProgress();
  const recommendation = deriveHomeRecommendation(progress);
  const completedCount = progress.exploredConceptIds.length;
  const isPathComplete = completedCount === lessonCatalog.length;
  const currentLesson = lessonCatalog.find(
    (lesson) => lesson.id === recommendation.conceptId,
  )!;

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
        <aside className={styles.currentPanel} aria-labelledby="current-lesson-heading">
          <div className={styles.currentIdentity}>
            <p>{isPathComplete ? "Path complete" : "Your current lesson"}</p>
            <span>Lesson {currentLesson.number} of {lessonCatalog.length}</span>
          </div>
          <h2 id="current-lesson-heading">{recommendation.title}</h2>
          <p className={styles.currentGoal}>{recommendation.goal}</p>
          <div className={styles.progressSummary}>
            <p><strong>{completedCount} / {lessonCatalog.length}</strong> complete</p>
            <progress
              aria-label={`${completedCount} of ${lessonCatalog.length} lessons complete`}
              max={lessonCatalog.length}
              value={completedCount}
            />
          </div>
          <Link className={styles.primaryAction} href={recommendation.href}>
            {isPathComplete ? "Review Capstone" : `${recommendation.action} lesson`}
            <span aria-hidden="true">→</span>
          </Link>
          <small>Progress is saved in this browser and is not synced to an account.</small>
        </aside>

        <section className={styles.path} aria-labelledby="learning-path-heading">
          <header className={styles.pathHeader}>
            <p>Seven chapters <span aria-hidden="true">·</span> Fifteen lessons</p>
            <h2 id="learning-path-heading">See how each idea connects.</h2>
          </header>

          <div className={styles.chapters}>
            {lessonChapters.map((chapter, chapterIndex) => {
              const chapterCompleted = chapter.lessons.filter((lesson) =>
                progress.exploredConceptIds.includes(lesson.id),
              ).length;
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
                      {chapterCompleted} / {chapter.lessons.length} complete
                    </span>
                  </header>

                  <ol className={styles.lessonList} start={chapter.lessons[0].number}>
                    {chapter.lessons.map((lesson) => {
                      const state = deriveConceptState(lesson.id, progress);
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
                              {actionLabel(state, lesson.id === "revenue")}{" "}
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
