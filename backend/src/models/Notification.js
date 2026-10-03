import mongoose from 'mongoose';

// A per-user, in-app notification. Created as a side effect of ticket events
// (assignment, status change, new comment, SLA breach) and surfaced via the
// bell in the NavBar. `link` is a frontend-relative path the bell navigates to.
const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', default: null },
    link: { type: String, default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Fast unread-count / recent-list lookups for the bell.
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
