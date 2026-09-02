import type { Metadata } from "next";

import { LearningPathView } from "@/components/learning-path-view";

export const metadata: Metadata = {
  title: "Learning Path",
  description: "Follow FinPath's beginner-first Company Analysis Basics path.",
};

export default function LearnPage() {
  return <LearningPathView />;
}
