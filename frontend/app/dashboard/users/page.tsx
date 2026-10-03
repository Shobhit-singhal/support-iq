"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { listUsers, listTeams, createUser, resetUserPassword, ApiError } from "@/lib/api";
import type { ManagedUser, Team } from "@/lib/types";

function teamName(teamId: ManagedUser["teamId"]) {
  if (!teamId) return "—";
  if (typeof teamId === "string") return teamId;
  return teamId.name;
}

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-violet-950/60 text-violet-400 border border-violet-800/60",
  agent: "bg-blue-950/60 text-blue-400 border border-blue-800/60",
  customer: "bg-slate-800 text-slate-400 border border-slate-700",
};

export default function UsersAdminPage() {
  const { user, loading: authLoading } = useRequireAuth(["admin"]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"agent" | "admin">("agent");
  const [teamId, setTeamId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resetFor, setResetFor] = useState<ManagedUser | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  function loadUsers() {
    setLoading(true);
    listUsers()
      .then(setUsers)
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Failed to load users."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (authLoading || !user) return;
    loadUsers();
    listTeams().then(setTeams).catch(() => setTeams([]));
  }, [authLoading, user]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);
    if (!name.trim() || !email.trim() || !password) { setFormError("Name, email, and password are required."); return; }
    if (password.length < 6) { setFormError("Password must be at least 6 characters."); return; }
    setSubmitting(true);
    try {
      const created = await createUser({ name: name.trim(), email: email.trim(), password, role, teamId: role === "agent" && teamId ? teamId : undefined });
      setSuccess(`Created ${created.role} "${created.name}". Share these credentials — email: ${created.email}, password: ${password}`);
      setName(""); setEmail(""); setPassword(""); setTeamId(""); setRole("agent");
      loadUsers();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  }

  function openReset(target: ManagedUser) {
    setResetFor(target); setResetPassword(""); setResetError(null); setResetSuccess(null);
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetFor) return;
    setResetError(null); setResetSuccess(null);
    if (resetPassword.length < 6) { setResetError("Password must be at least 6 characters."); return; }
    setResetting(true);
    try {
      await resetUserPassword(resetFor._id, resetPassword);
      setResetSuccess(`Password reset for ${resetFor.email}. Share the new password: ${resetPassword}`);
      setResetPassword("");
    } catch (err) {
      setResetError(err instanceof ApiError ? err.message : "Failed to reset password.");
    } finally {
      setResetting(false);
    }
  }

  if (authLoading || !user) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-white">User Management</h1>
        <p className="mt-1 text-sm text-slate-400">Create agent and admin accounts, then hand the credentials to the person. Customers self-register.</p>
      </div>
      <div className="max-w-lg rounded-xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-300">Create User</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label htmlFor="cu-name" className="mb-1 block text-sm font-medium text-slate-300">Name</label>
            <input id="cu-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label htmlFor="cu-email" className="mb-1 block text-sm font-medium text-slate-300">Email</label>
            <input id="cu-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label htmlFor="cu-password" className="mb-1 block text-sm font-medium text-slate-300">Password</label>
            <div className="relative">
              <input id="cu-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 pr-16 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-medium text-slate-400 hover:text-slate-200">{showPassword ? "Hide" : "Show"}</button>
            </div>
          </div>
          <div>
            <label htmlFor="cu-role" className="mb-1 block text-sm font-medium text-slate-300">Role</label>
            <select id="cu-role" value={role} onChange={(e) => setRole(e.target.value as "agent" | "admin")} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none">
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {role === "agent" && (
            <div>
              <label htmlFor="cu-team" className="mb-1 block text-sm font-medium text-slate-300">Team</label>
              <select id="cu-team" value={teamId} onChange={(e) => setTeamId(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none">
                <option value="">No team</option>
                {teams.map((t) => (<option key={t._id} value={t._id}>{t.name}</option>))}
              </select>
            </div>
          )}
          {formError && (<p className="rounded-lg bg-rose-950/40 border border-rose-800/50 px-3 py-2 text-sm text-rose-300">{formError}</p>)}
          {success && (<p className="rounded-lg bg-emerald-950/40 border border-emerald-800/50 px-3 py-2 text-sm text-emerald-300">{success}</p>)}
          <button type="submit" disabled={submitting} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
            {submitting ? "Creating…" : "Create User"}
          </button>
        </form>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading users…</p>}
      {loadError && (<p className="rounded-lg bg-rose-950/40 border border-rose-800/50 px-3 py-2 text-sm text-rose-300">{loadError}</p>)}
      {!loading && !loadError && (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
          <table className="min-w-full divide-y divide-slate-800/60 text-sm">
            <thead className="bg-slate-900/90">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Team</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="px-4 py-3 font-medium text-slate-100">{u.name}</td>
                  <td className="px-4 py-3 text-slate-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE[u.role] ?? ""}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{teamName(u.teamId)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openReset(u)} className="text-sm text-indigo-400 underline hover:text-indigo-300">Reset password</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {resetFor && (
        <div className="max-w-lg rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-300">Reset password for {resetFor.name} ({resetFor.email})</h2>
          <form onSubmit={handleReset} className="space-y-3">
            <input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} placeholder="New password (min 6 chars)" className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
            {resetError && (<p className="text-sm text-rose-400">{resetError}</p>)}
            {resetSuccess && (<p className="rounded-lg bg-emerald-950/40 border border-emerald-800/50 px-3 py-2 text-sm text-emerald-300">{resetSuccess}</p>)}
            <div className="flex items-center gap-3">
              <button type="submit" disabled={resetting} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
                {resetting ? "Resetting…" : "Reset Password"}
              </button>
              <button type="button" onClick={() => setResetFor(null)} className="text-sm text-slate-500 hover:text-slate-200">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
