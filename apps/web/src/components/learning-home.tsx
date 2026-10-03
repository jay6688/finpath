"use client";

import Link from "next/link";

import { HomeFinancialSystem } from "@/components/home-financial-system";
import { useLearningProgress } from "@/components/learning-progress-provider";
import { deriveHomeRecommendation } from "@/lib/learning-progress";
import { lessonCatalog } from "@/lib/lesson-catalog";

import styles from "./learning-home.module.css";

export type HomeCompany = {
  slug: string;
  ticker: string;
  name: string;
};

export function LearningHome({ companies }: { companies: HomeCompany[] }) {
  const { progress } = useLearningProgress();
  const recommendation = deriveHomeRecommendation(progress);
  const exploredCount = progress.exploredConceptIds.length;
  const isPathComplete = exploredCount === lessonCatalog.length;
  const primaryCompany = companies.find((company) => company.ticker === "AAPL") ?? companies[0];
  const exploreHref = primaryCompany ? `/company/${primaryCompany.slug}` : "/explore";
  const exploreLabel = primaryCompany ? `Explore ${primaryCompany.name}` : "Explore companies";
  const progressPercentage = (exploredCount / lessonCatalog.length) * 100;

  return (
    <div className={styles.page}>
      <div className={styles.firstExperience}>
        <section className={styles.promise} aria-labelledby="home-heading">
          <p>REAL COMPANIES <span aria-hidden="true">·</span> CONNECTED RECORDS</p>
          <h1 id="home-heading">Explore how company numbers connect.</h1>
          <p className={styles.supportingCopy}>
            Move through the financial system, then learn the idea or inspect it in a reviewed company.
          </p>
        </section>

        <HomeFinancialSystem exploreHref={exploreHref} exploreLabel={exploreLabel} />
      </div>

      <div className={styles.activityRails}>
        <section className={styles.nextStep} aria-labelledby="next-step-heading">
          <div className={styles.railIdentity}>
            <span>Learn</span>
            <strong>Guided understanding</strong>
          </div>
          <div className={styles.nextContent}>
            <p>{isPathComplete ? "Learning path complete" : "Your next step"}</p>
            <h2 id="next-step-heading">{recommendation.title}</h2>
            <p>{recommendation.goal}</p>
          </div>
          <div className={styles.progress} aria-label={`${exploredCount} of ${lessonCatalog.length} concepts explored`}>
            <strong><span>{exploredCount}</span> / {lessonCatalog.length}</strong>
            <span>concepts explored</span>
            <div aria-hidden="true"><span style={{ width: `${progressPercentage}%` }} /></div>
          </div>
          <Link className={styles.railAction} href={recommendation.href}>
            {isPathComplete ? "Review Capstone" : `${recommendation.action} lesson`}
            <span aria-hidden="true">→</span>
          </Link>
        </section>

        <section className={styles.companyEntry} aria-labelledby="company-entry-heading">
          <div className={styles.railIdentity}>
            <span>Explore</span>
            <strong>Reviewed-company research</strong>
          </div>
          <div className={styles.companyCopy}>
            <p>Supported company registry</p>
            <h2 id="company-entry-heading">Follow the records into a real company.</h2>
          </div>
          {companies.length > 0 ? (
            <nav aria-label="Reviewed companies">
              {companies.map((company) => (
                <Link href={`/company/${company.slug}`} key={company.slug}>
                  <strong>{company.ticker}</strong>
                  <span>{company.name}</span>
                </Link>
              ))}
            </nav>
          ) : (
            <p className={styles.registryUnavailable}>The company registry is temporarily unavailable.</p>
          )}
          <Link className={styles.railAction} href="/explore">
            Explore companies <span aria-hidden="true">→</span>
          </Link>
        </section>
      </div>
    </div>
  );
}
