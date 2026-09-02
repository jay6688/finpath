export const LEARNING_PROGRESS_STORAGE_KEY = "finpath.learning-progress";
export const LEARNING_PROGRESS_VERSION = 1 as const;

export const conceptIds = [
  "revenue",
  "revenue-growth",
  "profit",
  "net-profit-margin",
] as const;

export type ConceptId = (typeof conceptIds)[number];

export type LearningProgress = {
  version: typeof LEARNING_PROGRESS_VERSION;
  exploredConceptIds: ConceptId[];
};

export type ConceptProgressState = "explored" | "current" | "available";

export type StorageReader = Pick<Storage, "getItem">;
export type StorageWriter = Pick<Storage, "setItem">;

const knownConceptIds = new Set<string>(conceptIds);

export function createDefaultLearningProgress(): LearningProgress {
  return {
    version: LEARNING_PROGRESS_VERSION,
    exploredConceptIds: [],
  };
}

export function normalizeLearningProgress(value: unknown): LearningProgress {
  if (!value || typeof value !== "object") {
    return createDefaultLearningProgress();
  }

  const candidate = value as {
    version?: unknown;
    exploredConceptIds?: unknown;
  };

  if (
    candidate.version !== LEARNING_PROGRESS_VERSION ||
    !Array.isArray(candidate.exploredConceptIds)
  ) {
    return createDefaultLearningProgress();
  }

  const explored = new Set<ConceptId>();
  for (const conceptId of candidate.exploredConceptIds) {
    if (typeof conceptId === "string" && knownConceptIds.has(conceptId)) {
      explored.add(conceptId as ConceptId);
    }
  }

  // Revenue Growth is the meaningful interaction inside the grouped Revenue
  // milestone. A partial stored state is repaired instead of implying that the
  // sub-step was explored without its parent concept.
  if (explored.has("revenue-growth")) {
    explored.add("revenue");
  } else {
    explored.delete("revenue");
  }

  return {
    version: LEARNING_PROGRESS_VERSION,
    exploredConceptIds: conceptIds.filter((conceptId) => explored.has(conceptId)),
  };
}

export function readLearningProgress(
  storage: StorageReader | null | undefined,
): LearningProgress {
  if (!storage) return createDefaultLearningProgress();

  try {
    const stored = storage.getItem(LEARNING_PROGRESS_STORAGE_KEY);
    if (!stored) return createDefaultLearningProgress();
    return normalizeLearningProgress(JSON.parse(stored));
  } catch {
    return createDefaultLearningProgress();
  }
}

export function writeLearningProgress(
  storage: StorageWriter | null | undefined,
  progress: LearningProgress,
): boolean {
  if (!storage) return false;

  try {
    storage.setItem(
      LEARNING_PROGRESS_STORAGE_KEY,
      JSON.stringify(normalizeLearningProgress(progress)),
    );
    return true;
  } catch {
    return false;
  }
}

export function markConceptsExplored(
  progress: LearningProgress,
  conceptIdsToMark: readonly ConceptId[],
): LearningProgress {
  const explored = new Set(progress.exploredConceptIds);
  conceptIdsToMark.forEach((conceptId) => explored.add(conceptId));
  return normalizeLearningProgress({
    version: LEARNING_PROGRESS_VERSION,
    exploredConceptIds: [...explored],
  });
}

export function markRevenueMilestoneExplored(
  progress: LearningProgress,
): LearningProgress {
  return markConceptsExplored(progress, ["revenue", "revenue-growth"]);
}

export function deriveCurrentConcept(
  progress: LearningProgress,
): ConceptId | null {
  const explored = new Set(progress.exploredConceptIds);

  if (!explored.has("revenue-growth")) return "revenue";
  if (!explored.has("profit")) return "profit";
  if (!explored.has("net-profit-margin")) return "net-profit-margin";
  return null;
}

