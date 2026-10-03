import type { TicketStatus } from "@/lib/types";

const STYLES: Record<TicketStatus, string> = {
  open: "bg-blue-950/60 text-blue-400 border border-blue-800/60",
  in_progress: "bg-amber-950/60 text-amber-400 border border-amber-800/60",
  resolved: "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60",
  closed: "bg-slate-800 text-slate-400 border border-slate-700",
};

const LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export default function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
