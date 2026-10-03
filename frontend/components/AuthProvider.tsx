"use client";

import { useEffect, useState } from "react";
import { AuthContext, getUser } from "@/lib/auth";
import type { User } from "@/lib/types";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reads localStorage (unavailable during SSR), so the initial sync must
    // happen client-side in an effect rather than in useState's initializer.
    const sync = () => setUser(getUser());
    sync();
    // One-time mount flag flip, needed since the sync above only resolves
    // after this effect runs client-side.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(false);
    // storage event covers cross-tab logout; custom event covers same-tab changes
    window.addEventListener("storage", sync);
    window.addEventListener("ticketflow-auth-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("ticketflow-auth-change", sync);
    };
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}
