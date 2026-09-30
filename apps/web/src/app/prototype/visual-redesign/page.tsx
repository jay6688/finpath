import type { Metadata } from "next";

import { PrototypeFrame } from "@/components/visual-prototype/prototype-frame";
import { StageZeroHome } from "@/components/visual-prototype/stage-zero-home";
import { getSupportedCompanies } from "@/lib/api";

export const metadata: Metadata = {
  title: "Stage 0 Home Prototype",
  description: "Local-only FinPath visual redesign prototype.",
};

export const dynamic = "force-dynamic";

export default async function VisualRedesignPrototypeHome() {
  let companyNames: string[] = [];
  try {
    companyNames = (await getSupportedCompanies()).map((company) => company.name);
  } catch {
    // The visual prototype remains inspectable when the local API is unavailable.
  }

  return (
    <PrototypeFrame active="home" tone="home">
      <StageZeroHome companyNames={companyNames} />
    </PrototypeFrame>
  );
}
