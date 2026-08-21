import { assets, crews, locations, workOrders } from "./seed-data";
import { scoreCrewsForWorkOrder } from "./scoring";
import { Asset, Location, ScoreBreakdown, WorkOrder } from "./types";

export interface WorkOrderRanking {
  workOrder: WorkOrder;
  asset: Asset;
  location: Location;
  ranked: ScoreBreakdown[];
}

/** Ranks every crew (not just nearby ones) against a work order, for the
 * Resource and Response Planning screen. Considers the full roster on
 * purpose: a closer but uncertified alternative only makes sense to show
 * if the scoring engine sees everyone, not a pre-filtered radius. */
export function getRankingForWorkOrder(workOrderId: string): WorkOrderRanking | null {
  const workOrder = workOrders.find((wo) => wo.id === workOrderId);
  if (!workOrder) return null;

  const asset = assets.find((a) => a.id === workOrder.assetId);
  if (!asset) return null;

  const location = locations.find((l) => l.id === asset.locationId);
  if (!location) return null;

  const locationMap = new Map(locations.map((l) => [l.id, l]));
  const ranked = scoreCrewsForWorkOrder(workOrder, asset, location, crews, locationMap);

  return { workOrder, asset, location, ranked };
}

/**
 * A short, clearly-template-generated reasoning sentence, deliberately not
 * framed as an assistant explaining itself. It's just the score breakdown
 * restated in words, nothing in the sentence isn't already visible in the
 * numbers next to it.
 */
export function describeCandidate(breakdown: ScoreBreakdown, requiredCapability: string): string {
  const workloadPhrase =
    breakdown.workloadPenalty === 0
      ? "low current workload"
      : breakdown.workloadPenalty <= 8
        ? "moderate current workload"
        : "high current workload";

  const certPhrase = breakdown.hasCertification
    ? `has the required ${requiredCapability.replace(/_/g, " ")} certification`
    : `lacks the required ${requiredCapability.replace(/_/g, " ")} certification and would need specialist backup`;

  return `${breakdown.crewName} ${certPhrase}, ${breakdown.distanceKm}km away, with a ${workloadPhrase}.`;
}
