"use client";

import { useState } from "react";
import { submitCsat, ApiError } from "@/lib/api";

export default function CsatForm({ ticketId, onSubmitted }: { ticketId: string; onSubmitted: () => void; }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating < 1 || rating > 5) { setError("Please select a rating between 1 and 5."); return; }
    setSubmitting(true);
    try {
      await submitCsat(ticketId, rating, comment.trim() || undefined);
      onSubmitted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-5">
      <h3 className="text-sm font-semibold text-slate-200">How was your support experience?</h3>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className={`text-2xl leading-none ${n <= rating ? "text-amber-400" : "text-slate-600"}`}>★</button>
        ))}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional comment" rows={3}
        className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <button type="submit" disabled={submitting}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
        {submitting ? "Submitting…" : "Submit Feedback"}
      </button>
    </form>
  );
}
