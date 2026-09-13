import { permanentRedirect } from "next/navigation";

export default function LegacyProfitLessonPage() {
  permanentRedirect("/learn/company-analysis/profit");
}
