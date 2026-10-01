"use client";

import Link from "next/link";

import { useLearningProgress } from "@/components/learning-progress-provider";
import { ConceptNode, SectionEyebrow } from "@/components/visual-system";
import type { SupportedCompany } from "@/lib/api";
import {
  conceptConnections,
  conceptRelationshipNotice,
} from "@/lib/home-content";
import {
  deriveConceptState,
  deriveHomeRecommendation,
} from "@/lib/learning-progress";
import { lessonCatalog } from "@/lib/lesson-catalog";

import styles from "./learning-home.module.css";

function stateLabel(state: ReturnType<typeof deriveConceptState>) {
  if (state === "explored") return "Explored";
  if (state === "current") return "Current focus";
  return "Available";
}

function conceptNodeState(state: ReturnType<typeof deriveConceptState>) {
  return state === "explored" ? "complete" : state;
}

export function LearningHome({ companies }: { companies: SupportedCompany[] }) {
  const { progress } = useLearningProgress();
  const recommendation = deriveHomeRecommendation(progress);
  const exploredCount = progress.exploredConceptIds.length;
  const isPathComplete = exploredCount === lessonCatalog.length;
  const lessonNumber = lessonCatalog.find(
    (lesson) => lesson.id === recommendation.conceptId,
  )?.number;

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="home-heading">
        <div className={styles.heroCopy}>
          <SectionEyebrow>Learn with real company records</SectionEyebrow>
          <h1 id="home-heading">Understand one financial idea at a time.</h1>
          <p className={styles.heroSummary}>
            Learn what financial numbers mean, see how the ideas connect, and
            trace the evidence back to reviewed company filings.
          </p>
          <div className={styles.modeBridge} aria-label="Two ways to use FinPath">
            <Link href="/learn">
              <strong>Learn</strong>
              <span>Guided understanding, step by step</span>
            </Link>
            <span aria-hidden="true">↔</span>
            <Link href="/explore">
              <strong>Explore</strong>
              <span>Reviewed company research</span>
            </Link>
          </div>
        </div>

        <section
          className={`${styles.nextStep} ${isPathComplete ? styles.nextStepComplete : ""}`}
          aria-labelledby="next-step-heading"
        >
          <div className={styles.nextTopline}>
            <SectionEyebrow>
              {isPathComplete ? "Company Analysis Basics complete" : "Your next step"}
            </SectionEyebrow>
            <span>{isPathComplete ? "Review" : `Lesson ${lessonNumber}`}</span>
          </div>
          <h2 id="next-step-heading">{recommendation.title}</h2>
          <p>{recommendation.goal}</p>
          <Link className={styles.primaryAction} href={recommendation.href}>
            {isPathComplete ? "Review Capstone" : `${recommendation.action} lesson`}
            <span aria-hidden="true">→</span>
          </Link>
          <div className={styles.progressSummary}>
            <div>
              <span>Company Analysis Basics</span>
              <strong>
                {exploredCount} of {lessonCatalog.length} concepts explored
              </strong>
            </div>
            <progress
              aria-label={`${exploredCount} of ${lessonCatalog.length} concepts explored`}
              max={lessonCatalog.length}
              value={exploredCount}
            />
            <Link href="/learn">View learning path →</Link>
          </div>
        </section>
      </section>

      <section className={styles.relationshipSection} aria-labelledby="relationship-heading">
        <header className={styles.sectionHeading}>
          <div>
            <SectionEyebrow>How the ideas connect</SectionEyebrow>
            <h2 id="relationship-heading">A company is one connected financial system.</h2>
          </div>
          <p>
            This map groups ideas by relationship. The canonical 15-lesson
            sequence remains in Learn.
          </p>
        </header>

        <div className={styles.mapCanvas}>
          <div className={styles.mapTopline}>
            <span>{conceptRelationshipNotice}</span>
            <span>Progress shown from this device</span>
          </div>
          <svg aria-hidden="true" focusable="false" viewBox="0 0 900 470">
            <path d="M96 196C175 91 298 48 430 78c139 31 259 113 337 235" />
            <path d="M132 240c119-43 220-62 318-50 119 15 210 68 314 161" />
            <path d="M450 190c-4 91-1 146 16 219" />
            <path d="M193 349c102 54 177 72 273 60 103-13 172-43 244-91" />
            <circle cx="450" cy="190" r="6" />
            <circle cx="466" cy="409" r="6" />
          </svg>
          <div className={styles.mapGrid}>
            {conceptConnections.map(({ key, conceptId, label }) => {
              const state = deriveConceptState(conceptId, progress);
              const lesson = lessonCatalog.find((item) => item.id === conceptId);
              if (!lesson) return null;

              return (
                <Link
                  className={styles.mapNode}
                  data-map-node={key}
                  href={lesson.href}
                  key={conceptId}
                >
                  <ConceptNode
                    description={stateLabel(state)}
                    state={conceptNodeState(state)}
                    title={label}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.exploreSection} aria-labelledby="explore-heading">
        <div className={styles.exploreIntro}>
          <SectionEyebrow>Explore reviewed companies</SectionEyebrow>
          <h2 id="explore-heading">Move from a concept to the real record.</h2>
          <p>
            Inspect exact reporting periods, company-specific figures, and the
            SEC evidence behind each supported record.
          </p>
          <Link href="/explore">Open Explore →</Link>
        </div>

        {companies.length > 0 ? (
          <ul className={styles.companyList}>
            {companies.map((company) => (
              <li key={company.ticker}>
                <Link href={`/company/${company.ticker.toLowerCase()}`}>
                  <span>{company.ticker}</span>
                  <strong>{company.name}</strong>
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.registryUnavailable}>
            The reviewed company registry is temporarily unavailable. The Learn
            path remains available.
          </p>
        )}
      </section>
    </div>
  );
}
