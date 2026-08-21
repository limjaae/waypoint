import Link from "next/link";
import { PriorityBadge, priorityBarClass } from "@/components/priority-badge";
import { buildPriorityQueue } from "@/lib/priority-queue";

export const dynamic = "force-dynamic";

export default async function CommandCentre() {
  const queue = await buildPriorityQueue();
  const criticalCount = queue.filter((q) => q.workOrder.priority === "critical").length;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12 sm:px-10">
      <header className="mb-10 flex items-baseline justify-between border-b border-border pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-text-faint">Command Centre</p>
          <h1 className="mt-1 text-2xl font-semibold text-text-primary">
            Western Sydney Region
          </h1>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-semibold text-status-critical">{criticalCount}</p>
          <p className="text-xs text-text-muted">critical, unassigned</p>
          <div className="mt-2 flex gap-3 text-xs">
            <Link href="/decisions" className="text-text-faint underline hover:text-text-muted">
              Decision Log
            </Link>
            <Link href="/demo" className="text-text-faint underline hover:text-text-muted">
              Demo walkthrough
            </Link>
          </div>
        </div>
      </header>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-text-muted">Priority queue</h2>
        <p className="font-mono text-xs text-text-faint">{queue.length} open work orders</p>
      </div>

      <ol className="flex flex-col gap-3">
        {queue.map(({ workOrder, assetName, locationName, topCrewName, topCrewDistanceKm, restorationEstimateHours }) => (
          <li
            key={workOrder.id}
            className="flex items-stretch overflow-hidden rounded-md border border-border bg-surface"
          >
            <div className={`w-1.5 ${priorityBarClass(workOrder.priority)}`} />
            <div className="flex flex-1 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <PriorityBadge priority={workOrder.priority} />
                  <span className="font-mono text-xs text-text-faint">{workOrder.id.toUpperCase()}</span>
                </div>
                <p className="font-medium text-text-primary">{workOrder.issueType}</p>
                <p className="text-sm text-text-muted">
                  {assetName} · {locationName}
                </p>
              </div>

              <div className="flex flex-col items-start gap-1 text-sm sm:items-end">
                <p className="text-text-muted">
                  Required: <span className="text-text-primary">{workOrder.requiredCapability.replace(/_/g, " ")}</span>
                </p>
                {topCrewName ? (
                  <p className="text-text-muted">
                    Nearest qualified: <span className="text-text-primary">{topCrewName}</span>
                    {topCrewDistanceKm !== null ? ` · ${topCrewDistanceKm}km` : ""}
                  </p>
                ) : (
                  <p className="text-status-critical">No available crew found</p>
                )}
                <p className="text-text-faint">Est. restoration: {restorationEstimateHours}hrs</p>
              </div>

              <Link
                href={`/work-orders/${workOrder.id}`}
                className="self-start rounded border border-border bg-surface-raised px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-status-medium hover:text-status-medium active:scale-[0.97] motion-reduce:active:scale-100 sm:self-center"
              >
                Plan response
              </Link>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-10 text-xs text-text-faint">
        Asset, work order and crew data shown here is synthetic reference data for demonstration.
        Weather conditions used to trigger this scenario are pulled live from Open-Meteo.
      </p>
    </main>
  );
}
