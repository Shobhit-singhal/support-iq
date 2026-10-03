"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { listNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/api";
import type { Notification } from "@/lib/types";

const POLL_MS = 30_000;

export default function NotificationBell() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await listNotifications(20);
      setItems(data.notifications);
      setUnread(data.unreadCount);
    } catch {}
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next) await refresh();
  }

  async function handleItemClick(n: Notification) {
    setOpen(false);
    if (!n.read) {
      setUnread((u) => Math.max(0, u - 1));
      setItems((prev) => prev.map((i) => (i._id === n._id ? { ...i, read: true } : i)));
      try { await markNotificationRead(n._id); } catch {}
    }
    if (n.link) router.push(n.link);
  }

  async function handleMarkAll() {
    setUnread(0);
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    try { await markAllNotificationsRead(); } catch { refresh(); }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button onClick={handleOpen} aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        className="relative flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-100">
        <span aria-hidden className="text-lg leading-none">🔔</span>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white shadow-sm">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-md border border-slate-800 bg-slate-900 shadow-2xl shadow-black/50 text-slate-200">
          <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
            <span className="text-sm font-semibold text-slate-200">Notifications</span>
            {unread > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-slate-500 hover:text-slate-200">Mark all read</button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-500">No notifications yet.</p>
            ) : (
              items.map((n) => (
                <button key={n._id} onClick={() => handleItemClick(n)}
                  className={`block w-full border-b border-slate-800/50 px-3 py-2 text-left text-sm last:border-0 ${
                    n.read ? "text-slate-400 hover:bg-slate-800/50" : "bg-slate-800/40 font-medium text-slate-200 hover:bg-slate-800 border-l-2 border-l-indigo-500"
                  }`}>
                  <span className="block">{n.message}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{new Date(n.createdAt).toLocaleString()}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
