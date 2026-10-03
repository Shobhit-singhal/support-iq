"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, dashboardPathForRole } from "@/lib/auth";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? dashboardPathForRole(user.role) : "/login");
  }, [user, loading, router]);

  return (
    <div className="flex h-40 items-center justify-center text-slate-400">
      Loading…
    </div>
  );
}
