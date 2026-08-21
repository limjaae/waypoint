"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ScoreBreakdown } from "@/lib/types";
import { BLOCKED_REASONS } from "@/lib/execution";
import { ScoreBreakdownCard } from "./score-breakdown-card";

interface Actions {
  startWork: (formData: FormData) => Promise<void>;
  markComplete: (formData: FormData) => Promise<void>;
  reportBlocked: (formData: FormData) => Promise<void>;
  resumeSameCrew: (formData: FormData) => Promise<void>;
  reassignAfterBlock: (formData: FormData) => Promise<void>;
}

// Every Server Action here already revalidates the paths that need refreshing;
// wrapping the call in a transition (rather than the built-in <form action>)
// buys us one thing the plain form can't: a toast the moment it settles. The
// panel is on the same page before and after, so without this the only sign
// anything happened is the UI quietly re-rendering a beat later.
function useActionFeedback(action: (formData: FormData) => Promise<void>, successMessage: string) {
  const [isPending, startTransition] = useTransition();

  function run(formData: FormData) {
    startTransition(async () => {
      try {
        await action(formData);
        toast.success(successMessage);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "That didn't go through, try again.");
      }
    });
  }

  return { run, isPending };
}

const PRESS_FEEDBACK =
  "active:scale-[0.97] transition-transform duration-100 motion-reduce:active:scale-100 motion-reduce:transition-none disabled:opacity-60 disabled:pointer-events-none";

export function AssignedPanel({ workOrderId, crewName, actions }: { workOrderId: string; crewName: string; actions: Actions }) {
  const { run, isPending } = useActionFeedback(actions.startWork, "Work started");

  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-surface p-4">
      <p className="text-sm text-text-muted">
        Assigned to <span className="text-text-primary">{crewName}</span>, ready to start.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(new FormData(e.currentTarget));
        }}
      >
        <input type="hidden" name="workOrderId" value={workOrderId} />
        <button
          type="submit"
          disabled={isPending}
          className={`rounded border border-status-medium bg-status-medium-dim px-4 py-2 text-sm font-medium text-status-medium hover:bg-status-medium hover:text-background ${PRESS_FEEDBACK}`}
        >
          {isPending ? "Starting…" : "Start work"}
        </button>
      </form>
    </div>
  );
}

export function InProgressPanel({ workOrderId, crewName, actions }: { workOrderId: string; crewName: string; actions: Actions }) {
  const [showBlockForm, setShowBlockForm] = useState(false);
  // Mount immediately at the hidden end-state, then flip a frame later so the
  // transition actually has somewhere to run from, the CSS-only equivalent
  // of @starting-style for browsers that don't support it yet.
  const [blockFormEntered, setBlockFormEntered] = useState(false);
  const complete = useActionFeedback(actions.markComplete, "Marked complete");
  const blocked = useActionFeedback(actions.reportBlocked, "Blockage logged, recalculating the plan");

  useEffect(() => {
    if (!showBlockForm) return;
    const frame = requestAnimationFrame(() => setBlockFormEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [showBlockForm]);

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
      <p className="text-sm text-text-muted">
        <span className="text-text-primary">{crewName}</span> is in progress on site.
      </p>

      <div className="flex flex-wrap gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            complete.run(new FormData(e.currentTarget));
          }}
        >
          <input type="hidden" name="workOrderId" value={workOrderId} />
          <button
            type="submit"
            disabled={complete.isPending}
            className={`rounded border border-status-good bg-surface-raised px-4 py-2 text-sm font-medium text-status-good hover:bg-status-good hover:text-background ${PRESS_FEEDBACK}`}
          >
            {complete.isPending ? "Completing…" : "Mark complete"}
          </button>
        </form>

        {!showBlockForm && (
          <button
            type="button"
            onClick={() => setShowBlockForm(true)}
            className={`rounded border border-status-high bg-status-high-dim px-4 py-2 text-sm font-medium text-status-high hover:bg-status-high hover:text-background ${PRESS_FEEDBACK}`}
          >
            Report blocked
          </button>
        )}
      </div>

      {showBlockForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            blocked.run(new FormData(e.currentTarget));
          }}
          className={`flex flex-col gap-3 rounded border border-status-high bg-status-high-dim p-4 transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
            blockFormEntered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
          }`}
        >
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
            disabled={blocked.isPending}
            className={`self-start rounded border border-status-high bg-surface px-4 py-2 text-sm font-medium text-status-high hover:bg-status-high hover:text-background ${PRESS_FEEDBACK}`}
          >
            {blocked.isPending ? "Logging…" : "Confirm blockage"}
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
  const resume = useActionFeedback(actions.resumeSameCrew, `Resumed with ${crewName}`);
  const reassign = useActionFeedback(
    actions.reassignAfterBlock,
    `Reassigned to ${topTwo.find((c) => c.crewId === selectedCrewId)?.crewName ?? "the new crew"}`
  );

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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          resume.run(new FormData(e.currentTarget));
        }}
        className="flex items-center justify-between rounded-md border border-border bg-surface p-4"
      >
        <input type="hidden" name="workOrderId" value={workOrderId} />
        <p className="text-sm text-text-muted">
          If the blockage clears, <span className="text-text-primary">{crewName}</span> can resume without a replan.
        </p>
        <button
          type="submit"
          disabled={resume.isPending}
          className={`rounded border border-border bg-surface-raised px-4 py-2 text-sm font-medium text-text-primary hover:border-status-medium hover:text-status-medium ${PRESS_FEEDBACK}`}
        >
          {resume.isPending ? "Resuming…" : `Resume with ${crewName}`}
        </button>
      </form>

      {topTwo.length > 0 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            reassign.run(new FormData(e.currentTarget));
          }}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="workOrderId" value={workOrderId} />
          <input type="hidden" name="crewId" value={selectedCrewId} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {topTwo.map((breakdown, index) => (
              <button
                key={breakdown.crewId}
                type="button"
                onClick={() => handleSelect(breakdown)}
                className={`text-left focus:outline-none ${PRESS_FEEDBACK}`}
              >
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
              disabled={reassign.isPending}
              className={`self-start rounded border border-status-medium bg-status-medium-dim px-4 py-2 text-sm font-medium text-status-medium hover:bg-status-medium hover:text-background ${PRESS_FEEDBACK}`}
            >
              {reassign.isPending ? "Reassigning…" : "Reassign"}
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
