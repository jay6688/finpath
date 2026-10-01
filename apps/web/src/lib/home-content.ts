import type { ConceptId } from "./lesson-catalog.ts";

export const conceptRelationshipNotice = "Concept relationships, not lesson order";

export const conceptConnections: ReadonlyArray<{
  key: "business" | "revenue" | "profit" | "cash" | "position" | "perShare" | "valuation";
  conceptId: ConceptId;
  label: string;
}> = [
  { key: "business", conceptId: "business-model", label: "Business" },
  { key: "revenue", conceptId: "revenue", label: "Revenue" },
  { key: "profit", conceptId: "profit", label: "Profit" },
  { key: "cash", conceptId: "operating-cash-flow", label: "Cash Flow" },
  { key: "position", conceptId: "balance-sheet", label: "Position" },
  { key: "perShare", conceptId: "eps-and-share-count", label: "Per Share" },
  { key: "valuation", conceptId: "market-cap", label: "Valuation" },
];

const homeCompanyOrder = ["AAPL", "MSFT", "WMT"] as const;

export function selectHomeCompanies<T extends { ticker: string }>(
  companies: readonly T[],
): T[] {
  return homeCompanyOrder.flatMap((ticker) => {
    const company = companies.find((candidate) => candidate.ticker === ticker);
    return company ? [company] : [];
  });
}
