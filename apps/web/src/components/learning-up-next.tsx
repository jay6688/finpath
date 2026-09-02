"use client";

import Link from "next/link";

import { useLearningProgress } from "@/components/learning-progress-provider";
import { deriveUpNextModel } from "@/lib/learning-progress";

type LearningUpNextProps = {
  currentConceptId: "revenue-growth" | "profit" | "net-profit-margin";
};

export function LearningUpNext({ currentConceptId }: LearningUpNextProps) {
  const { progress } = useLearningProgress();
  const model = deriveUpNextModel(currentConceptId, progress);

  return (
    <aside
      className="learning-up-next"
      data-emphasis={model.emphasis}
      aria-labelledby={`up-next-${currentConceptId}`}
    >
      <div className="learning-up-next__label">
        <p className="eyebrow">{model.eyebrow}</p>
        {model.kind === "lesson" ? <span>{model.status}</span> : null}
      </div>
      <div className="learning-up-next__copy">
        <h2 id={`up-next-${currentConceptId}`}>{model.title}</h2>
        <p>{model.reason}</p>
      </div>
      <Link
        className={model.emphasis === "strong" ? "primary-action" : "learning-up-next__link"}
        href={model.href}
      >
        {model.action}
        <span aria-hidden="true">→</span>
      </Link>
    </aside>
  );
}
