"use client";

import { useRef, useState } from "react";
import { ScoreBreakdown } from "@/lib/types";
import { ScoreBreakdownCard } from "./score-breakdown-card";

interface Candidate {
  breakdown: ScoreBreakdown;
  label: "Recommended" | "Alternative";
  autoReasoning: string;
}

const PRESS_FEEDBACK = "active:scale-[0.97] transition-transform duration-100 motion-reduce:active:scale-100 motion-reduce:transition-none";

export function PlanForm({
  workOrderId,
  candidates,
  action,
}: {
  workOrderId: string;
  candidates: Candidate[];
  action: (formData: FormData) => void;
}) {
  const [selectedCrewId, setSelectedCrewId] = useState(candidates[0]?.breakdown.crewId ?? "");
  const [reasoning, setReasoning] = useState(candidates[0]?.autoReasoning ?? "");
  const [decisionMaker, setDecisionMaker] = useState("Priya Nair");
  const reasoningTouched = useRef(false);

  function handleSelect(candidate: Candidate) {
    setSelectedCrewId(candidate.breakdown.crewId);
    if (!reasoningTouched.current) {
      setReasoning(candidate.autoReasoning);
    }
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="workOrderId" value={workOrderId} />
      <input type="hidden" name="crewId" value={selectedCrewId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {candidates.map((candidate) => (
          <button
            key={candidate.breakdown.crewId}
            type="button"
            onClick={() => handleSelect(candidate)}
            className={`text-left focus:outline-none ${PRESS_FEEDBACK}`}
          >
            <ScoreBreakdownCard
              breakdown={candidate.breakdown}
              label={candidate.label}
              selected={selectedCrewId === candidate.breakdown.crewId}
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
              reasoningTouched.current = true;
              setReasoning(e.target.value);
            }}
            required
            rows={3}
            className="rounded border border-border bg-surface-raised px-3 py-2 text-text-primary focus:border-status-medium focus:outline-none"
          />
        </label>

        <p className="text-xs text-text-faint">
          The operator picks, this only records the choice and why, it never assigns on its own.
        </p>

        <button
          type="submit"
          className={`self-start rounded border border-status-medium bg-status-medium-dim px-4 py-2 text-sm font-medium text-status-medium transition-colors hover:bg-status-medium hover:text-background ${PRESS_FEEDBACK}`}
        >
          Confirm assignment
        </button>
      </div>
    </form>
  );
}
