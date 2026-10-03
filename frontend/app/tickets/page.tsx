"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { listTickets, ApiError } from "@/lib/api";
import type { Ticket, TicketPriority, TicketStatus } from "@/lib/types";
import TicketTable from "@/components/TicketTable";

const STATUSES: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];
const PRIORITIES: TicketPriority[] = ["Low", "Medium", "High", "Critical"];
const PAGE_SIZE = 20;

export default function TicketsPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [priority, setPriority] = useState<TicketPriority | "">("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setPage(1); }, [status, priority]);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    listTickets({ status: status || undefined, priority: priority || undefined, page, limit: PAGE_SIZE })
      .then((data) => { if (!cancelled) { setTickets(data.tickets); setTotal(data.total); } })
      .catch((err) => { if (!cancelled) { setError(err instanceof ApiError ? err.message : "Failed to load tickets."); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [authLoading, user, status, priority, page]);

  if (authLoading || !user) return null;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Tickets</h1>
          <p className="text-sm text-slate-400">{user.role === "customer" ? "Your submitted tickets." : "All tickets visible to your team."}</p>
        </div>
        {(user.role === "customer" || user.role === "agent") && (
          <Link href="/tickets/new" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">New Ticket</Link>
        )}
      </div>
      <div className="mb-4 flex flex-wrap gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value as TicketStatus | "")} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (<option key={s} value={s}>{s.replace("_", " ")}</option>))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority | "")} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200">
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (<option key={p} value={p}>{p}</option>))}
        </select>
      </div>
      {loading && <p className="text-sm text-slate-500">Loading tickets…</p>}
      {error && (<p className="mb-4 rounded-lg border border-rose-800/50 bg-rose-950/40 px-3 py-2 text-sm text-rose-300">{error}</p>)}
      {!loading && !error && (
        <>
          <TicketTable tickets={tickets} />
          {total > 0 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-slate-400">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800 disabled:opacity-40">Previous</button>
                <span className="text-slate-500">Page {page} of {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
