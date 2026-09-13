import type { Metadata } from "next";

import { LessonShell } from "@/components/lesson-shell";
import { RevenueHistory } from "@/components/revenue-history";
import { getAppleRevenueData } from "@/lib/apple-revenue-data";

export const metadata: Metadata = {
  title: "Learn Revenue Growth",
  description: "Compare Apple's annual Revenue and understand year-over-year change.",
};

export const dynamic = "force-dynamic";

export default async function RevenueGrowthLessonPage() {
  const data = await getAppleRevenueData();

  return (
    <LessonShell
      conceptId="revenue-growth"
      example="Apple Inc. · annual Revenue · SEC 10-K"
    >
      {data.overview ? (
        <RevenueHistory
          overview={data.overview}
          reviewedPresentation={data.reviewedRevenue}
        />
      ) : (
        <div className="data-empty-state" role="status">
          <div className="data-empty-state__value" aria-hidden="true">—</div>
          <div>
            <strong>Revenue history is not available yet</strong>
            <p>{data.dataError}</p>
            <p>FinPath will not replace missing SEC history with hard-coded values.</p>
          </div>
        </div>
      )}
    </LessonShell>
  );
}
