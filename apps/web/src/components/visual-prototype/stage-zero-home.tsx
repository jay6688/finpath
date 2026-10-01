"use client";

import Link from "next/link";

import { useLearningProgress } from "@/components/learning-progress-provider";
import {
  deriveConceptState,
  deriveHomeRecommendation,
} from "@/lib/learning-progress";
import { lessonCatalog, type ConceptId } from "@/lib/lesson-catalog";

import styles from "./visual-prototype.module.css";

type StageZeroHomeProps = {
  companyNames: string[];
};

const conceptConnections: Array<{
  key: string;
  conceptId: ConceptId;
  label: string;
}> = [
  { key: "business", conceptId: "business-model", label: "Business" },
  { key: "revenue", conceptId: "revenue", label: "Revenue" },
  { key: "profit", conceptId: "profit", label: "Profit" },
  { key: "cash", conceptId: "operating-cash-flow", label: "Cash Flow" },
  { key: "position", conceptId: "balance-sheet", label: "Position" },
  { key: "per-share", conceptId: "eps-and-share-count", label: "Per Share" },
  { key: "valuation", conceptId: "market-cap", label: "Valuation" },
];

const productPromises = [
  ["01", "Real company records", "Learn from reviewed SEC filing data."],
  ["02", "Step-by-step lessons", "Move through one financial relationship at a time."],
  ["03", "Visual explanations", "See how reported lines connect before reading the detail."],
  ["04", "Traceable evidence", "Keep periods, filing dates and official sources within reach."],
] as const;

function stateLabel(state: ReturnType<typeof deriveConceptState>) {
  if (state === "explored") return "Explored";
  if (state === "current") return "Current";
  return "Available";
}

export function StageZeroHome({ companyNames }: StageZeroHomeProps) {
  const { progress } = useLearningProgress();
  const recommendation = deriveHomeRecommendation(progress);
  const explored = new Set(progress.exploredConceptIds);
  const exploredCount = progress.exploredConceptIds.length;
  const progressPercent = Math.round((exploredCount / lessonCatalog.length) * 100);

  return (
    <div className={styles.homeCanvas}>
      <section className={styles.homeHero} aria-labelledby="prototype-home-heading">
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>Learn with real company data</p>
          <h1 id="prototype-home-heading">
            Understand one financial idea at a time.
          </h1>
          <p className={styles.heroSummary}>
            Follow a guided path through real financial records. Learn what each
            number means, how it connects, and where the evidence came from.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} href={recommendation.href}>
              {recommendation.action} {recommendation.title}
              <span aria-hidden="true">→</span>
            </Link>
            <Link className={styles.secondaryButton} href="/explore">
              Explore reviewed companies
            </Link>
          </div>
        </div>

        <div className={styles.pathIllustration} aria-label="Company Analysis Basics concept connections">
          <div className={styles.conceptMapHeading}>
            <p className={styles.handNote}>A company is one connected system</p>
            <small>Concept connections, not lesson order</small>
          </div>
          <div className={styles.conceptMap}>
            <svg aria-hidden="true" viewBox="0 0 640 430">
              <path className={styles.mapContour} d="M72 178C126 64 260 26 372 72c95 39 185 145 166 244-14 76-100 100-203 85-115-17-246-46-278-126-13-33-7-65 15-97Z" />
              <path className={styles.mapConnection} d="M116 214C174 163 219 139 279 146m0 0c57 7 102 35 145 81m-145-81c-10 70-3 113 38 162m107-81c-16 55-44 84-107 81m0 0c-64 2-114-12-157-52m264-29c35 38 50 70 46 109m-153-28c28 33 44 62 45 92" />
              <circle cx="279" cy="146" r="5" />
              <circle cx="317" cy="308" r="5" />
            </svg>
            {conceptConnections.map(({ key, conceptId, label }) => {
              const lesson = lessonCatalog.find((item) => item.id === conceptId);
              if (!lesson) return null;
              const state = deriveConceptState(conceptId, progress);
              return (
                <Link
                  data-map-node={key}
                  data-state={state}
                  href={lesson.href}
                  key={conceptId}
                >
                  <span aria-hidden="true">{state === "explored" ? "✓" : lesson.number}</span>
                  <div>
                    <strong>{label}</strong>
                    <small>{stateLabel(state)}</small>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.promiseStrip} aria-label="How FinPath teaches">
        {productPromises.map(([number, title, copy]) => (
          <article key={number}>
            <span>{number}</span>
            <div>
              <h2>{title}</h2>
              <p>{copy}</p>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.homeWorkspace}>
        <div className={styles.progressPanel}>
          <header className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Your learning path</p>
              <h2>Company Analysis Basics</h2>
            </div>
            <strong>{progressPercent}%</strong>
          </header>

          <div
            aria-label={`${exploredCount} of ${lessonCatalog.length} concepts explored`}
            className={styles.progressTrack}
            role="progressbar"
            aria-valuemax={lessonCatalog.length}
            aria-valuemin={0}
            aria-valuenow={exploredCount}
          >
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <p className={styles.progressCopy}>
            {exploredCount} of {lessonCatalog.length} concepts explored on this device
          </p>

          <div className={styles.learningMap}>
            {lessonCatalog.map((lesson) => {
              const state = deriveConceptState(lesson.id, progress);
              return (
                <Link
                  data-state={state}
                  href={lesson.href}
                  key={lesson.id}
                >
                  <span aria-hidden="true">
                    {explored.has(lesson.id) ? "✓" : lesson.number}
                  </span>
                  <div>
                    <strong>{lesson.title}</strong>
                    <small>{lesson.shortGoal}</small>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <aside className={styles.homeAside}>
          <section className={styles.nextPanel} aria-labelledby="prototype-next-heading">
            <p className={styles.kicker}>Your next step</p>
            <span>Lesson {lessonCatalog.find((lesson) => lesson.id === recommendation.conceptId)?.number}</span>
            <h2 id="prototype-next-heading">{recommendation.title}</h2>
            <p>{recommendation.goal}</p>
            <Link className={styles.primaryButton} href={recommendation.href}>
              {recommendation.action} lesson <span aria-hidden="true">→</span>
            </Link>
          </section>

          <section className={styles.companyPanel} aria-labelledby="prototype-company-heading">
            <p className={styles.kicker}>Or explore a company</p>
            <h2 id="prototype-company-heading">Reviewed company records</h2>
            {companyNames.length ? (
              <ul>
                {companyNames.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            ) : (
              <p>Company registry is temporarily unavailable.</p>
            )}
            <Link href="/explore">Open Explore <span aria-hidden="true">→</span></Link>
          </section>
        </aside>
      </section>
    </div>
  );
}
