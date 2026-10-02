import type { Metadata } from "next";

import { ReconceptHome } from "@/components/reconcept/reconcept-home";
import { ReconceptShell } from "@/components/reconcept/reconcept-shell";

export const metadata: Metadata = { title: "Stage 3 Re-Concept Home" };

export default function ReconceptHomePage() {
  return <ReconceptShell active="home" mode="atlas"><ReconceptHome /></ReconceptShell>;
}
