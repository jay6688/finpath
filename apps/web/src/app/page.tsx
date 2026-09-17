import { LearningHome } from "@/components/learning-home";
import { getSupportedCompanies } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let companyNames: string[] = [];
  try {
    companyNames = (await getSupportedCompanies()).map((company) => company.name);
  } catch {
    // Learning remains usable when the public-data API is temporarily unavailable.
  }

  return <LearningHome companyNames={companyNames} />;
}
