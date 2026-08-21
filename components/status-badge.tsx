import { AssignmentStatus, WorkOrderStatus } from "@/lib/types";

type Status = WorkOrderStatus | AssignmentStatus;

const STYLES: Record<Status, { label: string; text: string; bg: string }> = {
  open: { label: "Open", text: "text-status-critical", bg: "bg-status-critical-dim" },
  assigned: { label: "Assigned", text: "text-status-medium", bg: "bg-status-medium-dim" },
  in_progress: { label: "In Progress", text: "text-status-good", bg: "bg-surface-raised" },
  blocked: { label: "Blocked", text: "text-status-high", bg: "bg-status-high-dim" },
  complete: { label: "Complete", text: "text-status-good", bg: "bg-surface-raised" },
};

export function StatusBadge({ status }: { status: Status }) {
  const style = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${style.text} ${style.bg}`}
    >
      {style.label}
    </span>
  );
}
