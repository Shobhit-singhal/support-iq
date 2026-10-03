import Notification from '../models/Notification.js';

// Recent notifications for the authenticated user, plus the current unread
// count (used by the NavBar bell badge).
export async function listNotifications(req, res, next) {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(limit).lean(),
      Notification.countDocuments({ userId: req.user.id, read: false }),
    ]);
    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
}

// Mark one notification read. Scoped to the owner so a user can't touch
// another user's notifications.
export async function markRead(req, res, next) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(req, res, next) {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );
    res.json({ updated: result.modifiedCount ?? result.nModified ?? 0 });
  } catch (err) {
    next(err);
  }
}

export default { listNotifications, markRead, markAllRead };
