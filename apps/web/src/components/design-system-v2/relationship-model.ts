import type { FinancialObjectKind, RelationshipDatum } from "./types";

export type FocusedRelationship = RelationshipDatum & {
  direction: "incoming" | "outgoing";
  counterpart: FinancialObjectKind;
};

export function getFocusedRelationships(
  relationships: RelationshipDatum[],
  selectedId: FinancialObjectKind,
): FocusedRelationship[] {
  return relationships.flatMap<FocusedRelationship>((relationship) => {
    if (relationship.from === selectedId) {
      return [{ ...relationship, direction: "outgoing" as const, counterpart: relationship.to }];
    }
    if (relationship.to === selectedId) {
      return [{ ...relationship, direction: "incoming" as const, counterpart: relationship.from }];
    }
    return [];
  });
}
