import {
  getLesson,
  type ConceptId,
  type LessonDefinition,
} from "./lesson-catalog.ts";

export type LessonChapterTone =
  | "jade"
  | "coral"
  | "cobalt"
  | "amber"
  | "violet"
  | "ink";

type LessonChapterDefinition = {
  id: string;
  title: string;
  purpose: string;
  objectLabel: string;
  tone: LessonChapterTone;
  lessonIds: readonly ConceptId[];
};

export type LessonChapter = Omit<LessonChapterDefinition, "lessonIds"> & {
  lessons: readonly LessonDefinition[];
};

const chapterDefinitions = [
  {
    id: "understand-the-business",
    title: "Understand the business",
    purpose: "Follow the top line through the costs and margin that shape Profit.",
    objectLabel: "Revenue to Profit",
    tone: "jade",
    lessonIds: ["revenue", "revenue-growth", "profit", "net-profit-margin"],
  },
  {
    id: "follow-the-cash",
    title: "Follow the cash",
    purpose: "Trace how operating, investing and financing activity changes cash.",
    objectLabel: "Cash Flow",
    tone: "cobalt",
    lessonIds: [
      "operating-cash-flow",
      "investing-financing-cash-flow",
      "free-cash-flow",
    ],
  },
  {
    id: "understand-the-position",
    title: "Understand the position",
    purpose: "Read what the company owns, owes and connects at one reporting date.",
    objectLabel: "Financial Position",
    tone: "amber",
    lessonIds: ["balance-sheet", "cash-and-debt", "three-statements-connect"],
  },
  {
    id: "think-per-share",
    title: "Think per share",
    purpose: "Connect company-level earnings with the shares used to report EPS.",
    objectLabel: "Per Share",
    tone: "violet",
    lessonIds: ["eps-and-share-count"],
  },
  {
    id: "value-the-company",
    title: "Value the company",
    purpose: "Connect shares and earnings with an educational price input.",
    objectLabel: "Valuation",
    tone: "coral",
    lessonIds: ["market-cap", "pe-ratio"],
  },
  {
    id: "understand-the-business-model",
    title: "Understand the business model",
    purpose: "Return to what the company offers, who pays and how Revenue is generated.",
    objectLabel: "Business Model",
    tone: "ink",
    lessonIds: ["business-model"],
  },
  {
    id: "put-it-together",
    title: "Put it together",
    purpose: "Synthesize reviewed evidence while keeping unsupported claims visible.",
    objectLabel: "Synthesis",
    tone: "jade",
    lessonIds: ["capstone"],
  },
] as const satisfies readonly LessonChapterDefinition[];

export const lessonChapters: readonly LessonChapter[] = chapterDefinitions.map(
  ({ lessonIds, ...chapter }) => ({
    ...chapter,
    lessons: lessonIds.map(getLesson),
  }),
);

export function getLessonChapter(conceptId: ConceptId): LessonChapter {
  const chapter = lessonChapters.find((candidate) =>
    candidate.lessons.some((lesson) => lesson.id === conceptId),
  );
  if (!chapter) throw new Error(`Unknown lesson chapter: ${conceptId}`);
  return chapter;
}
