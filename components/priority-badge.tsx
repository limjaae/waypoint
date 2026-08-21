import { Priority } from "@/lib/types";

const STYLES: Record<Priority, { label: string; text: string; bg: string; bar: string }> = {
  critical: { label: "Critical", text: "text-status-critical", bg: "bg-status-critical-dim", bar: "bg-status-critical" },
  high: { label: "High", text: "text-status-high", bg: "bg-status-high-dim", bar: "bg-status-high" },
  medium: { label: "Medium", text: "text-status-medium", bg: "bg-status-medium-dim", bar: "bg-status-medium" },
  low: { label: "Low", text: "text-text-muted", bg: "bg-surface-raised", bar: "bg-text-faint" },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const style = STYLES[priority];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${style.text} ${style.bg}`}
    >
      {style.label}
    </span>
  );
}

export function priorityBarClass(priority: Priority): string {
  return STYLES[priority].bar;
}
