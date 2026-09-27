import type { BusinessModelProfile } from "./types.ts";

const company = {
  slug: "msft",
  ticker: "MSFT",
  name: "Microsoft Corporation",
  cik: "0000789019",
} as const;

const filing = {
  fiscalYear: 2026,
  form: "10-K",
  filedAt: "2026-07-29",
  accession: "0001193125-26-323660",
  sourceUrl:
    "https://www.sec.gov/Archives/edgar/data/789019/000119312526323660/0001193125-26-323660-index.htm",
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
  reviewedAt: filing.reviewedAt,
} as const;

export const microsoftBusinessModelProfile = {
  company,
  filing,
  summary:
    "Microsoft offers software, cloud services, devices, content, advertising and support. One reportable segment can contain several offerings and several ways customers pay.",
  offerings: [
    {
      id: "msft-productivity",
      title: "Productivity and business applications",
      description:
        "Microsoft 365, LinkedIn and Dynamics offerings support work, communication and business processes.",
      evidenceIds: ["msft-offerings", "msft-segments"],
    },
    {
      id: "msft-cloud",
      title: "Cloud and server services",
      description:
        "Azure, server products and other cloud services provide computing, storage, platforms and related support.",
      evidenceIds: ["msft-offerings", "msft-segments"],
    },
    {
      id: "msft-personal-computing",
      title: "Personal computing and entertainment",
      description:
        "Windows, devices, XBOX content and services, and search advertising reach consumers, organizations and advertisers.",
      evidenceIds: ["msft-offerings", "msft-segments", "msft-advertising-gaming"],
    },
  ],
  customersOrUsers: [
    {
      id: "msft-organizations",
      title: "Organizations",
      description:
        "Direct sales serve large enterprises, public-sector organizations, and small and medium-sized businesses.",
      evidenceIds: ["msft-distribution"],
    },
    {
      id: "msft-consumers",
      title: "Consumers and players",
      description:
        "Consumer software, devices, games, content and subscriptions are part of Microsoft’s reviewed portfolio.",
      evidenceIds: ["msft-offerings", "msft-advertising-gaming"],
    },
    {
      id: "msft-advertisers",
      title: "Advertisers",
      description:
        "Microsoft delivers online advertising to a global audience and describes search advertising inside More Personal Computing.",
      evidenceIds: ["msft-offerings", "msft-advertising-gaming"],
    },
    {
      id: "msft-partner-channel",
      title: "Customers served through partners",
      description:
        "An indirect partner network helps sell, deploy and manage Microsoft products and services.",
      evidenceIds: ["msft-distribution"],
    },
  ],
  moneyPaths: [
    {
      id: "msft-license-sale",
      payer: "Customer or device maker",
      receives: "Software or a device",
      mechanism: "License or product sale → Revenue",
      evidenceIds: ["msft-offerings", "msft-revenue-mechanisms"],
    },
    {
      id: "msft-subscription",
      payer: "Subscriber organization or consumer",
      receives: "Ongoing cloud software or content access",
      mechanism: "Subscription payment → Revenue over the service period",
      evidenceIds: ["msft-revenue-mechanisms"],
    },
    {
      id: "msft-consumption",
      payer: "Cloud customer",
      receives: "Cloud resources used during the period",
      mechanism: "Consumption or usage → Revenue",
      evidenceIds: ["msft-revenue-mechanisms"],
    },
    {
      id: "msft-advertising",
      payer: "Advertiser",
      receives: "Advertising placement or completed advertising action",
      mechanism: "Advertising activity → Revenue",
      evidenceIds: ["msft-advertising-gaming", "msft-revenue-mechanisms"],
    },
    {
      id: "msft-services",
      payer: "Customer",
      receives: "Support or consulting work",
      mechanism: "Service delivery → Revenue",
      evidenceIds: ["msft-offerings", "msft-revenue-mechanisms"],
    },
  ],
  businessStructure: {
    heading: "Microsoft reports three broad segments",
    explanation:
      "The segments group portfolios for management and financial reporting. They are broader than a single product or payment mechanism.",
    groups: [
      {
        id: "msft-pbp",
        title: "Productivity and Business Processes",
        description: "Includes Microsoft 365, LinkedIn and Dynamics offerings.",
        evidenceIds: ["msft-segments"],
      },
      {
        id: "msft-intelligent-cloud",
        title: "Intelligent Cloud",
        description: "Includes server products, cloud services and enterprise services.",
        evidenceIds: ["msft-segments"],
      },
      {
        id: "msft-mpc",
        title: "More Personal Computing",
        description: "Includes Windows and devices, XBOX, and search advertising.",
        evidenceIds: ["msft-segments", "msft-advertising-gaming"],
      },
    ],
    boundary:
      "A segment can contain multiple products, services and Revenue mechanisms; segment does not mean one product.",
  },
  boundaries: [
    "Subscriptions and consumption-based services are different payment patterns; neither is automatically better.",
    "This qualitative profile does not compare segment size, growth, margins or quality.",
    "A broad portfolio does not guarantee stable results or make the shares an attractive investment.",
  ],
  evidence: [
    {
      ...evidenceBase,
      section: "Item 1 · Business",
      id: "msft-offerings",
      topic: "What Microsoft offers",
      paraphrasedFinding:
        "Microsoft describes software, cloud solutions, platforms, content, online advertising, devices, solution support and consulting services.",
    },
    {
      ...evidenceBase,
      section: "Item 1 · Business",
      id: "msft-segments",
      topic: "Reportable segments",
      paraphrasedFinding:
        "Microsoft reports Productivity and Business Processes, Intelligent Cloud, and More Personal Computing, each containing multiple products and services.",
    },
    {
      ...evidenceBase,
      section: "Item 1 · Business",
      id: "msft-distribution",
      topic: "Customers and channels",
      paraphrasedFinding:
        "Microsoft’s direct sales serve enterprises, public-sector organizations and smaller businesses; partners also sell, deploy and manage its offerings.",
    },
    {
      ...evidenceBase,
      section: "Item 1 · Business",
      id: "msft-advertising-gaming",
      topic: "Advertising and XBOX",
      paraphrasedFinding:
        "Item 1 describes search advertising and says XBOX Revenue is mainly affected by subscriptions, content sales and advertising.",
    },
    {
      ...evidenceBase,
      section: "Item 8 · Note 1 · Revenue Recognition",
      id: "msft-revenue-mechanisms",
      topic: "How payments become Revenue",
      paraphrasedFinding:
        "The same 10-K explains product and license sales, cloud subscriptions, cloud consumption, advertising, support and consulting as distinct Revenue mechanisms.",
    },
  ],
} satisfies BusinessModelProfile;