export function deriveConceptState(
  conceptId: ConceptId,
  progress: LearningProgress,
): ConceptProgressState {
  const explored = new Set(progress.exploredConceptIds);
  const revenueMilestoneExplored = explored.has("revenue-growth");

  if (
    (conceptId === "revenue" || conceptId === "revenue-growth") &&
    revenueMilestoneExplored
  ) {
    return "explored";
  }
  if (explored.has(conceptId)) return "explored";

  const current = deriveCurrentConcept(progress);
  if (
    current === conceptId ||
    (current === "revenue" && conceptId === "revenue-growth")
  ) {
    return "current";
  }
  return "available";
}

export type HomeRecommendation = {
  conceptId: ConceptId;
  title: string;
  goal: string;
  href: string;
  action: "Start" | "Continue" | "Review";
};

const recommendations: Record<ConceptId, Omit<HomeRecommendation, "conceptId" | "action">> = {
  revenue: {
    title: "Revenue",
    goal: "Understand Apple’s top line, then compare how Revenue changed year over year.",
    href: "/company/aapl",
  },
  "revenue-growth": {
    title: "Revenue Growth",
    goal: "Compare Apple’s annual Revenue and calculate the change from the prior year.",
    href: "/company/aapl#revenue-growth",
  },
  profit: {
    title: "Profit / Net Income",
    goal: "Follow Apple’s reported income-statement lines from Revenue to Net Income.",
    href: "/company/aapl/profit",
  },
  "net-profit-margin": {
    title: "Net Profit Margin",
    goal: "Compare Net Income with Revenue using a simple $100 mental model.",
    href: "/company/aapl/profit-margin",
  },
};

export function deriveHomeRecommendation(
  progress: LearningProgress,
): HomeRecommendation {
  const current = deriveCurrentConcept(progress);
  if (!current) {
    return {
      conceptId: "net-profit-margin",
      ...recommendations["net-profit-margin"],
      action: "Review",
    };
  }

  return {
    conceptId: current,
    ...recommendations[current],
    action: current === "revenue" ? "Start" : "Continue",
  };
}

export type UpNextModel =
  | {
      kind: "lesson";
      eyebrow: "Up next" | "Next";
      title: string;
      reason: string;
      status: "Recommended after this lesson" | "Ready to continue";
      href: string;
      action: "Open now" | "Continue";
      emphasis: "quiet" | "strong";
    }
  | {
      kind: "coming-later";
      eyebrow: "More concepts coming";
      title: string;
      reason: string;
      href: "/learn";
      action: "View learning path";
      emphasis: "quiet";
    };

export function deriveUpNextModel(
  currentConceptId: "revenue-growth" | "profit" | "net-profit-margin",
  progress: LearningProgress,
): UpNextModel {
  if (currentConceptId === "net-profit-margin") {
    return {
      kind: "coming-later",
      eyebrow: "More concepts coming",
      title: "The next company-analysis concept is still being validated.",
      reason: "FinPath will extend this path only when the data and lesson are ready.",
      href: "/learn",
      action: "View learning path",
      emphasis: "quiet",
    };
  }

  const isExplored = progress.exploredConceptIds.includes(currentConceptId);
  const next =
    currentConceptId === "revenue-growth"
      ? {
          title: "Profit / Net Income",
          reason:
            "Revenue is the starting line. Profit follows what remains after reported costs and expenses.",
          href: "/company/aapl/profit",
        }
      : {
          title: "Net Profit Margin",
          reason:
            "Compare Net Income with Revenue to ask how much Net Income Apple reported for every $100 of Revenue.",
          href: "/company/aapl/profit-margin",
        };

  return {
    kind: "lesson",
    eyebrow: isExplored ? "Next" : "Up next",
    ...next,
    status: isExplored ? "Ready to continue" : "Recommended after this lesson",
    action: isExplored ? "Continue" : "Open now",
    emphasis: isExplored ? "strong" : "quiet",
  };
}
