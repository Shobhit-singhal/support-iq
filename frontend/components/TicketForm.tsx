"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTicket, ApiError } from "@/lib/api";

export default function TicketForm() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ subject?: string; description?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next: typeof errors = {};
    if (!subject.trim()) next.subject = "Subject is required.";
    else if (subject.trim().length < 5) next.subject = "Subject must be at least 5 characters.";
    if (!description.trim()) next.description = "Description is required.";
    else if (description.trim().length < 20) next.description = "Please provide at least 20 characters of detail.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const ticket = await createTicket(subject.trim(), description.trim());
      router.push(`/tickets/${ticket._id}`);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Failed to create ticket.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="subject" className="mb-1 block text-sm font-medium text-slate-300">Subject</label>
        <input id="subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Brief summary of the issue" />
        {errors.subject && <p className="mt-1 text-sm text-rose-400">{errors.subject}</p>}
      </div>
      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-300">Description</label>
        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={6}
          className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Describe the issue in detail..." />
        {errors.description && (<p className="mt-1 text-sm text-rose-400">{errors.description}</p>)}
      </div>
      {submitError && (<p className="rounded-lg border border-rose-800/50 bg-rose-950/40 px-3 py-2 text-sm text-rose-300">{submitError}</p>)}
      <button type="submit" disabled={submitting} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
        {submitting ? "Submitting…" : "Submit Ticket"}
      </button>
    </form>
  );
}
