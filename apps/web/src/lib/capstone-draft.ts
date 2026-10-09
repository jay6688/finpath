export const CAPSTONE_DRAFT_SCHEMA_VERSION = 1 as const;

export type JudgmentStance = "strong" | "weak" | "uncertain";
export type ValuationResolution =
  | { state: "unresolved"; priceInput: "" }
  | { state: "unassessed"; priceInput: "" }
  | { state: "scenario"; priceInput: string };

export type LearnerJudgment = {
  id: string;
  questionId: string;
  stance: JudgmentStance;
  interpretation: string;
  basis: string;
  evidenceIds: string[];
};

export type CapstoneDraft = {
  schemaVersion: typeof CAPSTONE_DRAFT_SCHEMA_VERSION;
  company: string;
  filingAccession: string;
  selectedEvidenceIds: string[];
  judgments: LearnerJudgment[];
  uncertainty: string;
  valuation: ValuationResolution;
  noteReviewed: boolean;
};

type DraftIdentity = { company: string; accession: string };
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type EvidenceSummary = {
  id: string;
  label: string;
  displayValue: string;
  provenance: "reported" | "reviewed" | "finpath-derived";
};

export function buildCapstoneDraftKey({ company, accession }: DraftIdentity): string {
  const normalizedCompany = company.trim().toLowerCase();
  const normalizedAccession = accession.trim();
  if (!normalizedCompany || !normalizedAccession) {
    throw new Error("Capstone draft identity requires a company and filing accession.");
  }
  return `finpath.capstone-draft:v${CAPSTONE_DRAFT_SCHEMA_VERSION}:${normalizedCompany}:${normalizedAccession}`;
}

export function createEmptyCapstoneDraft({
  company,
  accession,
}: DraftIdentity): CapstoneDraft {
  return {
    schemaVersion: CAPSTONE_DRAFT_SCHEMA_VERSION,
    company: company.trim().toLowerCase(),
    filingAccession: accession.trim(),
    selectedEvidenceIds: [],
    judgments: [],
    uncertainty: "",
    valuation: { state: "unresolved", priceInput: "" },
    noteReviewed: false,
  };
}

function identityFromKey(key: string): DraftIdentity {
  const prefix = `finpath.capstone-draft:v${CAPSTONE_DRAFT_SCHEMA_VERSION}:`;
  const identity = key.startsWith(prefix) ? key.slice(prefix.length) : "";
  const separator = identity.indexOf(":");
  if (separator <= 0 || separator === identity.length - 1) {
    throw new Error("Capstone draft key is invalid.");
  }
  return {
    company: identity.slice(0, separator),
    accession: identity.slice(separator + 1),
  };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function normalizeDraft(value: unknown, identity: DraftIdentity): CapstoneDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Capstone draft must be an object.");
  }
  const draft = value as Record<string, unknown>;
  if (
    draft.schemaVersion !== CAPSTONE_DRAFT_SCHEMA_VERSION ||
    draft.company !== identity.company ||
    draft.filingAccession !== identity.accession ||
    !isStringArray(draft.selectedEvidenceIds) ||
    typeof draft.uncertainty !== "string" ||
    typeof draft.noteReviewed !== "boolean" ||
    !Array.isArray(draft.judgments)
  ) {
    throw new Error("Capstone draft identity or schema is invalid.");
  }

  const judgments = draft.judgments.map((value, index) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`Capstone judgment ${index} is invalid.`);
    }
    const judgment = value as Record<string, unknown>;
    if (
      typeof judgment.id !== "string" ||
      typeof judgment.questionId !== "string" ||
      !["strong", "weak", "uncertain"].includes(String(judgment.stance)) ||
      typeof judgment.interpretation !== "string" ||
      typeof judgment.basis !== "string" ||
      !isStringArray(judgment.evidenceIds)
    ) {
      throw new Error(`Capstone judgment ${index} is invalid.`);
    }
    return judgment as LearnerJudgment;
  });

  const valuation = draft.valuation;
  if (!valuation || typeof valuation !== "object" || Array.isArray(valuation)) {
    throw new Error("Capstone valuation state is invalid.");
  }
  const valuationRecord = valuation as Record<string, unknown>;
  if (
    !["unresolved", "unassessed", "scenario"].includes(String(valuationRecord.state)) ||
    typeof valuationRecord.priceInput !== "string" ||
    (valuationRecord.state !== "scenario" && valuationRecord.priceInput !== "")
  ) {
    throw new Error("Capstone valuation state is invalid.");
  }

  return {
    schemaVersion: CAPSTONE_DRAFT_SCHEMA_VERSION,
    company: identity.company,
    filingAccession: identity.accession,
    selectedEvidenceIds: [...new Set(draft.selectedEvidenceIds)],
    judgments,
    uncertainty: draft.uncertainty,
    valuation: valuationRecord as ValuationResolution,
    noteReviewed: draft.noteReviewed,
  };
}

