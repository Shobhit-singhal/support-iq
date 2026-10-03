"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { getTicket, updateTicket, listAgents, ApiError } from "@/lib/api";
import type { Ticket, TicketStatus, Agent } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import SlaBadge from "@/components/SlaBadge";
import CsatForm from "@/components/CsatForm";
import TicketComments from "@/components/TicketComments";

const STATUSES: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];

function personLabel(value: Ticket["assignedAgentId"] | Ticket["customerId"]) {
  if (!value) return "Unassigned";
  if (typeof value === "string") return value;
  return value.name || value.email || value._id;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const ticketId = params.id;
  const { user, loading: authLoading } = useRequireAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState<TicketStatus | "">("");
  const [assigneeDraft, setAssigneeDraft] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [csatDone, setCsatDone] = useState(false);

  const load = useCallback(() => {
    if (!ticketId) return;
    setLoading(true);
    setError(null);
    getTicket(ticketId)
      .then((data) => {
        setTicket(data);
        setStatusDraft(data.status);
        setAssigneeDraft(typeof data.assignedAgentId === "string" ? data.assignedAgentId : data.assignedAgentId?._id ?? "");
      })
      .catch((err) => { setError(err instanceof ApiError ? err.message : "Failed to load ticket."); })
      .finally(() => setLoading(false));
  }, [ticketId]);

  useEffect(() => {
    if (authLoading || !user) return;
    load();
  }, [authLoading, user, load]);

  useEffect(() => {
    if (authLoading || !user) return;
    if (user.role !== "agent" && user.role !== "admin") return;
    listAgents().then(setAgents).catch(() => setAgents([]));
  }, [authLoading, user]);

  async function handleSave() {
    if (!ticket) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updates: { status?: TicketStatus; assignedAgentId?: string } = {};
      if (statusDraft && statusDraft !== ticket.status) updates.status = statusDraft;
      const currentAssignee = typeof ticket.assignedAgentId === "string" ? ticket.assignedAgentId : ticket.assignedAgentId?._id ?? "";
      if (assigneeDraft !== currentAssignee) { updates.assignedAgentId = assigneeDraft; }
      if (Object.keys(updates).length === 0) return;
      const updated = await updateTicket(ticket._id, updates);
      setTicket(updated);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Failed to update ticket.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || !user) return null;
  if (loading) return <p className="text-sm text-slate-500">Loading ticket…</p>;
  if (error) { return <p className="rounded-lg border border-rose-800/50 bg-rose-950/40 px-3 py-2 text-sm text-rose-300">{error}</p>; }
  if (!ticket) return null;

  const canManage = user.role === "agent" || user.role === "admin";
  const isOwner = user.role === "customer" && (typeof ticket.customerId === "string" ? ticket.customerId : ticket.customerId._id) === user._id;
  const eligibleForCsat = ["resolved", "closed"].includes(ticket.status);
  const showCsatForm = isOwner && eligibleForCsat && !ticket.csat && !csatDone;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">{ticket.subject}</h1>
        <p className="mt-1 text-sm text-slate-500">Created {formatDate(ticket.createdAt)}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <PriorityBadge priority={ticket.priority} />
        <StatusBadge status={ticket.status} />
        <SlaBadge status={ticket.slaStatus} />
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="mb-2 text-sm font-semibold text-slate-300">Description</h2>
        <p className="whitespace-pre-wrap text-sm text-slate-300">{ticket.description}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-5 text-sm sm:grid-cols-3">
        <div><dt className="text-slate-500">Category</dt><dd className="font-medium text-slate-200">{ticket.category || "—"}</dd></div>
        <div><dt className="text-slate-500">Sentiment</dt><dd className="font-medium text-slate-200">{ticket.sentiment || "—"}</dd></div>
        <div><dt className="text-slate-500">Assigned Agent</dt><dd className="font-medium text-slate-200">{personLabel(ticket.assignedAgentId)}</dd></div>
        <div><dt className="text-slate-500">First Response Due</dt><dd className="font-medium text-slate-200">{formatDate(ticket.firstResponseDueAt)}</dd></div>
        <div><dt className="text-slate-500">Resolution Due</dt><dd className="font-medium text-slate-200">{formatDate(ticket.resolutionDueAt)}</dd></div>
        <div><dt className="text-slate-500">Resolved At</dt><dd className="font-medium text-slate-200">{formatDate(ticket.resolvedAt)}</dd></div>
      </div>
      {canManage && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-300">Manage Ticket</h2>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Status</label>
              <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value as TicketStatus)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200">
                {STATUSES.map((s) => (<option key={s} value={s}>{s.replace("_", " ")}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Assigned Agent</label>
              <select value={assigneeDraft} onChange={(e) => setAssigneeDraft(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200">
                <option value="">Unassigned</option>
                {agents.map((agent) => (<option key={agent._id} value={agent._id}>{agent.name} ({agent.email})</option>))}
              </select>
            </div>
            <button onClick={handleSave} disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
          {saveError && <p className="mt-2 text-sm text-rose-400">{saveError}</p>}
        </div>
      )}
      <TicketComments ticketId={ticket._id} canPostInternal={canManage} />
      {showCsatForm && (<CsatForm ticketId={ticket._id} onSubmitted={() => setCsatDone(true)} />)}
      {isOwner && eligibleForCsat && (ticket.csat || csatDone) && (
        <p className="rounded-lg border border-emerald-800/50 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">Thanks for your feedback!</p>
      )}
    </div>
  );
}
