"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, clearSession } from "@/lib/auth";
import { logoutRequest } from "@/lib/api";
import NotificationBell from "./NotificationBell";

export default function NavBar() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (loading) {
    return <aside className="w-64 shrink-0" />;
  }

  const isPublicPage = pathname === "/" || pathname === "/login" || pathname === "/register";
  if (isPublicPage) {
    return null;
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
  
  const navItemClass = (path: string) => {
    const isActive = path === "/tickets" ? pathname === "/tickets" : pathname.startsWith(path);
    return `flex w-full items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive 
        ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20" 
        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent"
    }`;
  };

  return (
    <aside className="sticky top-0 h-screen w-64 shrink-0 flex flex-col border-r border-slate-800/60 bg-slate-900/40 backdrop-blur-3xl p-4">
      <Link href={user ? "/tickets" : "/"} className="flex items-center gap-3 px-2 mb-8 mt-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/20">
          <span className="text-xl font-bold text-white">S</span>
        </div>
        <span className="text-xl font-bold text-white tracking-tight">
          SupportIQ
        </span>
      </Link>

      {user ? (
        <div className="flex flex-col flex-1">
          <div className="space-y-1.5 flex-1">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-3 mt-4">
              Dashboard
            </div>
            <Link href="/tickets" className={navItemClass("/tickets")}>Tickets</Link>
            {(user.role === "agent" || user.role === "customer") && (
              <Link href="/tickets/new" className={navItemClass("/tickets/new")}>+ New Ticket</Link>
            )}
            
            {user.role === "admin" && (
              <>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-3 mt-8">
                  Admin
                </div>
                <Link href="/dashboard/agents" className={navItemClass("/dashboard/agents")}>Overview</Link>
                <Link href="/dashboard/analytics" className={navItemClass("/dashboard/analytics")}>Analytics</Link>
                <Link href="/dashboard/users" className={navItemClass("/dashboard/users")}>Users</Link>
                <Link href="/dashboard/sla" className={navItemClass("/dashboard/sla")}>SLA</Link>
                <Link href="/dashboard/csat" className={navItemClass("/dashboard/csat")}>CSAT</Link>
              </>
            )}
          </div>
          
          <div className="mt-auto border-t border-slate-800/60 pt-4">
            <div className="flex items-center justify-between px-2 mb-4">
              <span className="text-sm font-medium text-slate-400">Notifications</span>
              <NotificationBell />
            </div>
            
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3 mb-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-medium text-slate-200">{user.name}</span>
                <span className="truncate text-xs text-slate-500 capitalize">{user.role}</span>
              </div>
            </div>
            
            <button 
              onClick={handleLogout} 
              className="w-full rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-500/20 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mt-4">
          <Link href="/login" className="flex w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors">Log in</Link>
          <Link href="/register" className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">Sign up</Link>
        </div>
      )}
    </aside>
  );
}
