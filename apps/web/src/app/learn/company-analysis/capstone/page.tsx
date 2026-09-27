import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CapstoneLearning } from "@/components/capstone-learning";
import { LessonShell } from "@/components/lesson-shell";
import { CapstoneDataError, getCapstoneData } from "@/lib/capstone-data";

export const metadata: Metadata = {
  title: "Company Analysis Capstone",
  description:
    "Synthesize Apple FY2025 reviewed evidence without reaching beyond what it supports.",
};

export default async function CapstonePage({
  searchParams,
}: PageProps<"/learn/company-analysis/capstone">) {
  const requestedCompany = (await searchParams).company;
  const normalizedCompany = Array.isArray(requestedCompany)
    ? requestedCompany[0]?.toLowerCase()
    : requestedCompany?.toLowerCase();

  if (normalizedCompany && normalizedCompany !== "aapl") {
    redirect("/learn/company-analysis/capstone");
  }

  try {
    const data = await getCapstoneData();
    return (
      <LessonShell
        conceptId="capstone"
        example="Apple Inc. · FY2025 · SEC 10-K"
        selectedCompany={data.company}
        showExploreCompany={false}
      >
        <CapstoneLearning data={data} />
      </LessonShell>
    );
  } catch (error) {
    const message =
      error instanceof CapstoneDataError
        ? "FinPath will not combine mismatched or incomplete records into an analysis."
        : "The required reviewed sources could not be loaded safely.";
    return (
      <LessonShell
        conceptId="capstone"
        example="Apple Inc. · FY2025 · reviewed example"
        showExploreCompany={false}
      >
        <section className="data-error" role="alert">
          <p className="eyebrow">Evidence package unavailable</p>
          <h2>Reviewed Capstone evidence is temporarily unavailable.</h2>
          <p>{message}</p>
        </section>
      </LessonShell>
    );
  }
}
