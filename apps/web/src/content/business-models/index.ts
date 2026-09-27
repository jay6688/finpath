import { appleBusinessModelProfile } from "./aapl.ts";
import { microsoftBusinessModelProfile } from "./msft.ts";
export { businessModelTeachingReference } from "./references.ts";
import type {
  BusinessModelProfile,
  ReviewedMoneyPath,
  ReviewedNarrativeEvidence,
  ReviewedTeachingItem,
} from "./types.ts";
import { walmartBusinessModelProfile } from "./wmt.ts";

export type {
  BusinessModelCompany,
  BusinessModelProfile,
  ReviewedNarrativeEvidence,
} from "./types.ts";

type ExpectedIdentity = {
  slug: string;
  name: string;
  cik: string;
  fiscalYear: number;
  filedAt: string;
  accession: string;
  sourceUrl: string;
};

const expectedIdentities: Record<string, ExpectedIdentity> = {
  AAPL: {
    slug: "aapl",
    name: "Apple Inc.",
    cik: "0000320193",
    fiscalYear: 2025,
    filedAt: "2025-10-31",
    accession: "0000320193-25-000079",
    sourceUrl:
      "https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/0000320193-25-000079-index.htm",
  },
  MSFT: {
    slug: "msft",
    name: "Microsoft Corporation",
    cik: "0000789019",
    fiscalYear: 2026,
    filedAt: "2026-07-29",
    accession: "0001193125-26-323660",
    sourceUrl:
      "https://www.sec.gov/Archives/edgar/data/789019/000119312526323660/0001193125-26-323660-index.htm",
  },
  WMT: {
    slug: "wmt",
    name: "Walmart Inc.",
    cik: "0000104169",
    fiscalYear: 2026,
    filedAt: "2026-03-13",
    accession: "0000104169-26-000055",
    sourceUrl:
      "https://www.sec.gov/Archives/edgar/data/104169/000010416926000055/0000104169-26-000055-index.htm",
  },
};

const allowedEvidenceSections = new Set([
  "Item 1 · Business",
  "Item 8 · Note 1 · Revenue Recognition",
]);

function objectAt(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${path} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function stringAt(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${path} must be a non-empty string.`);
  }
  return value;
}

function arrayAt(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${path} must be a non-empty array.`);
  }
  return value;
}

function rejectNumericEvidenceShape(value: unknown, path = "profile"): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectNumericEvidenceShape(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (["taxonomyTag", "taxonomyNamespace"].includes(key)) {
      throw new Error(`${path}.${key} is not allowed for narrative evidence.`);
    }
    rejectNumericEvidenceShape(nested, `${path}.${key}`);
  }
}

function validateEvidence(
  value: unknown,
  profilePath: string,
  expected: ExpectedIdentity,
  ticker: string,
): ReviewedNarrativeEvidence {
  const evidence = objectAt(value, profilePath);
  const id = stringAt(evidence.id, `${profilePath}.id`);
  if (evidence.sourceType !== "SEC filing narrative") {
    throw new Error(`${profilePath}.sourceType must identify SEC filing narrative.`);
  }

  const company = objectAt(evidence.company, `${profilePath}.company`);
  if (
    company.ticker !== ticker ||
    company.name !== expected.name ||
    company.cik !== expected.cik
  ) {
    throw new Error(`${profilePath}.company does not match its reviewed profile.`);
  }
  if (
    evidence.fiscalYear !== expected.fiscalYear ||
    evidence.form !== "10-K" ||
    evidence.filedAt !== expected.filedAt ||
    evidence.accession !== expected.accession ||
    evidence.sourceUrl !== expected.sourceUrl
  ) {
    throw new Error(`${profilePath} does not match the reviewed filing identity.`);
  }
  if (!allowedEvidenceSections.has(stringAt(evidence.section, `${profilePath}.section`))) {
    throw new Error(`${profilePath}.section is not an approved reviewed section.`);
  }
  stringAt(evidence.reviewedAt, `${profilePath}.reviewedAt`);
  stringAt(evidence.topic, `${profilePath}.topic`);
  const finding = stringAt(
    evidence.paraphrasedFinding,
    `${profilePath}.paraphrasedFinding`,
  );
  if (finding.length >= 260) {
    throw new Error(`${profilePath}.paraphrasedFinding must remain concise.`);
  }
  return { ...evidence, id } as ReviewedNarrativeEvidence;
}

function validateTeachingItem(
  value: unknown,
  path: string,
  evidenceIds: ReadonlySet<string>,
): ReviewedTeachingItem {
  const item = objectAt(value, path);
  const id = stringAt(item.id, `${path}.id`);
  stringAt(item.title, `${path}.title`);
  stringAt(item.description, `${path}.description`);
  const references = arrayAt(item.evidenceIds, `${path}.evidenceIds`).map(
    (reference, index) => stringAt(reference, `${path}.evidenceIds[${index}]`),
  );
  for (const reference of references) {
    if (!evidenceIds.has(reference)) {
      throw new Error(`${path} references unknown evidence ${reference}.`);
    }
  }
  return { ...item, id, evidenceIds: references } as ReviewedTeachingItem;
}

