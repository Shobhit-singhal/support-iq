import Ticket from '../models/Ticket.js';
import Comment from '../models/Comment.js';
import TicketEvent from '../models/TicketEvent.js';
import { notifyMany } from '../services/notificationService.js';

// Whether `user` may see `ticket` at all. Mirrors the listTickets scoping:
// customers only their own; agents their team's or ones assigned to them;
// admins everything.
// Normalize a ref that may be a raw ObjectId or a populated document to its
// id string, so this works whether the caller populated the ticket or not.
function refId(ref) {
  if (!ref) return null;
  if (typeof ref === 'object' && ref._id) return String(ref._id);
  return String(ref);
}

export function canAccessTicket(user, ticket) {
  if (user.role === 'admin') return true;
  if (user.role === 'customer') return refId(ticket.customerId) === String(user.id);
  // agent
  if (refId(ticket.assignedAgentId) === String(user.id)) return true;
  if (user.teamId && refId(ticket.teamId) === String(user.teamId)) return true;
  return false;
}

export async function listComments(req, res, next) {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (!canAccessTicket(req.user, ticket)) {
      return res.status(403).json({ message: 'You do not have access to this ticket' });
    }

    // Customers never see internal notes.
    const filter = { ticketId: ticket._id };
    if (req.user.role === 'customer') filter.internal = false;

    const comments = await Comment.find(filter)
      .populate('authorId', 'name email role')
      .sort({ createdAt: 1 })
      .lean();

    res.json(comments);
  } catch (err) {
    next(err);
  }
}

export async function createComment(req, res, next) {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (!canAccessTicket(req.user, ticket)) {
      return res.status(403).json({ message: 'You do not have access to this ticket' });
    }

    const { body } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ message: 'body is required' });
    }

    // Only agents/admins can post internal notes; a customer flag is ignored.
    const internal = Boolean(req.body.internal) && req.user.role !== 'customer';

    const comment = await Comment.create({
      ticketId: ticket._id,
      authorId: req.user.id,
      body: body.trim(),
      internal,
    });

    await TicketEvent.create({
      ticketId: ticket._id,
      type: 'comment_added',
      actorId: req.user.id,
      meta: { commentId: comment._id, internal },
    });

    // Notify the other parties on the ticket (never the author). Internal notes
    // stay within the team: notify the assigned agent only, never the customer.
    const recipients = [];
    if (!internal) recipients.push(ticket.customerId);
    recipients.push(ticket.assignedAgentId);
    const others = recipients.filter((r) => r && String(r) !== String(req.user.id));
    await notifyMany(others, {
      type: 'comment_added',
      message: `New ${internal ? 'internal note' : 'reply'} on "${ticket.subject}"`,
      ticketId: ticket._id,
      link: `/tickets/${ticket._id}`,
    });

    const populated = await Comment.findById(comment._id)
      .populate('authorId', 'name email role')
      .lean();

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
}

export default { listComments, createComment, canAccessTicket };
