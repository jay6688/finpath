"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  ConceptLens,
  FinancialObject,
  RelationshipTrace,
  getFocusedRelationships,
} from "@/components/design-system-v2";
import type {
  FinancialObjectDatum,
  FinancialObjectKind,
  RelationshipDatum,
} from "@/components/design-system-v2";

import styles from "./home-financial-system.module.css";

const financialObjects: FinancialObjectDatum[] = [
  {
    id: "business",
    label: "Business",
    summary: "What the company offers, who pays, and how value reaches the business.",
    tone: "ink",
  },
  {
    id: "revenue",
    label: "Revenue",
    summary: "The top line reported before costs and expenses.",
    tone: "jade",
  },
  {
    id: "profit",
    label: "Profit",
    summary: "What remains after the reported costs, expenses, adjustments, and tax.",
    tone: "coral",
  },
  {
    id: "cash-flow",
    label: "Cash Flow",
    summary: "How operating, investing, and financing activity changes cash.",
    tone: "cobalt",
  },
  {
    id: "financial-position",
    label: "Financial Position",
    summary: "What the company owns and owes at one reporting date.",
    tone: "amber",
  },
  {
    id: "per-share",
    label: "Per Share",
    summary: "Company-level earnings expressed across weighted-average shares.",
    tone: "violet",
  },
  {
    id: "valuation",
    label: "Valuation",
    summary: "How a market price compares with a reviewed financial measure.",
    tone: "ink",
  },
];

const systemRelationships: RelationshipDatum[] = [
  { from: "business", to: "revenue", label: "What the business sells and who pays creates its top line." },
  { from: "revenue", to: "profit", label: "Reported costs and expenses transform Revenue into Profit." },
  { from: "revenue", to: "cash-flow", label: "Revenue and cash receipts can differ because timing matters." },
  { from: "profit", to: "cash-flow", label: "Non-cash items and operating timing bridge Profit to operating cash flow." },
  { from: "cash-flow", to: "financial-position", label: "Cash movements help explain the reporting-date cash position." },
  { from: "profit", to: "per-share", label: "Earnings allocated across weighted-average shares produce EPS." },
  { from: "per-share", to: "valuation", label: "Price compared with per-share earnings produces a valuation multiple." },
];

const learnHrefByObject: Record<FinancialObjectKind, string> = {
  business: "/learn/company-analysis/business-model",
  revenue: "/learn/company-analysis/revenue",
  profit: "/learn/company-analysis/profit",
  "cash-flow": "/learn/company-analysis/operating-cash-flow",
  "financial-position": "/learn/company-analysis/balance-sheet",
  "per-share": "/learn/company-analysis/eps-and-share-count",
  valuation: "/learn/company-analysis/pe-ratio",
};

const graphGeometry: Record<string, { path: string; labelX: number; labelY: number }> = {
  "business-revenue": { path: "M176 82 H252", labelX: 214, labelY: 68 },
  "revenue-profit": { path: "M412 82 H488", labelX: 450, labelY: 68 },
  "revenue-cash-flow": { path: "M332 122 V216", labelX: 345, labelY: 174 },
  "profit-cash-flow": { path: "M500 112 C454 143 430 181 406 226", labelX: 454, labelY: 178 },
  "cash-flow-financial-position": { path: "M256 276 C220 292 190 318 164 342", labelX: 222, labelY: 316 },
  "profit-per-share": { path: "M568 122 V216", labelX: 581, labelY: 174 },
  "per-share-valuation": { path: "M568 296 V356", labelX: 581, labelY: 332 },
};

type HomeFinancialSystemProps = {
  exploreHref: string;
  exploreLabel: string;
};

export function HomeFinancialSystem({ exploreHref, exploreLabel }: HomeFinancialSystemProps) {
  // Revenue is a stable conceptual entry point, not a proxy for lesson order.
  const [selectedId, setSelectedId] = useState<FinancialObjectKind>("revenue");
  const selected = financialObjects.find((object) => object.id === selectedId)!;
  const focusedRelationships = useMemo(
    () => getFocusedRelationships(systemRelationships, selectedId),
    [selectedId],
  );

  return (
    <section className={styles.system} aria-label="Financial system">
      <div className={styles.compactLens}>
        <ConceptLens
          objects={financialObjects}
          relationships={systemRelationships}
          selectedId={selectedId}
          onSelect={setSelectedId}
          learnHrefByObject={learnHrefByObject}
          exploreHref={exploreHref}
          exploreLabel={exploreLabel}
        />
      </div>

      <div className={styles.desktopSystem}>
        <div className={styles.graph} aria-label="All financial objects and their directed relationships">
          <svg className={styles.graphTraces} viewBox="0 0 680 460" aria-hidden="true">
            <defs>
              <marker id="home-graph-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0 0 L7 3.5 L0 7 Z" />
              </marker>
            </defs>
            {systemRelationships.map((relationship) => {
              const key = `${relationship.from}-${relationship.to}`;
              const geometry = graphGeometry[key];
              const isActive = relationship.from === selectedId || relationship.to === selectedId;
              return (
                <g key={key} data-active={isActive || undefined}>
                  <path d={geometry.path} markerEnd="url(#home-graph-arrow)" />
                  <text x={geometry.labelX} y={geometry.labelY} textAnchor="middle">
                    {relationship.from === "business" ? "creates" :
                      relationship.to === "profit" ? "after costs" :
                      relationship.to === "financial-position" ? "changes position" :
                      relationship.to === "per-share" ? "allocated" :
                      relationship.to === "valuation" ? "compared with price" :
                      relationship.from === "revenue" ? "timing" : "adjustments"}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className={styles.objectList} role="list" aria-label="Financial objects">
            {financialObjects.map((object) => (
              <div className={styles.objectPosition} data-object={object.id} key={object.id} role="listitem">
                <button
                  type="button"
                  aria-pressed={object.id === selectedId}
                  onClick={() => setSelectedId(object.id)}
                >
                  <FinancialObject object={object} selected={object.id === selectedId} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.focusPanel}>
          <header>
            <p>Financial system</p>
            <h2><span>Focus:</span> {selected.label}</h2>
            <p>{selected.summary}</p>
          </header>
          <div className={styles.traceList} role="list" aria-label={`Directed relationships connected to ${selected.label}`}>
            {focusedRelationships.map((relationship) => {
              const source = financialObjects.find((object) => object.id === relationship.from)!;
              const destination = financialObjects.find((object) => object.id === relationship.to)!;
              return (
                <div key={`${relationship.from}-${relationship.to}`} role="listitem" data-direction={relationship.direction}>
                  <RelationshipTrace
                    sourceLabel={source.label}
                    destinationLabel={destination.label}
                    label={relationship.label}
                  />
                </div>
              );
            })}
          </div>
          <nav aria-label={`${selected.label} actions`}>
            <Link href={learnHrefByObject[selectedId]}>Learn {selected.label}</Link>
            <Link href={exploreHref}>{exploreLabel}</Link>
          </nav>
        </div>
      </div>
    </section>
  );
}
