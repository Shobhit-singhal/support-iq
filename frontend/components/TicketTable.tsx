"use client";

import { useRouter } from "next/navigation";
import type { Ticket } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import SlaBadge from "./SlaBadge";

export default function TicketTable({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();
  if (tickets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">No tickets found.</div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="min-w-full divide-y divide-slate-800 text-sm">
        <thead className="bg-slate-900/90">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Subject</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Category</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Priority</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">SLA</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
          {tickets.map((ticket) => (
            <tr key={ticket._id} onClick={() => router.push(`/tickets/${ticket._id}`)} className="cursor-pointer hover:bg-slate-800/50 transition-colors">
              <td className="px-4 py-3 font-medium text-slate-100">{ticket.subject}</td>
              <td className="px-4 py-3 text-slate-400">{ticket.category || "—"}</td>
              <td className="px-4 py-3"><PriorityBadge priority={ticket.priority} /></td>
              <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
              <td className="px-4 py-3"><SlaBadge status={ticket.slaStatus} /></td>
              <td className="px-4 py-3 text-slate-500">{new Date(ticket.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
