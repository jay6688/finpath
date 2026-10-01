export type EvidenceRole =
  | "reported"
  | "derived"
  | "narrative"
  | "verification"
  | "learner-input"
  | "unknown";

export type MetricEvidenceRole = Exclude<EvidenceRole, "narrative">;

export const metricEvidenceLabels = {
  reported: "Reported",
  derived: "FinPath derived",
  verification: "Verification",
  "learner-input": "Learner input",
  unknown: "Role unavailable",
} as const satisfies Record<MetricEvidenceRole, string>;
