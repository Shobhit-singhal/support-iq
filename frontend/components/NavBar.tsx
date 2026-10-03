"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, clearSession } from "@/lib/auth";
import { logoutRequest } from "@/lib/api";
import NotificationBell from "./NotificationBell";

export default function NavBar() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <nav className="border-b border-slate-800/80 bg-slate-900/80 h-14" />;
  }

  async function handleLogout() {
    try {
      await logoutRequest();
    } catch {
      // ignore
    }
    clearSession();
    router.push("/login");
  }

  return (
    <nav className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
      <div className="flex w-full items-center justify-between px-8 py-3 max-w-[1400px] mx-auto">
        <Link href="/" className="text-lg font-bold text-white tracking-tight">
          SupportIQ
        </Link>
        {user && (
          <div className="flex items-center gap-4 text-sm">
            <Link href="/tickets" className="text-slate-400 hover:text-slate-100 transition-colors">Tickets</Link>
            {(user.role === "agent" || user.role === "customer") && (
              <Link href="/tickets/new" className="text-slate-400 hover:text-slate-100 transition-colors">New Ticket</Link>
            )}
            {user.role === "admin" && (
              <>
                <Link href="/dashboard/users" className="text-slate-400 hover:text-slate-100 transition-colors">Users</Link>
                <Link href="/dashboard/agents" className="text-slate-400 hover:text-slate-100 transition-colors">Agents</Link>
                <Link href="/dashboard/sla" className="text-slate-400 hover:text-slate-100 transition-colors">SLA</Link>
                <Link href="/dashboard/csat" className="text-slate-400 hover:text-slate-100 transition-colors">CSAT</Link>
              </>
            )}
            <NotificationBell />
            <span className="hidden text-slate-700 sm:inline">|</span>
            <Link href="/account" className="hidden text-slate-400 hover:text-slate-100 sm:inline transition-colors">
              {user.name} <span className="text-slate-600">({user.role})</span>
            </Link>
            <button onClick={handleLogout} className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">Logout</button>
          </div>
        )}
        {!user && (
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-slate-400 hover:text-white transition-colors">Login</Link>
            <Link href="/register" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-500 transition-colors">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
