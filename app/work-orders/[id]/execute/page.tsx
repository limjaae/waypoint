import Link from "next/link";
import { notFound } from "next/navigation";
import { PriorityBadge } from "@/components/priority-badge";
import { StatusBadge } from "@/components/status-badge";
import { AssignedPanel, BlockedPanel, CompletePanel, InProgressPanel } from "@/components/execution-panel";
import { crews, workOrders } from "@/lib/seed-data";
import { blockedReasonLabel, getRecalculatedCandidates } from "@/lib/execution";
import { getAssignmentForWorkOrder, getAssignmentHistoryForWorkOrder } from "@/lib/store";
import { markComplete, reassignAfterBlock, reportBlocked, resumeSameCrew, startWork } from "./actions";

export const dynamic = "force-dynamic";

const STEPS = ["assigned", "in_progress", "blocked", "complete"] as const;

export default async function ExecutionAndReplanning({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workOrder = workOrders.find((wo) => wo.id === id);
  if (!workOrder) notFound();

  const assignment = getAssignmentForWorkOrder(id);
  if (!assignment) notFound();

  const crew = crews.find((c) => c.id === assignment.crewId);
  const history = getAssignmentHistoryForWorkOrder(id);

  const actions = { startWork, markComplete, reportBlocked, resumeSameCrew, reassignAfterBlock };

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12 sm:px-10">
      <Link href={`/work-orders/${id}`} className="text-xs font-mono uppercase tracking-widest text-text-faint hover:text-text-muted">
        ← {workOrder.id.toUpperCase()}
      </Link>

      <header className="mt-4 mb-8 border-b border-border pb-6">
        <div className="mb-2 flex items-center gap-2">
          <PriorityBadge priority={workOrder.priority} />
          <span className="font-mono text-xs text-text-faint">Execution and Replanning</span>
        </div>
        <h1 className="text-2xl font-semibold text-text-primary">{workOrder.issueType}</h1>
      </header>

      <ol className="mb-8 flex items-center gap-2 text-xs">
        {STEPS.map((step, index) => (
          <li key={step} className="flex items-center gap-2">
            <span className={assignment.status === step ? "font-semibold" : "text-text-faint"}>
              <StatusBadge status={step} />
            </span>
            {index < STEPS.length - 1 && <span className="text-text-faint">→</span>}
          </li>
        ))}
      </ol>

      {assignment.status === "assigned" && crew && (
        <AssignedPanel workOrderId={id} crewName={crew.name} actions={actions} />
      )}

      {assignment.status === "in_progress" && crew && (
        <InProgressPanel workOrderId={id} crewName={crew.name} actions={actions} />
      )}

      {assignment.status === "blocked" && crew && (
        <BlockedPanel
          workOrderId={id}
          crewName={crew.name}
          reasonLabel={blockedReasonLabel(assignment.blockedReason)}
          recalculated={getRecalculatedCandidates(id, crew.id)}
          requiredCapability={workOrder.requiredCapability}
          actions={actions}
        />
      )}

      {assignment.status === "complete" && crew && <CompletePanel crewName={crew.name} />}

      {history.length > 1 && (
        <section className="mt-8 rounded-md border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-medium text-text-muted">Assignment history</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {history.map((a) => {
              const historyCrew = crews.find((c) => c.id === a.crewId);
              return (
                <li key={a.id} className="flex items-center justify-between">
                  <span className="text-text-primary">{historyCrew?.name ?? a.crewId}</span>
                  <span className="flex items-center gap-2 text-text-faint">
                    <StatusBadge status={a.status} />
                    {new Date(a.assignedAt).toLocaleString()}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <p className="mt-8 text-xs text-text-faint">
        Every assignment made here, and every replan after a blockage, is recorded in the{" "}
        <Link href="/decisions" className="underline hover:text-text-muted">
          Decision Log
        </Link>
        .
      </p>
    </main>
  );
}
