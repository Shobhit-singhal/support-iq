export type Role = "admin" | "agent" | "customer";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  teamId?: string | null;
}

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "Low" | "Medium" | "High" | "Critical";
export type TicketSentiment = "Positive" | "Neutral" | "Negative";
export type SlaStatus = "on_track" | "at_risk" | "breached";

export interface Ticket {
  _id: string;
  customerId: string | { _id: string; name: string; email: string };
  subject: string;
  description: string;
  category: string;
  priority: TicketPriority;
  sentiment: TicketSentiment;
  status: TicketStatus;
  assignedAgentId?: string | { _id: string; name: string; email: string } | null;
  teamId?: string | { _id: string; name: string } | null;
  createdAt: string;
  firstResponseDueAt?: string | null;
  resolutionDueAt?: string | null;
  resolvedAt?: string | null;
  slaStatus: SlaStatus;
  // Not in the documented contract, but read defensively in case the backend
  // populates it on ticket detail — lets us hide the CSAT form once submitted.
  csat?: CsatResponse | null;
}

export interface CsatResponse {
  _id: string;
  ticketId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

// Paginated envelope returned by GET /api/tickets.
export interface TicketList {
  tickets: Ticket[];
  total: number;
  page: number;
  limit: number;
}

export interface Comment {
  _id: string;
  ticketId: string;
  authorId: { _id: string; name: string; email: string; role: Role } | string;
  body: string;
  internal: boolean;
  createdAt: string;
}

export interface Notification {
  _id: string;
  type: string;
  message: string;
  ticketId?: string | null;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationList {
  notifications: Notification[];
  unreadCount: number;
}

export interface AgentAnalytics {
  agentId: string;
  name: string;
  ticketsResolved: number;
  avgResponseTimeMs: number;
  avgResolutionTimeMs: number;
  slaCompliancePct: number;
  avgCsat: number;
}

// Roster entry from GET /api/users/agents — used to populate the assignment picker.
export interface Agent {
  _id: string;
  name: string;
  email: string;
  teamId?: string | null;
}

export interface SlaAnalytics {
  onTrack: number;
  atRisk: number;
  breached: number;
  breachRateOverTime: { date: string; rate: number }[];
}

export interface CsatAnalytics {
  trend: { date: string; avgRating: number }[];
  byCategory: { category: string; avgRating: number }[];
  byAgent: { agentId: string; name: string; avgRating: number }[];
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Team {
  _id: string;
  name: string;
  categories: string[];
}

// A user row in the admin management table. teamId is populated to { _id, name }
// for agents (null otherwise).
export interface ManagedUser {
  _id: string;
  name: string;
  email: string;
  role: Role;
  teamId?: { _id: string; name: string } | string | null;
  createdAt?: string;
}
