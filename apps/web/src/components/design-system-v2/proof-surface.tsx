"use client";

import { useState } from "react";

import { ConceptLens } from "./concept-lens";
import { FinancialObjectGlyph } from "./financial-object";
import { MetricDossier, type DossierPeriod } from "./metric-dossier";
import { QuantitativeLedger, type LedgerLine } from "./quantitative-ledger";
import styles from "./proof-surface.module.css";
import type { FinancialObjectDatum, FinancialObjectKind, RelationshipDatum } from "./types";

const financialObjects: FinancialObjectDatum[] = [
  { id: "business", label: "Business", summary: "How the company creates and delivers value.", tone: "ink" },
  { id: "revenue", label: "Revenue", summary: "Money reported from customers before costs and expenses.", tone: "jade" },
  { id: "profit", label: "Profit", summary: "What remains after the income statement's accounting layers.", tone: "cobalt" },
  { id: "cash-flow", label: "Cash Flow", summary: "How cash moved through operating, investing and financing activity.", tone: "coral" },
  { id: "financial-position", label: "Financial Position", summary: "What the company has and how those resources are financed.", tone: "amber" },
  { id: "per-share", label: "Per Share", summary: "Company results expressed for one share unit.", tone: "violet" },
  { id: "valuation", label: "Valuation", summary: "How a market price relates to reviewed financial records.", tone: "ink" },
];

const relationships: RelationshipDatum[] = [
  { from: "business", to: "revenue", label: "Business activity produces Revenue" },
  { from: "revenue", to: "profit", label: "Revenue starts the Profit path" },
  { from: "profit", to: "cash-flow", label: "Profit is not cash flow" },
  { from: "profit", to: "per-share", label: "Profit contributes to earnings per share" },
  { from: "cash-flow", to: "financial-position", label: "Cash movement changes financial position" },
  { from: "per-share", to: "valuation", label: "Per-share records can inform valuation" },
];

const learnRoutes: Partial<Record<FinancialObjectKind, string>> = {
  business: "/learn/company-analysis/business-model",
  revenue: "/learn/company-analysis/revenue",
  profit: "/learn/company-analysis/profit",
  "cash-flow": "/learn/company-analysis/operating-cash-flow",
  "financial-position": "/learn/company-analysis/balance-sheet",
  "per-share": "/learn/company-analysis/eps-and-share-count",
  valuation: "/learn/company-analysis/pe-ratio",
};

export function VisualSystemV2Proof({ ledgerLines, dossierPeriods, dossierGeometryReference }: { ledgerLines: LedgerLine[]; dossierPeriods: DossierPeriod[]; dossierGeometryReference: string }) {
  const [concept, setConcept] = useState<FinancialObjectKind>("profit");
  const [ledgerLine, setLedgerLine] = useState("other-income-expense-net");
  const [period, setPeriod] = useState(dossierPeriods.at(-1)?.id ?? "");

  return (
    <div className={styles.proof}>
      <header className={styles.identity}>
        <div><span className={styles.mark}>FP</span><strong>FinPath</strong></div>
        <p>Internal Design System V2 proof · not production navigation</p>
      </header>
      <div className={styles.main}>
        <section className={styles.intro}>
          <p>OBJECT → TRACE → PASSPORT</p>
          <h1>Financial records become systems you can explore.</h1>
          <span>One production foundation across the atlas, learning lab and research workspace.</span>
        </section>

        <section className={styles.objectFamily} aria-labelledby="object-family-title">
          <header><p>Object family</p><h2 id="object-family-title">Seven roles. One visual grammar.</h2></header>
          <div>{financialObjects.map((object) => <figure key={object.id}><FinancialObjectGlyph kind={object.id} label={object.label} size={64} /><span className={styles.opticalSizes} aria-hidden="true"><FinancialObjectGlyph kind={object.id} decorative size={20} /><FinancialObjectGlyph kind={object.id} decorative size={16} /></span><figcaption>{object.label}</figcaption></figure>)}</div>
        </section>

        <section className={styles.proofSection}>
          <span className={styles.mode}>Home · Object + Trace</span>
          <ConceptLens objects={financialObjects} relationships={relationships} selectedId={concept} onSelect={setConcept} learnHrefByObject={learnRoutes} exploreHref="/explore?company=apple" />
        </section>

        <section className={styles.proofSection}>
          <span className={styles.mode}>Learn · Trace + explanation</span>
          <QuantitativeLedger title="How Apple Revenue reaches Net Income" context="Apple Inc. · FY2025 · USD" lines={ledgerLines} selectedId={ledgerLine} onSelect={setLedgerLine} />
        </section>

        <section className={styles.proofSection}>
          <span className={styles.mode}>Explore · Object + Trace + Passport</span>
          <MetricDossier company={{ name: "Apple Inc.", ticker: "AAPL" }} metric="Revenue" meaning="Money Apple reported from customers before costs and expenses." valueRole="Reported" periods={dossierPeriods} selectedPeriodId={period} onPeriodSelect={setPeriod} learnHref="/learn/company-analysis/revenue?company=apple" relatedTrace="Annual reported records share one scale. Choose a period to attach its exact passport." geometryReference={dossierGeometryReference} />
        </section>
      </div>
    </div>
  );
}
