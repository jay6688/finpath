import type { BusinessModelProfile } from "./types.ts";

const company = {
  slug: "aapl",
  ticker: "AAPL",
  name: "Apple Inc.",
  cik: "0000320193",
} as const;

const filing = {
  fiscalYear: 2025,
  form: "10-K",
  filedAt: "2025-10-31",
  accession: "0000320193-25-000079",
  sourceUrl:
    "https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/0000320193-25-000079-index.htm",
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

export const appleBusinessModelProfile = {
  company,
  filing,
  summary:
    "Apple designs and sells devices and related services. Its reviewed filing separates what it offers from the geographic segments management uses to report the business.",
  offerings: [
    {
      id: "apple-devices",
      title: "Devices and accessories",
      description:
        "iPhone, Mac, iPad, wearables, home products and accessories form the main product groups described in Item 1.",
      evidenceIds: ["apple-offerings"],
    },
    {
      id: "apple-services",
      title: "Related services",
      description:
        "Apple describes advertising, AppleCare, cloud services, digital content and payment services alongside its products.",
      evidenceIds: ["apple-services"],
    },
  ],
  customersOrUsers: [
    {
      id: "apple-consumer-markets",
      title: "Consumers",
      description:
        "Individual customers buy products or use service platforms in Apple’s consumer market.",
      evidenceIds: ["apple-customers"],
    },
    {
      id: "apple-organization-markets",
      title: "Organizations",
      description:
        "Apple also names small and mid-sized businesses, education, enterprise and government markets.",
      evidenceIds: ["apple-customers"],
    },
    {
      id: "apple-distribution-partners",
      title: "Distribution partners",
      description:
        "Products and some services also reach customers through cellular carriers and other resellers.",
      evidenceIds: ["apple-distribution"],
    },
  ],
  moneyPaths: [
    {
      id: "apple-product-sale",
      payer: "Customer or distribution partner",
      receives: "An Apple device or accessory",
      mechanism: "Product purchase → Revenue",
      evidenceIds: ["apple-offerings", "apple-distribution"],
    },
    {
      id: "apple-subscription",
      payer: "Subscriber",
      receives: "Access to digital content services",
      mechanism: "Subscription payment → Revenue",
      evidenceIds: ["apple-services"],
    },
    {
      id: "apple-support",
      payer: "AppleCare customer",
      receives: "Fee-based support and coverage",
      mechanism: "Service fee → Revenue",
      evidenceIds: ["apple-services"],
    },
    {
      id: "apple-advertising",
      payer: "Advertiser or licensing counterparty",
      receives: "Advertising access or a licensing arrangement",
      mechanism: "Advertising or licensing payment → Revenue",
      evidenceIds: ["apple-services"],
    },
  ],
  businessStructure: {
    heading: "Apple reports geographic segments",
    explanation:
      "Apple’s product and service groups explain what it offers. Its reportable segments instead organize the business by geography.",
    groups: [
      {
        id: "apple-geographic-segments",
        title: "Americas · Europe · Greater China · Japan · Rest of Asia Pacific",
        description:
          "These are management and accounting reporting regions, not five different product lines.",
        evidenceIds: ["apple-segments"],
      },
    ],
    boundary:
      "A reportable segment is not automatically a product, brand or way of charging a customer.",
  },
  boundaries: [
    "This profile describes how Apple’s filing presents the business; it does not rank the products or regions.",
    "A product or service can contribute to Revenue without this lesson showing its exact Revenue or profitability.",
    "A familiar product does not by itself prove strong finances or an attractive investment.",
  ],
  evidence: [
    {
      ...evidenceBase,
      id: "apple-offerings",
      topic: "Products",
      paraphrasedFinding:
        "Apple designs, manufactures and markets smartphones, personal computers, tablets, wearables and accessories, with iPhone, Mac, iPad and wearables/home/accessories described as product groups.",
    },
    {
      ...evidenceBase,
      id: "apple-services",
      topic: "Services",
      paraphrasedFinding:
        "Item 1 describes advertising, fee-based AppleCare, cloud services, digital content platforms and subscriptions, and payment services.",
    },
    {
      ...evidenceBase,
      id: "apple-customers",
      topic: "Customer markets",
      paraphrasedFinding:
        "Apple says its customers are primarily in consumer, small and mid-sized business, education, enterprise and government markets.",
    },
    {
      ...evidenceBase,
      id: "apple-distribution",
      topic: "Distribution",
      paraphrasedFinding:
        "Apple sells directly through retail and online stores and its sales force, and indirectly through cellular carriers and other resellers.",
    },
    {
      ...evidenceBase,
      id: "apple-segments",
      topic: "Reportable segments",
      paraphrasedFinding:
        "Apple manages its business primarily by geography and reports Americas, Europe, Greater China, Japan and Rest of Asia Pacific segments.",
    },
  ],
} satisfies BusinessModelProfile;
