import type { BusinessModelProfile } from "./types.ts";

const company = {
  slug: "wmt",
  ticker: "WMT",
  name: "Walmart Inc.",
  cik: "0000104169",
} as const;

const filing = {
  fiscalYear: 2026,
  form: "10-K",
  filedAt: "2026-03-13",
  accession: "0000104169-26-000055",
  sourceUrl:
    "https://www.sec.gov/Archives/edgar/data/104169/000010416926000055/0000104169-26-000055-index.htm",
  primarySection: "Item 1 · Business",
  reviewedAt: "2026-09-26",
} as const;

const evidenceBase = {
  sourceType: "SEC filing narrative",
  company: { ticker: company.ticker, name: company.name, cik: company.cik },
  fiscalYear: filing.fiscalYear,
  form: filing.form,
  filedAt: filing.filedAt,
  accession: filing.accession,
  sourceUrl: filing.sourceUrl,
  section: filing.primarySection,
  reviewedAt: filing.reviewedAt,
} as const;

export const walmartBusinessModelProfile = {
  company,
  filing,
  summary:
    "Walmart describes an omnichannel retailer that joins stores, clubs, eCommerce and service offerings. Merchandise sales remain central, while memberships and partner services add other paths.",
  offerings: [
    {
      id: "wmt-merchandise",
      title: "Retail and wholesale merchandise",
      description:
        "Grocery, general merchandise, health and wellness, and other categories are sold through stores, clubs and digital channels.",
      evidenceIds: ["wmt-omnichannel", "wmt-merchandise-services"],
    },
    {
      id: "wmt-ecommerce",
      title: "Omnichannel shopping",
      description:
        "Customers and members can shop through physical locations, websites and mobile apps, with pickup and delivery options.",
      evidenceIds: ["wmt-omnichannel"],
    },
    {
      id: "wmt-membership-services",
      title: "Memberships and related services",
      description:
        "Walmart describes membership, advertising, marketplace, fulfillment, financial and other service offerings across the business.",
      evidenceIds: ["wmt-service-ecosystem", "wmt-memberships"],
    },
  ],
  customersOrUsers: [
    {
      id: "wmt-shoppers",
      title: "Customers",
      description:
        "Customers buy merchandise and access service offerings through stores, websites and mobile applications.",
      evidenceIds: ["wmt-omnichannel"],
    },
    {
      id: "wmt-members",
      title: "Members",
      description:
        "Walmart+ and Sam’s Club connect shopping benefits with membership payments; Sam’s Club is membership-only.",
      evidenceIds: ["wmt-memberships"],
    },
    {
      id: "wmt-business-partners",
      title: "Brands, sellers and suppliers",
      description:
        "Walmart also offers advertising, marketplace, fulfillment, data and related services to business counterparties.",
      evidenceIds: ["wmt-service-ecosystem"],
    },
  ],
  moneyPaths: [
    {
      id: "wmt-merchandise-sale",
      payer: "Customer or member",
      receives: "Merchandise through a store, club or digital channel",
      mechanism: "Retail or wholesale purchase → Revenue",
      evidenceIds: ["wmt-omnichannel", "wmt-merchandise-services"],
    },
    {
      id: "wmt-membership-fee",
      payer: "Walmart+ or Sam’s Club member",
      receives: "Membership access and eligible benefits",
      mechanism: "Membership fee → Revenue",
      evidenceIds: ["wmt-memberships"],
    },
    {
      id: "wmt-partner-services",
      payer: "Brand, marketplace seller or supplier",
      receives: "Advertising, marketplace, fulfillment or data service",
      mechanism: "Service transaction → Revenue",
      evidenceIds: ["wmt-service-ecosystem"],
    },
  ],
  businessStructure: {
    heading: "Walmart reports three operating segments",
    explanation:
      "The segment names combine geography, format and management responsibility. The shopping channels and Revenue mechanisms can appear within more than one segment.",
    groups: [
      {
        id: "wmt-us",
        title: "Walmart U.S.",
        description: "U.S. mass merchandising, eCommerce and related offerings.",
        evidenceIds: ["wmt-segments"],
      },
      {
        id: "wmt-international",
        title: "Walmart International",
        description: "Retail, wholesale and eCommerce operations across markets outside the U.S.",
        evidenceIds: ["wmt-segments"],
      },
      {
        id: "wmt-sams",
        title: "Sam’s Club U.S.",
        description: "A membership-only warehouse club with physical and digital shopping.",
        evidenceIds: ["wmt-segments", "wmt-memberships"],
      },
    ],
    boundary:
      "These segments are Walmart’s reporting structure; they are not a universal template for other companies.",
  },
  boundaries: [
    "Walmart describes EDLP as its pricing philosophy; FinPath is reporting that description, not judging the strategy.",
    "Omnichannel describes connected physical and digital operations; it does not guarantee growth or profitability.",
    "This profile does not rank Walmart’s segments, services or shares as an investment.",
  ],
  evidence: [
    {
      ...evidenceBase,
      id: "wmt-omnichannel",
      topic: "Omnichannel retail",
      paraphrasedFinding:
        "Walmart describes shopping through retail stores and eCommerce, supported by websites, mobile applications, pickup and delivery.",
    },
    {
      ...evidenceBase,
      id: "wmt-merchandise-services",
      topic: "Merchandise and other offerings",
      paraphrasedFinding:
        "Item 1 describes broad merchandise categories and other offerings rather than reducing the business to physical stores alone.",
    },
    {
      ...evidenceBase,
      id: "wmt-service-ecosystem",
      topic: "Service ecosystem",
      paraphrasedFinding:
        "Walmart says its expanding offerings include membership, advertising, marketplace, fulfillment and financial services.",
    },
    {
      ...evidenceBase,
      id: "wmt-memberships",
      topic: "Memberships",
      paraphrasedFinding:
        "Item 1 describes Walmart+ shopping benefits and Sam’s Club membership fees and benefits.",
    },
    {
      ...evidenceBase,
      id: "wmt-segments",
      topic: "Reportable segments",
      paraphrasedFinding:
        "Walmart reports Walmart U.S., Walmart International and Sam’s Club U.S. as its three segments.",
    },
    {
      ...evidenceBase,
      id: "wmt-edlp",
      topic: "Company-described pricing philosophy",
      paraphrasedFinding:
        "Walmart describes everyday low price, or EDLP, as its own pricing philosophy; this is a company statement, not a FinPath quality assessment.",
    },
  ],
} satisfies BusinessModelProfile;
