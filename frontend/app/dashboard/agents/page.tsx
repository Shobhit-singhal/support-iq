"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { getAgentAnalytics, ApiError } from "@/lib/api";
import type { AgentAnalytics } from "@/lib/types";
import AgentTrendChart from "@/components/charts/AgentTrendChart";

function formatMs(ms: number) {
  const minutes = ms / 60000;
  if (minutes < 60) return `${minutes.toFixed(0)} min`;
  return `${(minutes / 60).toFixed(1)} hr`;
}

export default function AgentDashboardPage() {
  const { user, loading: authLoading } = useRequireAuth(["admin"]);
  const [data, setData] = useState<AgentAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    getAgentAnalytics()
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load analytics."))
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  if (authLoading || !user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white">Agent Performance</h1>
      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {error && (<p className="rounded-lg bg-rose-950/40 border border-rose-800/50 px-3 py-2 text-sm text-rose-300">{error}</p>)}
      {!loading && !error && (
        <>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-300">Resolved Volume vs. SLA Compliance</h2>
            <AgentTrendChart data={data} />
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
            <table className="min-w-full divide-y divide-slate-800/60 text-sm">
              <thead className="bg-slate-900/90">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Agent</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Resolved</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Avg Response</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Avg Resolution</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">SLA Compliance</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Avg CSAT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {[...data].sort((a, b) => b.ticketsResolved - a.ticketsResolved).map((agent) => (
                  <tr key={agent.agentId}>
                    <td className="px-4 py-2 font-medium text-slate-100">{agent.name}</td>
                    <td className="px-4 py-2 text-right text-slate-300">{agent.ticketsResolved}</td>
                    <td className="px-4 py-2 text-right text-slate-300">{formatMs(agent.avgResponseTimeMs)}</td>
                    <td className="px-4 py-2 text-right text-slate-300">{formatMs(agent.avgResolutionTimeMs)}</td>
                    <td className="px-4 py-2 text-right text-slate-300">{agent.slaCompliancePct.toFixed(1)}%</td>
                    <td className="px-4 py-2 text-right text-slate-300">{agent.avgCsat.toFixed(1)}</td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No agent data available.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
