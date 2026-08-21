import Link from "next/link";
import { notFound } from "next/navigation";
import { PriorityBadge } from "@/components/priority-badge";
import { PlanForm } from "@/components/plan-form";
import { describeCandidate, getRankingForWorkOrder } from "@/lib/planning";
import { getAssignmentForWorkOrder } from "@/lib/store";
import { confirmAssignment } from "./actions";

export const dynamic = "force-dynamic";

export default async function PlanResponse({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ranking = getRankingForWorkOrder(id);
  if (!ranking) notFound();

  const existingAssignment = getAssignmentForWorkOrder(id);
  const { workOrder, ranked } = ranking;

  const topTwo = ranked.slice(0, 2);
  const candidates = topTwo.map((breakdown, index) => ({
    breakdown,
    label: (index === 0 ? "Recommended" : "Alternative") as "Recommended" | "Alternative",
    autoReasoning: describeCandidate(breakdown, workOrder.requiredCapability),
  }));

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12 sm:px-10">
      <Link href={`/work-orders/${id}`} className="text-xs font-mono uppercase tracking-widest text-text-faint hover:text-text-muted">
        ← {workOrder.id.toUpperCase()}
      </Link>

      <header className="mt-4 mb-8 border-b border-border pb-6">
        <div className="mb-2 flex items-center gap-2">
          <PriorityBadge priority={workOrder.priority} />
          <span className="font-mono text-xs text-text-faint">Resource and Response Planning</span>
        </div>
        <h1 className="text-2xl font-semibold text-text-primary">{workOrder.issueType}</h1>
        <p className="mt-1 text-sm text-text-muted">
          Assignment Score = Priority Weight + Capability Match + Proximity − Workload Penalty
        </p>
      </header>

      {existingAssignment && (
        <p className="mb-6 rounded-md border border-status-high bg-status-high-dim px-4 py-3 text-sm text-status-high">
          This work order already has an active assignment. Confirming a new one below records a replan.
        </p>
      )}

      {candidates.length === 0 ? (
        <p className="text-status-critical">No candidate crews available for this work order.</p>
      ) : (
        <PlanForm workOrderId={workOrder.id} candidates={candidates} action={confirmAssignment} />
      )}
    </main>
  );
}