export function readCapstoneDraft(storage: StorageLike | null, key: string): {
  status: "empty" | "restored" | "corrupt" | "unavailable";
  draft: CapstoneDraft;
  persistence: "local-browser" | "session-only";
} {
  const identity = identityFromKey(key);
  const empty = createEmptyCapstoneDraft(identity);
  if (!storage) {
    return { status: "unavailable", draft: empty, persistence: "session-only" };
  }
  try {
    const serialized = storage.getItem(key);
    if (serialized === null) {
      return { status: "empty", draft: empty, persistence: "local-browser" };
    }
    return {
      status: "restored",
      draft: normalizeDraft(JSON.parse(serialized), identity),
      persistence: "local-browser",
    };
  } catch {
    return { status: "corrupt", draft: empty, persistence: "session-only" };
  }
}

export function writeCapstoneDraft(
  storage: StorageLike | null,
  key: string,
  draft: CapstoneDraft,
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify(normalizeDraft(draft, identityFromKey(key))));
    return true;
  } catch {
    return false;
  }
}

export function clearCapstoneDraft(storage: StorageLike | null, key: string): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function deriveScenarioValuation({
  price,
  sharesOutstanding,
  dilutedEps,
}: {
  price: number;
  sharesOutstanding: number;
  dilutedEps: string;
}) {
  const eps = Number(dilutedEps);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Enter a positive educational price.");
  }
  if (!Number.isSafeInteger(sharesOutstanding) || sharesOutstanding <= 0) {
    throw new Error("Scenario valuation requires reviewed Shares Outstanding.");
  }
  if (!Number.isFinite(eps) || eps <= 0) {
    throw new Error("Scenario valuation requires positive reviewed annual EPS.");
  }
  return {
    recordType: "Scenario Record" as const,
    provenance: "learner-scenario" as const,
    price,
    marketCapPrice: price,
    pePrice: price,
    marketCap: price * sharesOutstanding,
    annualPE: price / eps,
    boundary: "Educational scenario only · not current market data",
  };
}

export function validateCapstoneCompletion(draft: CapstoneDraft): {
  complete: boolean;
  missing: string[];
} {
  const selected = new Set(draft.selectedEvidenceIds);
  const validJudgments = draft.judgments.filter(
    (judgment) =>
      judgment.interpretation.trim() !== "" &&
      judgment.evidenceIds.length > 0 &&
      judgment.evidenceIds.every((id) => selected.has(id)) &&
      (judgment.stance === "uncertain" || judgment.basis.trim() !== ""),
  );
  const missing: string[] = [];
  if (validJudgments.length < 2) missing.push("two evidence-linked learner judgments");
  if (!draft.uncertainty.trim()) missing.push("one explicit uncertainty");
  if (draft.valuation.state === "unresolved") missing.push("a resolved valuation choice");
  if (
    draft.valuation.state === "scenario" &&
    (!Number.isFinite(Number(draft.valuation.priceInput)) || Number(draft.valuation.priceInput) <= 0)
  ) {
    missing.push("a positive educational price");
  }
  if (!draft.noteReviewed) missing.push("Analysis Note review");
  return { complete: missing.length === 0, missing };
}

export function buildLearnerAnalysisNote(
  draft: CapstoneDraft,
  evidenceCatalog: readonly EvidenceSummary[],
) {
  const evidenceById = new Map(evidenceCatalog.map((item) => [item.id, item]));
  const judgments = draft.judgments.map((judgment) => ({
    ...judgment,
    citation: {
      recordType: "Judgment Citation" as const,
      provenance: "learner-judgment" as const,
      evidence: judgment.evidenceIds.flatMap((id) => {
        const evidence = evidenceById.get(id);
        return evidence ? [evidence] : [];
      }),
    },
  }));
  const strong = judgments.filter((item) => item.stance === "strong");
  const weak = judgments.filter((item) => item.stance === "weak");
  const uncertain = judgments.filter((item) => item.stance === "uncertain");

  return {
    strong,
    weak,
    uncertain,
    weakState:
      weak.length === 0
        ? "No supported weakness identified from this evidence package."
        : null,
    explicitUncertainty: draft.uncertainty,
    valuation: draft.valuation,
  };
}
