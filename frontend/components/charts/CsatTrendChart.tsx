"use client";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CsatAnalytics } from "@/lib/types";

export default function CsatTrendChart({ data }: { data: CsatAnalytics["trend"] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 12 }} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} domain={[0, 5]} />
        <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.5rem", color: "#f8fafc", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)" }} itemStyle={{ color: "#e2e8f0" }} />
        <Line type="monotone" dataKey="avgRating" name="Avg CSAT" stroke="#818cf8" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
