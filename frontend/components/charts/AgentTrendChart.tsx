"use client";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AgentAnalytics } from "@/lib/types";

export default function AgentTrendChart({ data }: { data: AgentAnalytics[] }) {
  const chartData = data.map((d) => ({
    name: d.name,
    "Tickets Resolved": d.ticketsResolved,
    "SLA Compliance %": Number(d.slaCompliancePct?.toFixed?.(1) ?? d.slaCompliancePct),
  }));
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
        <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.5rem", color: "#f8fafc", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)" }} itemStyle={{ color: "#e2e8f0" }} />
        <Legend wrapperStyle={{ color: "#94a3b8" }} />
        <Bar dataKey="Tickets Resolved" fill="#38bdf8" radius={[4, 4, 0, 0]} />
        <Bar dataKey="SLA Compliance %" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
