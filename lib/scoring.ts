import { Asset, Crew, Location, Priority, ScoreBreakdown, WorkOrder } from "./types";

// Every weight below is intentionally visible and easy to tweak, rather than buried
// inside a trained model. The PRD calls this out explicitly: the point of this module
// is that an operator (or an interviewer) can see exactly why a crew was recommended.

const PRIORITY_WEIGHTS: Record<Priority, number> = {
  critical: 40,
  high: 25,
  medium: 12,
  low: 5,
};

const WORKLOAD_PENALTIES: Record<Crew["currentWorkload"], number> = {
  low: 0,
  medium: 8,
  high: 18,
};

const CAPABILITY_MATCH_SCORE = 25;
const NO_CAPABILITY_MATCH_SCORE = -15; // still rankable, just heavily discouraged
const MAX_PROXIMITY_SCORE = 20;
const PROXIMITY_FALLOFF_KM = 40; // distance at which proximity score hits zero

/** Haversine distance in kilometres between two lat/lng points. */
export function distanceKm(a: Location, b: Location): number {
  const R = 6371;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function proximityScore(km: number): number {
  const score = MAX_PROXIMITY_SCORE * (1 - km / PROXIMITY_FALLOFF_KM);
  return Math.max(0, Math.round(score));
}

/**
 * Scores every available crew against a work order and returns them ranked
 * highest first. Crews that are off shift are excluded entirely; busy crews
 * are included but penalised, since an operator may still want to see them
 * as a fallback option.
 */
export function scoreCrewsForWorkOrder(
  workOrder: WorkOrder,
  asset: Asset,
  assetLocation: Location,
  crews: Crew[],
  crewLocations: Map<string, Location>
): ScoreBreakdown[] {
  const candidates = crews.filter((crew) => crew.availability !== "off_shift");

  const scored = candidates.map((crew) => {
    const crewLocation = crewLocations.get(crew.locationId);
    const km = crewLocation ? distanceKm(assetLocation, crewLocation) : PROXIMITY_FALLOFF_KM;

    const hasCertification = crew.certifications.includes(workOrder.requiredCapability);
    const capabilityMatch = hasCertification ? CAPABILITY_MATCH_SCORE : NO_CAPABILITY_MATCH_SCORE;

    const busyPenalty = crew.availability === "busy" ? 20 : 0;
    const workloadPenalty = WORKLOAD_PENALTIES[crew.currentWorkload] + busyPenalty;

    const priorityWeight = PRIORITY_WEIGHTS[workOrder.priority];
    const proximity = proximityScore(km);

    const total = priorityWeight + capabilityMatch + proximity - workloadPenalty;

    const breakdown: ScoreBreakdown = {
      crewId: crew.id,
      crewName: crew.name,
      priorityWeight,
      capabilityMatch,
      proximityScore: proximity,
      workloadPenalty,
      total,
      distanceKm: Math.round(km * 10) / 10,
      hasCertification,
    };

    return breakdown;
  });

  return scored.sort((a, b) => b.total - a.total);
}
