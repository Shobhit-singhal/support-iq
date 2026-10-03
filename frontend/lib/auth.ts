"use client";

import { createContext, useContext } from "react";
import type { User } from "./types";

const USER_KEY = "ticketflow_user";

// The JWT now lives in an httpOnly cookie the browser manages and JS cannot
// read (XSS-resistant). We keep only the non-secret user object in localStorage
// so the UI can render the nav / gate routes without a round-trip on load.
export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setSession(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("ticketflow-auth-change"));
}

// Clears the cached user object. The httpOnly cookie is cleared separately by
// POST /api/auth/logout (see clearSession callers), since JS can't touch it.
export function clearSession() {
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("ticketflow-auth-change"));
}

export function dashboardPathForRole(role: User["role"]): string {
  if (role === "admin") return "/dashboard/agents";
  if (role === "agent") return "/tickets";
  return "/tickets";
}

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

export function useAuth() {
  return useContext(AuthContext);
}
