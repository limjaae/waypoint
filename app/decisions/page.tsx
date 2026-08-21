import Link from "next/link";
import { crews, workOrders } from "@/lib/seed-data";
import { getDecisions } from "@/lib/store";

// Durable record of every assignment: work order, crew, reasoning, decision
// maker, timestamp. Read-only by design, this is a log, not a workflow.
export const dynamic = "force-dynamic";

export default function DecisionLog() {
  const decisions = getDecisions();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12 sm:px-10">
      <Link href="/" className="text-xs font-mono uppercase tracking-widest text-text-faint hover:text-text-muted">
        ← Command Centre
      </Link>

      <header className="mt-4 mb-8 border-b border-border pb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-text-faint">Decision Log</p>
        <h1 className="mt-1 text-2xl font-semibold text-text-primary">Every assignment, and why</h1>
        <p className="mt-2 text-sm text-text-muted">
          One entry per assignment decision, including replans after a blockage. Nothing here is editable after the fact,
          a durable record only grows.
        </p>
      </header>

      {decisions.length === 0 ? (
        <p className="rounded-md border border-border bg-surface p-4 text-sm text-text-muted">
          No decisions logged yet. Confirm an assignment from a work order&apos;s{" "}
          <Link href="/" className="underline hover:text-text-primary">
            Command Centre
          </Link>{" "}
          to see one appear here.
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {decisions.map((decision) => {
            const workOrder = workOrders.find((wo) => wo.id === decision.workOrderId);
            const crew = crews.find((c) => c.id === decision.crewId);

            return (
              <li key={decision.id} className="rounded-md border border-border bg-surface p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/work-orders/${decision.workOrderId}`} className="font-medium text-text-primary hover:underline">
                    {workOrder?.issueType ?? decision.workOrderId}
                  </Link>
                  <span className="font-mono text-xs text-text-faint">{new Date(decision.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-text-muted">
                  Assigned <span className="text-text-primary">{crew?.name ?? decision.crewId}</span> · decided by{" "}
                  <span className="text-text-primary">{decision.decisionMaker}</span>
                  {decision.scoreBreakdown && (
                    <span className="text-text-faint"> · score {decision.scoreBreakdown.total}</span>
                  )}
                </p>
                <p className="mt-2 text-sm text-text-primary">{decision.reasoning}</p>
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}
