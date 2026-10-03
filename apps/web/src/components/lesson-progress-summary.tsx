"use client";

import { useLearningProgress } from "@/components/learning-progress-provider";
import {
  deriveConceptState,
  type ConceptId,
} from "@/lib/learning-progress";
import { lessonCatalog } from "@/lib/lesson-catalog";

import styles from "./lesson-chrome.module.css";

export function LessonProgressSummary({ conceptId }: { conceptId: ConceptId }) {
  const { progress } = useLearningProgress();
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
