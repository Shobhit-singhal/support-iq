"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { getSlaAnalytics, ApiError } from "@/lib/api";
import type { SlaAnalytics } from "@/lib/types";
import SlaBreachChart from "@/components/charts/SlaBreachChart";
import SlaBreakdownChart from "@/components/charts/SlaBreakdownChart";

export default function SlaDashboardPage() {
  const { user, loading: authLoading } = useRequireAuth(["admin"]);
  const [data, setData] = useState<SlaAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    getSlaAnalytics()
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load analytics."))
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  if (authLoading || !user) return null;
  const total = data ? data.onTrack + data.atRisk + data.breached : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white">SLA Compliance</h1>
      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {error && (<p className="rounded-lg bg-rose-950/40 border border-rose-800/50 px-3 py-2 text-sm text-rose-300">{error}</p>)}
      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
              <p className="text-xs font-medium text-slate-500">On Track</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-400">{data.onTrack}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
              <p className="text-xs font-medium text-slate-500">At Risk</p>
              <p className="mt-1 text-2xl font-semibold text-amber-400">{data.atRisk}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
              <p className="text-xs font-medium text-slate-500">Breached</p>
              <p className="mt-1 text-2xl font-semibold text-rose-400">{data.breached}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-300">Breach Rate Over Time</h2>
              <SlaBreachChart data={data.breachRateOverTime} />
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-300">Current Breakdown{total > 0 ? ` (${total} tickets)` : ""}</h2>
              <SlaBreakdownChart onTrack={data.onTrack} atRisk={data.atRisk} breached={data.breached} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
