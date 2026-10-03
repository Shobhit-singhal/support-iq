"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { getCsatAnalytics, ApiError } from "@/lib/api";
import type { CsatAnalytics } from "@/lib/types";
import CsatTrendChart from "@/components/charts/CsatTrendChart";
import CsatBreakdownChart from "@/components/charts/CsatBreakdownChart";

export default function CsatDashboardPage() {
  const { user, loading: authLoading } = useRequireAuth(["admin"]);
  const [data, setData] = useState<CsatAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    getCsatAnalytics()
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load analytics."))
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  if (authLoading || !user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white">CSAT Analytics</h1>
      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {error && (<p className="rounded-lg bg-rose-950/40 border border-rose-800/50 px-3 py-2 text-sm text-rose-300">{error}</p>)}
      {!loading && !error && data && (
        <>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-300">CSAT Trend</h2>
            <CsatTrendChart data={data.trend} />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-300">By Category</h2>
              <CsatBreakdownChart data={data.byCategory.map((c) => ({ label: c.category, avgRating: c.avgRating }))} color="#38bdf8" />
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-300">By Agent</h2>
              <CsatBreakdownChart data={data.byAgent.map((a) => ({ label: a.name, avgRating: a.avgRating }))} color="#a78bfa" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
