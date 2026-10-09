import { LearningHome, type HomeCompany } from "@/components/learning-home";
import { getSupportedCompanies } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let companies: HomeCompany[] = [];
  try {
    companies = (await getSupportedCompanies()).map((company) => ({
      slug: company.slug,
      ticker: company.ticker,
      name: company.name,
    }));
  } catch {
    // Learning remains usable when the public-data API is temporarily unavailable.
  }

  return <LearningHome companies={companies} />;
}
