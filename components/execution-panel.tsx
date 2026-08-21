"use client";

import { useRef, useState } from "react";
import { ScoreBreakdown } from "@/lib/types";
import { BLOCKED_REASONS } from "@/lib/execution";
import { ScoreBreakdownCard } from "./score-breakdown-card";

interface Actions {
  startWork: (formData: FormData) => void;
  markComplete: (formData: FormData) => void;
  reportBlocked: (formData: FormData) => void;
  resumeSameCrew: (formData: FormData) => void;
  reassignAfterBlock: (formData: FormData) => void;
}

export function AssignedPanel({ workOrderId, crewName, actions }: { workOrderId: string; crewName: string; actions: Actions }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-surface p-4">
      <p className="text-sm text-text-muted">
        Assigned to <span className="text-text-primary">{crewName}</span>, ready to start.
      </p>
      <form action={actions.startWork}>
        <input type="hidden" name="workOrderId" value={workOrderId} />
        <button
          type="submit"
          className="rounded border border-status-medium bg-status-medium-dim px-4 py-2 text-sm font-medium text-status-medium hover:bg-status-medium hover:text-background"
        >
          Start work
        </button>
      </form>
    </div>
  );
}

export function InProgressPanel({ workOrderId, crewName, actions }: { workOrderId: string; crewName: string; actions: Actions }) {
  const [showBlockForm, setShowBlockForm] = useState(false);

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
      <p className="text-sm text-text-muted">
        <span className="text-text-primary">{crewName}</span> is in progress on site.
      </p>

      <div className="flex flex-wrap gap-3">
        <form action={actions.markComplete}>
          <input type="hidden" name="workOrderId" value={workOrderId} />
          <button
            type="submit"
            className="rounded border border-status-good bg-surface-raised px-4 py-2 text-sm font-medium text-status-good hover:bg-status-good hover:text-background"
          >
            Mark complete
          </button>
        </form>

        {!showBlockForm && (
          <button
            type="button"
            onClick={() => setShowBlockForm(true)}
            className="rounded border border-status-high bg-status-high-dim px-4 py-2 text-sm font-medium text-status-high hover:bg-status-high hover:text-background"
          >
            Report blocked
          </button>
        )}
      </div>

      {showBlockForm && (
        <form action={actions.reportBlocked} className="flex flex-col gap-3 rounded border border-status-high bg-status-high-dim p-4">
          <input type="hidden" name="workOrderId" value={workOrderId} />
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-primary">Reason for the blockage</span>
            <select
              name="reason"
              required
              defaultValue=""
              className="rounded border border-border bg-surface px-3 py-2 text-text-primary focus:border-status-medium focus:outline-none"
            >
              <option value="" disabled>
                Choose a reason
              </option>
              {BLOCKED_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="self-start rounded border border-status-high bg-surface px-4 py-2 text-sm font-medium text-status-high hover:bg-status-high hover:text-background"
          >
            Confirm blockage
          </button>
        </form>
      )}
    </div>
  );
}

export function BlockedPanel({
  workOrderId,
  crewName,
  reasonLabel,
  recalculated,
  requiredCapability,
  actions,
}: {
  workOrderId: string;
  crewName: string;
  reasonLabel: string;
  recalculated: ScoreBreakdown[];
  requiredCapability: string;
  actions: Actions;
}) {
  const topTwo = recalculated.slice(0, 2);
  const [selectedCrewId, setSelectedCrewId] = useState(topTwo[0]?.crewId ?? "");
  const [decisionMaker, setDecisionMaker] = useState("Priya Nair");
  const [reasoning, setReasoning] = useState(buildReassignReasoning(topTwo[0], reasonLabel, requiredCapability));
  const touched = useRef(false);

  function handleSelect(breakdown: ScoreBreakdown) {
    setSelectedCrewId(breakdown.crewId);
    if (!touched.current) {
      setReasoning(buildReassignReasoning(breakdown, reasonLabel, requiredCapability));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-status-high bg-status-high-dim p-4">
        <p className="text-sm text-status-high">
          <span className="font-medium">{crewName}</span> reported blocked: {reasonLabel}.
        </p>
        <p className="mt-1 text-xs text-text-muted">The plan has been recalculated below, excluding this crew.</p>
      </div>

      <form action={actions.resumeSameCrew} className="flex items-center justify-between rounded-md border border-border bg-surface p-4">
        <input type="hidden" name="workOrderId" value={workOrderId} />
        <p className="text-sm text-text-muted">
          If the blockage clears, <span className="text-text-primary">{crewName}</span> can resume without a replan.
        </p>
        <button
          type="submit"
          className="rounded border border-border bg-surface-raised px-4 py-2 text-sm font-medium text-text-primary hover:border-status-medium hover:text-status-medium"
        >
          Resume with {crewName}
        </button>
      </form>

      {topTwo.length > 0 && (
        <form action={actions.reassignAfterBlock} className="flex flex-col gap-4">
          <input type="hidden" name="workOrderId" value={workOrderId} />
          <input type="hidden" name="crewId" value={selectedCrewId} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {topTwo.map((breakdown, index) => (
              <button key={breakdown.crewId} type="button" onClick={() => handleSelect(breakdown)} className="text-left focus:outline-none">
                <ScoreBreakdownCard
                  breakdown={breakdown}
                  label={index === 0 ? "Recommended" : "Alternative"}
                  selected={selectedCrewId === breakdown.crewId}
                />
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-text-muted">Decision maker</span>
              <input
                name="decisionMaker"
                value={decisionMaker}
                onChange={(e) => setDecisionMaker(e.target.value)}
                required
                className="rounded border border-border bg-surface-raised px-3 py-2 text-text-primary focus:border-status-medium focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-text-muted">Reasoning (template-generated, editable)</span>
              <textarea
                name="reasoning"
                value={reasoning}
                onChange={(e) => {
                  touched.current = true;
                  setReasoning(e.target.value);
                }}
                required
                rows={3}
                className="rounded border border-border bg-surface-raised px-3 py-2 text-text-primary focus:border-status-medium focus:outline-none"
              />
            </label>
            <button
              type="submit"
              className="self-start rounded border border-status-medium bg-status-medium-dim px-4 py-2 text-sm font-medium text-status-medium hover:bg-status-medium hover:text-background"
            >
              Reassign
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function buildReassignReasoning(breakdown: ScoreBreakdown | undefined, reasonLabel: string, requiredCapability: string): string {
  if (!breakdown) return "";
  const certPhrase = breakdown.hasCertification
    ? `has the required ${requiredCapability.replace(/_/g, " ")} certification`
    : `lacks the required ${requiredCapability.replace(/_/g, " ")} certification`;
  return `Original crew blocked (${reasonLabel}). Reassigning to ${breakdown.crewName}, who ${certPhrase} and is ${breakdown.distanceKm}km away.`;
}

export function CompletePanel({ crewName }: { crewName: string }) {
  return (
    <div className="rounded-md border border-status-good bg-surface-raised p-4">
      <p className="text-sm text-status-good">Complete, closed out by {crewName}.</p>
    </div>
  );
}
