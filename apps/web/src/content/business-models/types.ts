export type BusinessModelCompany = {
  slug: "aapl" | "msft" | "wmt";
  ticker: "AAPL" | "MSFT" | "WMT";
  name: string;
  cik: string;
};

export type ReviewedFilingIdentity = {
  fiscalYear: number;
  form: "10-K";
  filedAt: string;
  accession: string;
  sourceUrl: string;
  primarySection: "Item 1 · Business";
  reviewedAt: string;
};

export type ReviewedNarrativeEvidence = {
  id: string;
  sourceType: "SEC filing narrative";
  company: Pick<BusinessModelCompany, "ticker" | "name" | "cik">;
  fiscalYear: number;
  form: "10-K";
  filedAt: string;
  accession: string;
  sourceUrl: string;
  section:
    | "Item 1 · Business"
    | "Item 8 · Note 1 · Revenue Recognition";
  reviewedAt: string;
  topic: string;
  paraphrasedFinding: string;
};

export type ReviewedTeachingItem = {
  id: string;
  title: string;
  description: string;
  evidenceIds: string[];
};

export type ReviewedMoneyPath = {
  id: string;
  payer: string;
  receives: string;
  mechanism: string;
  evidenceIds: string[];
};

export type BusinessStructure = {
  heading: string;
  explanation: string;
  groups: ReviewedTeachingItem[];
  boundary: string;
};

export type BusinessModelProfile = {
  company: BusinessModelCompany;
  filing: ReviewedFilingIdentity;
  summary: string;
  offerings: ReviewedTeachingItem[];
  customersOrUsers: ReviewedTeachingItem[];
  moneyPaths: ReviewedMoneyPath[];
  businessStructure: BusinessStructure;
  boundaries: string[];
  evidence: ReviewedNarrativeEvidence[];
};
