import Link from "next/link";

// Static walkthrough of the ten-step demo scenario, linking each step into
// the real screens using WO-1048, the Western Sydney transformer failure.

const STEPS: { title: string; detail: string; href: string; linkLabel: string; isPriority?: boolean }[] = [
  {
    title: "1. Weather crosses a severity threshold",
    detail:
      "Open-Meteo is queried live for the Western Sydney Substation. When wind or rain crosses the watch or severe thresholds, the work order's weather panel flags it.",
    href: "/work-orders/wo-1048",
    linkLabel: "View live weather for WO-1048",
  },
  {
    title: "2. Assets get flagged high-risk",
    detail: "Transformer T-104 is seeded as high criticality, critical condition, the asset behind WO-1048.",
    href: "/work-orders/wo-1048",
    linkLabel: "View asset detail",
  },
  {
    title: "3. Work orders are generated",
    detail: "WO-1048 (critical) sits at the top of the Command Centre's priority queue alongside the other open orders.",
    href: "/",
    linkLabel: "Open Command Centre",
  },
  {
    title: "4. Available crews are identified",
    detail: "Crew 07 and Crew 12 are both within range; off-shift crews are excluded from the pool entirely.",
    href: "/work-orders/wo-1048",
    linkLabel: "View nearby crews",
  },
  {
    title: "5. The platform recommends an assignment with reasoning shown",
    detail: "The scoring engine ranks every crew: priority weight, capability match, proximity, workload penalty, all visible.",
    href: "/work-orders/wo-1048/plan",
    linkLabel: "Open Resource and Response Planning",
  },
  {
    title: "6. The manager reviews recommended vs. alternative",
    detail: "Crew 07 (certified, further) is weighed against Crew 12 (closer, not certified), same shape as the comparison on the planning screen.",
    href: "/work-orders/wo-1048/plan",
    linkLabel: "Compare candidates",
  },
  {
    title: "7. The manager approves",
    detail: "Confirming the assignment logs a decision, work order, crew, reasoning, decision maker, timestamp, and never happens automatically.",
    href: "/work-orders/wo-1048/plan",
    linkLabel: "Confirm an assignment",
  },
  {
    title: "8. The crew moves into execution",
    detail: "Status moves Assigned → In Progress from the execution screen once the crew is on site.",
    href: "/work-orders/wo-1048/execute",
    linkLabel: "Open execution view",
  },
  {
    title: "9. The crew reports a blockage",
    detail: "A reason is required: missing equipment, weather, access issue, or needs a specialist. No blockage is logged without one.",
    href: "/work-orders/wo-1048/execute",
    linkLabel: "Report a blockage",
  },
  {
    title: "10. The platform recalculates the plan",
    detail:
      "The scoring engine re-runs immediately, excluding the blocked crew, and shows a fresh recommended and alternative pair.",
    href: "/work-orders/wo-1048/execute",
    linkLabel: "Watch the recalculation",
    isPriority: true,
  },
];

export default function DemoWalkthrough() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 sm:px-10">
      <Link href="/" className="text-xs font-mono uppercase tracking-widest text-text-faint hover:text-text-muted">
        ← Command Centre
      </Link>

      <header className="mt-4 mb-8 border-b border-border pb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-text-faint">Demo scenario</p>
        <h1 className="mt-1 text-2xl font-semibold text-text-primary">Western Sydney Infrastructure Response</h1>
        <p className="mt-2 text-sm text-text-muted">
          The ten-step scenario, walked through against the real screens using WO-1048.
        </p>
      </header>

      <ol className="flex flex-col gap-4">
        {STEPS.map((step) => (
          <li
            key={step.title}
            className={`rounded-md border p-4 ${step.isPriority ? "border-status-critical bg-status-critical-dim" : "border-border bg-surface"}`}
          >
            <h2 className={`font-medium ${step.isPriority ? "text-status-critical" : "text-text-primary"}`}>{step.title}</h2>
            <p className="mt-1 text-sm text-text-muted">{step.detail}</p>
            <Link href={step.href} className="mt-2 inline-block text-sm text-status-medium hover:underline">
              {step.linkLabel} →
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
