import type { Metadata } from "next";

import { LessonShell } from "@/components/lesson-shell";
import { RevenueLessonContent } from "@/components/revenue-lesson-content";
import { getAppleRevenueData } from "@/lib/apple-revenue-data";

export const metadata: Metadata = {
  title: "Learn Revenue",
  description: "Understand Revenue using Apple's real annual SEC filings.",
};

export const dynamic = "force-dynamic";

export default async function RevenueLessonPage() {
  const data = await getAppleRevenueData();
  const example = data.latest
    ? `Apple Inc. · FY${data.latest.fiscalYear} · SEC ${data.latest.form}`
    : "Apple Inc. · real SEC data";

  return (
    <LessonShell
      completeCurrentOnNext
      conceptId="revenue"
      example={example}
    >
      <RevenueLessonContent {...data} />
    </LessonShell>
  );
}
