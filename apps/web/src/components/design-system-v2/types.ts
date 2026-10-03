export type FinancialObjectKind =
  | "business"
  | "revenue"
  | "profit"
  | "cash-flow"
  | "financial-position"
  | "per-share"
  | "valuation";

export type FinancialObjectDatum = {
  id: FinancialObjectKind;
  label: string;
  summary: string;
  tone: "jade" | "cobalt" | "coral" | "amber" | "violet" | "ink";
  unavailable?: boolean;
};

export type RelationshipDatum = {
  from: FinancialObjectKind;
  to: FinancialObjectKind;
  label: string;
};
