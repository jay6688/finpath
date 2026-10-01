import { LearningHome } from "@/components/learning-home";
import { getSupportedCompanies, type SupportedCompany } from "@/lib/api";
import { selectHomeCompanies } from "@/lib/home-content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let companies: SupportedCompany[] = [];
  try {
    companies = selectHomeCompanies(await getSupportedCompanies());
  } catch {
    // Learning remains usable when the public-data API is temporarily unavailable.
  }

  return <LearningHome companies={companies} />;
}
