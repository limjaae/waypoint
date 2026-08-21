import { ScoreBreakdown } from "@/lib/types";

export function ScoreBreakdownCard({
  breakdown,
  label,
  selected,
}: {
  breakdown: ScoreBreakdown;
  label: "Recommended" | "Alternative";
  selected: boolean;
}) {
  const labelStyle = label === "Recommended" ? "text-status-good bg-surface-raised" : "text-status-medium bg-status-medium-dim";

  return (
    <div
      className={`rounded-md border p-4 transition-colors ${
        selected ? "border-status-medium bg-surface-raised" : "border-border bg-surface"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className={`rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${labelStyle}`}>{label}</span>
        <span className="font-mono text-xs text-text-faint">score {breakdown.total}</span>
      </div>
      <p className="text-lg font-semibold text-text-primary">{breakdown.crewName}</p>
      <p className="mb-3 text-sm text-text-muted">
        {breakdown.distanceKm}km away · {breakdown.hasCertification ? "Certified" : "Not certified"}
      </p>
      <dl className="grid grid-cols-2 gap-y-1 text-xs">
        <dt className="text-text-faint">Priority weight</dt>
        <dd className="text-right text-text-primary">+{breakdown.priorityWeight}</dd>
        <dt className="text-text-faint">Capability match</dt>
        <dd className={`text-right ${breakdown.capabilityMatch < 0 ? "text-status-critical" : "text-text-primary"}`}>
          {breakdown.capabilityMatch >= 0 ? "+" : ""}
          {breakdown.capabilityMatch}
        </dd>
        <dt className="text-text-faint">Proximity</dt>
        <dd className="text-right text-text-primary">+{breakdown.proximityScore}</dd>
        <dt className="text-text-faint">Workload penalty</dt>
        <dd className="text-right text-status-high">−{breakdown.workloadPenalty}</dd>
      </dl>
    </div>
  );
}
