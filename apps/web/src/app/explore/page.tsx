import type { Metadata } from "next";

import {
  ExploreDirectory,
  ExploreDirectoryUnavailable,
} from "@/components/explore-directory";
import { getSupportedCompanies } from "@/lib/api";

export const metadata: Metadata = {
  title: "Explore Companies",
  description: "Inspect reviewed company financial records and SEC evidence.",
};

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  try {
    const companies = await getSupportedCompanies();
    return <ExploreDirectory companies={companies} />;
  } catch {
    return <ExploreDirectoryUnavailable />;
  }
}
