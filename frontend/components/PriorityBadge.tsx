import type { TicketPriority } from "@/lib/types";

const STYLES: Record<TicketPriority, string> = {
  Low: "bg-slate-800 text-slate-300 border border-slate-700",
  Medium: "bg-sky-950/60 text-sky-400 border border-sky-800/60",
  High: "bg-amber-950/60 text-amber-400 border border-amber-800/60",
  Critical: "bg-rose-950/60 text-rose-400 border border-rose-800/60",
};

export default function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[priority]}`}
    >
      {priority}
    </span>
  );
}
