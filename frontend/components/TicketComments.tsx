"use client";

import { useCallback, useEffect, useState } from "react";
import { listComments, addComment, ApiError } from "@/lib/api";
import type { Comment, Role } from "@/lib/types";

function authorLabel(author: Comment["authorId"]) {
  if (typeof author === "string") return author;
  return author.name || author.email;
}

function authorRole(author: Comment["authorId"]): Role | null {
  if (typeof author === "string") return null;
  return author.role;
}

export default function TicketComments({ ticketId, canPostInternal }: { ticketId: string; canPostInternal: boolean; }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    listComments(ticketId)
      .then(setComments)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load comments."))
      .finally(() => setLoading(false));
  }, [ticketId]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await addComment(ticketId, body.trim(), canPostInternal && internal);
      setComments((prev) => [...prev, created]);
      setBody("");
      setInternal(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-300">Conversation</h2>
      {loading ? (
        <p className="text-sm text-slate-500">Loading conversation…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-slate-500">No messages yet. Start the conversation below.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c._id} className={`rounded-lg border px-3 py-2 ${c.internal ? "border-amber-800/50 bg-amber-950/30" : "border-slate-800 bg-slate-900/80"}`}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-200">
                  {authorLabel(c.authorId)}
                  {authorRole(c.authorId) && (<span className="ml-1 text-xs font-normal text-slate-500">({authorRole(c.authorId)})</span>)}
                  {c.internal && (<span className="ml-2 rounded border border-amber-700/60 bg-amber-900/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">Internal</span>)}
                </span>
                <span className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleString()}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-slate-300">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleSubmit} className="mt-4 space-y-2">
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a reply…" rows={3}
          className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <div className="flex items-center justify-between">
          {canPostInternal ? (
            <label className="flex items-center gap-2 text-sm text-slate-400">
              <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} className="rounded border-slate-700 bg-slate-950/70" />
              Internal note (hidden from customer)
            </label>
          ) : (<span />)}
          <button type="submit" disabled={submitting || !body.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
            {submitting ? "Posting…" : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
