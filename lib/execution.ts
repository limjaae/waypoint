import { BlockedReason, ScoreBreakdown } from "./types";
import { getRankingForWorkOrder } from "./planning";

export const BLOCKED_REASONS: { value: BlockedReason; label: string }[] = [
  { value: "missing_equipment", label: "Missing equipment" },
  { value: "weather", label: "Weather" },
  { value: "access_issue", label: "Access issue" },
  { value: "needs_specialist", label: "Needs a specialist" },
];

export function blockedReasonLabel(reason: BlockedReason | undefined): string {
  return BLOCKED_REASONS.find((r) => r.value === reason)?.label ?? "Unspecified";
}

/**
 * Re-runs the scoring engine with the blocked crew excluded, so the operator
 * sees a fresh recommended and alternative pair right away.
 */
export function getRecalculatedCandidates(workOrderId: string, blockedCrewId: string): ScoreBreakdown[] {
  const ranking = getRankingForWorkOrder(workOrderId);
  if (!ranking) return [];
  return ranking.ranked.filter((candidate) => candidate.crewId !== blockedCrewId);
}
