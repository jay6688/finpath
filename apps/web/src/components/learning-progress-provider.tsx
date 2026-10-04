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
  createPendingLearningProgressState,
  getBrowserStorage,
  LEARNING_PROGRESS_STORAGE_KEY,
  markConceptsExplored,
  resolveLearningProgressState,
  writeLearningProgress,
  type ConceptId,
  type LearningProgressState,
} from "@/lib/learning-progress";

type LearningProgressContextValue = LearningProgressState & {
  markExplored: (conceptIds: readonly ConceptId[]) => void;
};

const LearningProgressContext = createContext<LearningProgressContextValue | null>(null);

export function LearningProgressProvider({ children }: { children: ReactNode }) {
  const [progressState, setProgressState] = useState(
    createPendingLearningProgressState,
  );

  useEffect(() => {
    setProgressState(resolveLearningProgressState(getBrowserStorage(window)));

    function syncProgress(event: StorageEvent) {
      if (event.key === LEARNING_PROGRESS_STORAGE_KEY) {
        setProgressState(resolveLearningProgressState(getBrowserStorage(window)));
      }
    }

    window.addEventListener("storage", syncProgress);
    return () => window.removeEventListener("storage", syncProgress);
  }, []);

  const markExplored = useCallback((conceptIds: readonly ConceptId[]) => {
    setProgressState((current) => {
      if (!current.isHydrated) return current;

      const next = markConceptsExplored(current.progress, conceptIds);
      writeLearningProgress(getBrowserStorage(window), next);
      return { isHydrated: true, progress: next };
    });
  }, []);

  const value = useMemo<LearningProgressContextValue>(
    () => ({ ...progressState, markExplored }),
    [markExplored, progressState],
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
