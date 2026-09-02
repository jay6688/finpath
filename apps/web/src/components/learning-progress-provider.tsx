"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  createDefaultLearningProgress,
  LEARNING_PROGRESS_STORAGE_KEY,
  markConceptsExplored,
  readLearningProgress,
  writeLearningProgress,
  type ConceptId,
  type LearningProgress,
} from "@/lib/learning-progress";

type LearningProgressContextValue = {
  progress: LearningProgress;
  markExplored: (conceptIds: readonly ConceptId[]) => void;
};

const LearningProgressContext = createContext<LearningProgressContextValue | null>(null);

export function LearningProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(createDefaultLearningProgress);

  useEffect(() => {
    setProgress(readLearningProgress(window.localStorage));

    function syncProgress(event: StorageEvent) {
      if (event.key === LEARNING_PROGRESS_STORAGE_KEY) {
        setProgress(readLearningProgress(window.localStorage));
      }
    }

    window.addEventListener("storage", syncProgress);
    return () => window.removeEventListener("storage", syncProgress);
  }, []);

  const markExplored = useCallback((conceptIds: readonly ConceptId[]) => {
    setProgress((current) => {
      const next = markConceptsExplored(current, conceptIds);
      writeLearningProgress(window.localStorage, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ progress, markExplored }),
    [markExplored, progress],
  );

  return (
    <LearningProgressContext.Provider value={value}>
      {children}
    </LearningProgressContext.Provider>
  );
}

export function useLearningProgress(): LearningProgressContextValue {
  const value = useContext(LearningProgressContext);
  if (!value) {
    throw new Error("useLearningProgress must be used inside LearningProgressProvider");
  }
  return value;
}