function validateMoneyPath(
  value: unknown,
  path: string,
  evidenceIds: ReadonlySet<string>,
): ReviewedMoneyPath {
  const item = objectAt(value, path);
  const id = stringAt(item.id, `${path}.id`);
  stringAt(item.payer, `${path}.payer`);
  stringAt(item.receives, `${path}.receives`);
  stringAt(item.mechanism, `${path}.mechanism`);
  const references = arrayAt(item.evidenceIds, `${path}.evidenceIds`).map(
    (reference, index) => stringAt(reference, `${path}.evidenceIds[${index}]`),
  );
  for (const reference of references) {
    if (!evidenceIds.has(reference)) {
      throw new Error(`${path} references unknown evidence ${reference}.`);
    }
  }
  return { ...item, id, evidenceIds: references } as ReviewedMoneyPath;
}

function validateProfile(value: unknown, index: number): BusinessModelProfile {
  const path = `profiles[${index}]`;
  const profile = objectAt(value, path);
  rejectNumericEvidenceShape(profile, path);

  const company = objectAt(profile.company, `${path}.company`);
  const ticker = stringAt(company.ticker, `${path}.company.ticker`);
  const expected = expectedIdentities[ticker];
  if (!expected) throw new Error(`${path} has an unsupported company ticker.`);
  if (
    company.slug !== expected.slug ||
    company.name !== expected.name ||
    company.cik !== expected.cik
  ) {
    throw new Error(`${path}.company does not match the approved identity.`);
  }

  const filing = objectAt(profile.filing, `${path}.filing`);
  if (
    filing.fiscalYear !== expected.fiscalYear ||
    filing.form !== "10-K" ||
    filing.filedAt !== expected.filedAt ||
    filing.accession !== expected.accession ||
    filing.sourceUrl !== expected.sourceUrl ||
    filing.primarySection !== "Item 1 · Business" ||
    filing.reviewedAt !== "2026-09-26"
  ) {
    throw new Error(`${path}.filing does not match the approved filing identity.`);
  }

  stringAt(profile.summary, `${path}.summary`);
  const evidence = arrayAt(profile.evidence, `${path}.evidence`).map((item, itemIndex) =>
    validateEvidence(item, `${path}.evidence[${itemIndex}]`, expected, ticker),
  );
  const evidenceIds = new Set(evidence.map((item) => item.id));
  if (evidenceIds.size !== evidence.length) {
    throw new Error(`${path}.evidence contains duplicate IDs.`);
  }

  const offerings = arrayAt(profile.offerings, `${path}.offerings`).map((item, itemIndex) =>
    validateTeachingItem(item, `${path}.offerings[${itemIndex}]`, evidenceIds),
  );
  const customersOrUsers = arrayAt(
    profile.customersOrUsers,
    `${path}.customersOrUsers`,
  ).map((item, itemIndex) =>
    validateTeachingItem(item, `${path}.customersOrUsers[${itemIndex}]`, evidenceIds),
  );
  const moneyPaths = arrayAt(profile.moneyPaths, `${path}.moneyPaths`).map(
    (item, itemIndex) =>
      validateMoneyPath(item, `${path}.moneyPaths[${itemIndex}]`, evidenceIds),
  );

  const structure = objectAt(profile.businessStructure, `${path}.businessStructure`);
  stringAt(structure.heading, `${path}.businessStructure.heading`);
  stringAt(structure.explanation, `${path}.businessStructure.explanation`);
  stringAt(structure.boundary, `${path}.businessStructure.boundary`);
  const groups = arrayAt(
    structure.groups,
    `${path}.businessStructure.groups`,
  ).map((item, itemIndex) =>
    validateTeachingItem(
      item,
      `${path}.businessStructure.groups[${itemIndex}]`,
      evidenceIds,
    ),
  );
  arrayAt(profile.boundaries, `${path}.boundaries`).forEach((boundary, boundaryIndex) =>
    stringAt(boundary, `${path}.boundaries[${boundaryIndex}]`),
  );

  return {
    ...profile,
    company,
    filing,
    evidence,
    offerings,
    customersOrUsers,
    moneyPaths,
    businessStructure: { ...structure, groups },
  } as unknown as BusinessModelProfile;
}

export function validateBusinessModelProfiles(value: unknown): BusinessModelProfile[] {
  if (!Array.isArray(value) || value.length !== 3) {
    throw new Error("Business Model content must contain exactly three reviewed profiles.");
  }
  const profiles = value.map(validateProfile);
  const tickers = new Set(profiles.map((profile) => profile.company.ticker));
  for (const ticker of Object.keys(expectedIdentities)) {
    if (!tickers.has(ticker as BusinessModelProfile["company"]["ticker"])) {
      throw new Error(`Business Model content is missing ${ticker}.`);
    }
  }
  return profiles;
}

export const businessModelProfiles = validateBusinessModelProfiles([
  appleBusinessModelProfile,
  microsoftBusinessModelProfile,
  walmartBusinessModelProfile,
]);

export function getBusinessModelProfile(identifier: string): BusinessModelProfile {
  const normalized = identifier.trim().toLowerCase();
  const profile = businessModelProfiles.find(
    (candidate) =>
      candidate.company.slug === normalized ||
      candidate.company.ticker.toLowerCase() === normalized,
  );
  if (!profile) {
    throw new Error(`No reviewed Business Model profile is available for ${identifier}.`);
  }
  return profile;
}
