import type {
  AgentAnalytics,
  Agent,
  Comment,
  CsatAnalytics,
  CsatResponse,
  LoginResponse,
  ManagedUser,
  NotificationList,
  SlaAnalytics,
  Team,
  Ticket,
  TicketList,
  TicketPriority,
  TicketStatus,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  // Auth travels in an httpOnly cookie the browser attaches automatically;
  // credentials: "include" is required for that on cross-origin requests.
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body?.message || body?.error || message;
    } catch {
      // response had no JSON body; fall back to statusText
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// --- auth ---
// The server sets the auth as an httpOnly cookie; the returned `user` is cached
// client-side only for UI (rendering the nav, gating routes), never the token.
export function login(email: string, password: string) {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// Public self-registration always creates a customer; the server ignores any
// role sent here. Agent/admin accounts are created via createUser (admin-only).
export function register(name: string, email: string, password: string) {
  return request<LoginResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function logoutRequest() {
  return request<{ message: string }>("/auth/logout", { method: "POST" });
}

// Self-service: the logged-in user changes their own password.
export function changePassword(currentPassword: string, newPassword: string) {
  return request<{ message: string }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

// --- tickets ---
export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  agent?: string;
  team?: string;
  page?: number;
  limit?: number;
}

// The backend paginates: it returns { tickets, total, page, limit }. Returns
// the full envelope so callers can render pagination controls.
export function listTickets(filters: TicketFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const qs = params.toString();
  return request<TicketList>(`/tickets${qs ? `?${qs}` : ""}`);
}

export function getTicket(id: string) {
  return request<Ticket>(`/tickets/${id}`);
}

export function createTicket(subject: string, description: string) {
  return request<Ticket>("/tickets", {
    method: "POST",
    body: JSON.stringify({ subject, description }),
  });
}

export function updateTicket(
  id: string,
  updates: { status?: TicketStatus; assignedAgentId?: string }
) {
  return request<Ticket>(`/tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export function submitCsat(id: string, rating: number, comment?: string) {
  return request<CsatResponse>(`/tickets/${id}/csat`, {
    method: "POST",
    body: JSON.stringify({ rating, comment }),
  });
}

// --- users ---
export function listAgents(team?: string) {
  const qs = team ? `?team=${encodeURIComponent(team)}` : "";
  return request<Agent[]>(`/users/agents${qs}`);
}

// Admin-only user management.
export function listUsers() {
  return request<ManagedUser[]>("/users");
}

export function listTeams() {
  return request<Team[]>("/users/teams");
}

export function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: "agent" | "admin";
  teamId?: string;
}) {
  return request<ManagedUser>("/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// Admin resets another user's password to a new value to hand off.
export function resetUserPassword(userId: string, newPassword: string) {
  return request<{ message: string }>(`/users/${userId}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ newPassword }),
  });
}

// --- comments ---
export function listComments(ticketId: string) {
  return request<Comment[]>(`/tickets/${ticketId}/comments`);
}

export function addComment(ticketId: string, body: string, internal = false) {
  return request<Comment>(`/tickets/${ticketId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body, internal }),
  });
}

// --- notifications ---
export function listNotifications(limit = 20) {
  return request<NotificationList>(`/notifications?limit=${limit}`);
}

export function markNotificationRead(id: string) {
  return request<unknown>(`/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllNotificationsRead() {
  return request<{ updated: number }>(`/notifications/read-all`, { method: "PATCH" });
}

// --- analytics ---
export function getAgentAnalytics() {
  return request<AgentAnalytics[]>("/analytics/agents");
}

export function getSlaAnalytics() {
  return request<SlaAnalytics>("/analytics/sla");
}

export function getCsatAnalytics() {
  return request<CsatAnalytics>("/analytics/csat");
}
