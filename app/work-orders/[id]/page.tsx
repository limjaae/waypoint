import Link from "next/link";
import { notFound } from "next/navigation";
import { PriorityBadge } from "@/components/priority-badge";
import { StatusBadge } from "@/components/status-badge";
import { WeatherPanel } from "@/components/weather-panel";
import { crews } from "@/lib/seed-data";
import { fetchWeatherForLocation } from "@/lib/weather";
import { buildWorkOrderContext } from "@/lib/work-order-context";

// No generateStaticParams on purpose: this page always renders per-request so
// the weather panel is genuinely live rather than baked in at build time.
export const dynamic = "force-dynamic";

export default async function WorkOrderWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = buildWorkOrderContext(id);
  if (!context) notFound();

  const { workOrder, status, asset, location, maintenanceHistory, nearbyCrews, relatedWorkOrders, currentAssignment } = context;
  const weather = await fetchWeatherForLocation(location);
  const assignedCrew = currentAssignment ? crews.find((c) => c.id === currentAssignment.crewId) : undefined;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12 sm:px-10">
      <Link href="/" className="text-xs font-mono uppercase tracking-widest text-text-faint hover:text-text-muted">
        ← Command Centre
      </Link>

      <header className="mt-4 mb-8 border-b border-border pb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <PriorityBadge priority={workOrder.priority} />
          <StatusBadge status={status} />
          <span className="font-mono text-xs text-text-faint">{workOrder.id.toUpperCase()}</span>
        </div>
        <h1 className="text-2xl font-semibold text-text-primary">{workOrder.issueType}</h1>
        <p className="mt-1 text-sm text-text-muted">
          {asset.name} · {location.name}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded-md border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-medium text-text-muted">Asset</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-text-faint">Name</dt>
            <dd className="text-text-primary">{asset.name}</dd>
            <dt className="text-text-faint">Type</dt>
            <dd className="text-text-primary">{asset.assetType.replace(/_/g, " ")}</dd>
            <dt className="text-text-faint">Criticality</dt>
            <dd className="text-text-primary capitalize">{asset.criticality}</dd>
            <dt className="text-text-faint">Condition</dt>
            <dd className="text-text-primary capitalize">{asset.condition}</dd>
            <dt className="text-text-faint">Required capability</dt>
            <dd className="text-text-primary">{workOrder.requiredCapability.replace(/_/g, " ")}</dd>
            <dt className="text-text-faint">Est. duration</dt>
            <dd className="text-text-primary">{workOrder.estimatedDurationHours}hrs</dd>
          </dl>
        </section>

        <WeatherPanel weather={weather} />

        <section className="rounded-md border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-medium text-text-muted">Asset history</h2>
          {maintenanceHistory.length === 0 ? (
            <p className="text-sm text-text-faint">No maintenance records on file.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {maintenanceHistory.map((record) => (
                <li key={record.id} className="text-sm">
                  <p className="text-text-primary">
                    {record.type} <span className="text-text-faint">· {record.date}</span>
                  </p>
                  <p className="text-text-muted">{record.notes}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-md border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-medium text-text-muted">Nearby crews</h2>
          {nearbyCrews.length === 0 ? (
            <p className="text-sm text-text-faint">No crews within range.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {nearbyCrews.map(({ crew, distanceKm, hasCertification }) => (
                <li key={crew.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-text-primary">{crew.name}</p>
                    <p className="text-text-faint">
                      {distanceKm}km · {crew.availability.replace(/_/g, " ")}
                    </p>
                  </div>
                  <span className={hasCertification ? "text-status-good" : "text-text-faint"}>
                    {hasCertification ? "Certified" : "Not certified"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {relatedWorkOrders.length > 0 && (
          <section className="rounded-md border border-border bg-surface p-4 md:col-span-2">
            <h2 className="mb-3 text-sm font-medium text-text-muted">Related work orders</h2>
            <ul className="flex flex-col gap-2">
              {relatedWorkOrders.map(({ workOrder: related, status: relatedStatus, relationship }) => (
                <li key={related.id}>
                  <Link
                    href={`/work-orders/${related.id}`}
                    className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-surface-raised"
                  >
                    <span className="text-text-primary">
                      {related.issueType} <span className="font-mono text-xs text-text-faint">{related.id.toUpperCase()}</span>
                    </span>
                    <span className="flex items-center gap-2 text-text-faint">
                      {relationship === "same_asset" ? "Same asset" : "Same location"}
                      <StatusBadge status={relatedStatus} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between rounded-md border border-border bg-surface-raised p-4">
        {currentAssignment ? (
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm text-text-muted">
                Assigned to <span className="text-text-primary">{assignedCrew?.name ?? currentAssignment.crewId}</span>
              </p>
              <StatusBadge status={currentAssignment.status} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-muted">No crew assigned yet.</p>
        )}

        <Link
          href={currentAssignment ? `/work-orders/${workOrder.id}/execute` : `/work-orders/${workOrder.id}/plan`}
          className="rounded border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-status-medium hover:text-status-medium active:scale-[0.97] motion-reduce:active:scale-100"
        >
          {currentAssignment ? "View execution" : "Plan response"}
        </Link>
      </div>
    </main>
  );
}
