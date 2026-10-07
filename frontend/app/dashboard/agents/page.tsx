"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { getAgentAnalytics, getSlaAnalytics, listTickets, ApiError } from "@/lib/api";
import type { AgentAnalytics, SlaAnalytics } from "@/lib/types";

function formatMs(ms: number) {
  const minutes = ms / 60000;
  if (minutes < 60) return `${minutes.toFixed(0)} min`;
  return `${(minutes / 60).toFixed(1)} hr`;
}

export default function AgentDashboardPage() {
  const { user, loading: authLoading } = useRequireAuth(["admin"]);
  const [data, setData] = useState<AgentAnalytics[]>([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [slaData, setSlaData] = useState<SlaAnalytics | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    
    Promise.all([
      getAgentAnalytics(),
      getSlaAnalytics(),
      listTickets({ limit: 1 })
    ])
      .then(([agentData, sla, ticketsResponse]) => {
        setData(agentData);
        setSlaData(sla);
        setTotalTickets(ticketsResponse.total);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load analytics."))
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  if (authLoading || !user) return null;

  const totalResolved = data.reduce((acc, curr) => acc + curr.ticketsResolved, 0);
  const overallCsat = data.length > 0 ? (data.reduce((acc, curr) => acc + curr.avgCsat, 0) / data.length).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white">System Dashboard</h1>
      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {error && (<p className="rounded-lg bg-rose-950/40 border border-rose-800/50 px-3 py-2 text-sm text-rose-300">{error}</p>)}
      {!loading && !error && (
        <>
          {/* Top Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col justify-center">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Tickets</span>
              <span className="text-3xl font-bold text-slate-100">{totalTickets}</span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col justify-center">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Resolved</span>
              <span className="text-3xl font-bold text-emerald-400">{totalResolved}</span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col justify-center">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">SLA Breached</span>
              <span className="text-3xl font-bold text-rose-400">{slaData?.breached || 0}</span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col justify-center">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Avg CSAT</span>
              <span className="text-3xl font-bold text-indigo-400">{overallCsat} <span className="text-lg text-slate-500 font-normal">/ 5.0</span></span>
            </div>
          </div>

          {/* Expandable Summary */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden transition-all duration-300">
            <button 
              onClick={() => setSummaryExpanded(!summaryExpanded)}
              className="w-full flex items-center justify-between p-5 bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
            >
              <h2 className="text-sm font-semibold text-slate-300">Detailed Agent Summary</h2>
              <span className="text-slate-500 text-2xl leading-none font-light">{summaryExpanded ? "−" : "+"}</span>
            </button>
            
            {summaryExpanded && (
              <div className="overflow-x-auto border-t border-slate-800 p-1 animate-in fade-in duration-300">
                <table className="min-w-full divide-y divide-slate-800/60 text-sm">
                  <thead className="bg-slate-900/40">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Agent</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Resolved</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Avg Response</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Avg Resolution</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">SLA Compliance</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Avg CSAT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-transparent">
                    {[...data].sort((a, b) => b.ticketsResolved - a.ticketsResolved).map((agent) => (
                      <tr key={agent.agentId} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-100">{agent.name}</td>
                        <td className="px-4 py-3 text-right text-slate-300">{agent.ticketsResolved}</td>
                        <td className="px-4 py-3 text-right text-slate-300">{formatMs(agent.avgResponseTimeMs)}</td>
                        <td className="px-4 py-3 text-right text-slate-300">{formatMs(agent.avgResolutionTimeMs)}</td>
                        <td className="px-4 py-3 text-right text-slate-300">
                          <span className={agent.slaCompliancePct < 90 ? "text-amber-400" : "text-emerald-400"}>
                            {agent.slaCompliancePct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300">{agent.avgCsat.toFixed(1)}</td>
                      </tr>
                    ))}
                    {data.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No agent data available.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
