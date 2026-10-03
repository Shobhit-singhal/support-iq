import type { SlaStatus } from "@/lib/types";

const STYLES: Record<SlaStatus, string> = {
  on_track: "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60",
  at_risk: "bg-amber-950/60 text-amber-400 border border-amber-800/60",
  breached: "bg-rose-950/60 text-rose-400 border border-rose-800/60",
};

const LABELS: Record<SlaStatus, string> = {
  on_track: "On Track",
  at_risk: "At Risk",
  breached: "Breached",
};

export default function SlaBadge({ status }: { status: SlaStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
