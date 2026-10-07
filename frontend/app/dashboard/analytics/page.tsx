"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { getAgentAnalytics, ApiError } from "@/lib/api";
import type { AgentAnalytics } from "@/lib/types";
import AgentTrendChart from "@/components/charts/AgentTrendChart";

export default function AnalyticsDashboardPage() {
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
      <h1 className="text-xl font-semibold text-white">Analytics</h1>
      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {error && (<p className="rounded-lg bg-rose-950/40 border border-rose-800/50 px-3 py-2 text-sm text-rose-300">{error}</p>)}
      {!loading && !error && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl">
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-100">Performance Overview</h2>
            <p className="text-sm text-slate-400">Comparing agent resolved volume vs SLA compliance percentage.</p>
          </div>
          <AgentTrendChart data={data} />
        </div>
      )}
    </div>
  );
}

