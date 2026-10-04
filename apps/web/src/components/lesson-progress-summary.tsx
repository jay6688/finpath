"use client";

import { useLearningProgress } from "@/components/learning-progress-provider";
import {
  deriveConceptState,
  type ConceptId,
} from "@/lib/learning-progress";
import { lessonCatalog } from "@/lib/lesson-catalog";

import styles from "./lesson-chrome.module.css";

export function LessonProgressSummary({ conceptId }: { conceptId: ConceptId }) {
  const learningProgress = useLearningProgress();

  if (!learningProgress.isHydrated) {
    return (
      <div
        aria-busy="true"
        className={styles.lessonProgress}
        data-state="pending"
        role="status"
      >
        <div>
          <span>Learning progress</span>
          <strong>Loading saved progress…</strong>
        </div>
        <progress
          aria-label="Loading saved learning progress"
          max={lessonCatalog.length}
        />
      </div>
    );
  }

  const { progress } = learningProgress;
  const completedCount = progress.exploredConceptIds.length;
  const state = deriveConceptState(conceptId, progress);
  const isPathComplete = completedCount === lessonCatalog.length;
  const stateLabel = isPathComplete
    ? "Path complete"
    : state === "explored"
      ? "Lesson complete"
      : state === "current"
        ? "Current lesson"
        : "Available lesson";

  return (
    <div className={styles.lessonProgress} data-state={state}>
      <div>
        <span>{stateLabel}</span>
        <strong>{completedCount} / {lessonCatalog.length} complete</strong>
      </div>
      <progress
        aria-label={`${completedCount} of ${lessonCatalog.length} lessons complete`}
        max={lessonCatalog.length}
        value={completedCount}
      />
    </div>
  );
}
