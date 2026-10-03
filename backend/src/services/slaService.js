// SLA policy: (firstResponse hours, resolution hours) per priority.
// Higher-severity tickets get tighter windows; values are a common industry-standard
// baseline for support SLAs and are easy to tune later without touching call sites.
const SLA_POLICY_HOURS = {
  Critical: { firstResponse: 2, resolution: 8 },
  High: { firstResponse: 4, resolution: 24 },
  Medium: { firstResponse: 8, resolution: 48 },
  Low: { firstResponse: 24, resolution: 72 },
};

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function computeSlaDueDates(priority, from = new Date()) {
  const policy = SLA_POLICY_HOURS[priority] || SLA_POLICY_HOURS.Medium;
  return {
    firstResponseDueAt: addHours(from, policy.firstResponse),
    resolutionDueAt: addHours(from, policy.resolution),
  };
}

// A ticket is "at risk" once it has used up 75% of its remaining time budget;
// this gives agents a heads-up window before an actual breach.
export function computeSlaStatus(ticket, now = new Date()) {
  if (ticket.status === 'resolved' || ticket.status === 'closed') {
    if (ticket.resolvedAt && ticket.resolutionDueAt && ticket.resolvedAt > ticket.resolutionDueAt) {
      return 'breached';
    }
    return 'on_track';
  }

  if (!ticket.resolutionDueAt) return 'on_track';

  if (now > ticket.resolutionDueAt) return 'breached';

  const createdAt = ticket.createdAt || now;
  const totalWindowMs = ticket.resolutionDueAt.getTime() - createdAt.getTime();
  const elapsedMs = now.getTime() - createdAt.getTime();
  if (totalWindowMs > 0 && elapsedMs / totalWindowMs >= 0.75) return 'at_risk';

  return 'on_track';
}

export const SLA_POLICY = SLA_POLICY_HOURS;

export default { computeSlaDueDates, computeSlaStatus, SLA_POLICY: SLA_POLICY_HOURS };
