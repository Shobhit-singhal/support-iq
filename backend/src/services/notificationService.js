import Notification from '../models/Notification.js';

// Centralized creation so ticket controllers and the SLA job share one path.
// Notification failures must never break the action that triggered them, so
// callers can fire-and-forget; errors are swallowed with a log.

export async function notify({ userId, type, message, ticketId = null, link = null }) {
  if (!userId) return null;
  try {
    return await Notification.create({ userId, type, message, ticketId, link });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
}

// Create the same notification for several distinct users at once (deduped).
export async function notifyMany(userIds, payload) {
  const unique = [...new Set(userIds.filter(Boolean).map((id) => String(id)))];
  return Promise.all(unique.map((userId) => notify({ ...payload, userId })));
}

export default { notify, notifyMany };
