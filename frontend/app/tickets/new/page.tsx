"use client";

import { useRequireAuth } from "@/lib/useRequireAuth";
import TicketForm from "@/components/TicketForm";

export default function NewTicketPage() {
  const { user, loading } = useRequireAuth();
  if (loading || !user) return null;
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-xl font-semibold text-white">Submit a Ticket</h1>
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
        <TicketForm />
      </div>
    </div>
  );
}
