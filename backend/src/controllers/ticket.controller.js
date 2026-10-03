import Ticket from '../models/Ticket.js';
import TicketEvent from '../models/TicketEvent.js';
import CsatResponse from '../models/CsatResponse.js';
import * as mlService from '../services/mlService.js';
import * as routingService from '../services/routingService.js';
import * as slaService from '../services/slaService.js';
import { notify } from '../services/notificationService.js';
import { canAccessTicket } from './comment.controller.js';

export async function createTicket(req, res, next) {
  try {
    const { subject, description } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ message: 'subject and description are required' });
    }

    const classification = await mlService.classify(`${subject}\n\n${description}`);
    const { teamId, assignedAgentId } = await routingService.routeTicket({
      category: classification.category,
      suggestedTeamName: classification.suggested_team,
    });
    const { firstResponseDueAt, resolutionDueAt } = slaService.computeSlaDueDates(classification.priority);

    const ticket = await Ticket.create({
      customerId: req.user.id,
      subject,
      description,
      category: classification.category,
      priority: classification.priority,
      sentiment: classification.sentiment,
      teamId,
      assignedAgentId,
      firstResponseDueAt,
      resolutionDueAt,
      slaStatus: 'on_track',
    });

    await TicketEvent.create({
      ticketId: ticket._id,
      type: 'created',
      actorId: req.user.id,
      meta: { category: ticket.category, priority: ticket.priority, teamId, assignedAgentId },
    });

    const populated = await Ticket.findById(ticket._id)
      .populate('customerId', 'name email')
      .populate('assignedAgentId', 'name email')
      .populate('teamId', 'name');

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
}

export async function getTicket(req, res, next) {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('customerId', 'name email')
      .populate('assignedAgentId', 'name email')
      .populate('teamId', 'name');

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // Enforce the same visibility rules as the list endpoint: a logged-in user
    // must not be able to read an arbitrary ticket by guessing its id.
    if (!canAccessTicket(req.user, ticket)) {
      return res.status(403).json({ message: 'You do not have access to this ticket' });
    }

    // Attach any CSAT so the frontend can tell a rating was already submitted
    // (survives a page reload — the ticket doc itself doesn't store it).
    const csat = await CsatResponse.findOne({ ticketId: ticket._id }).lean();
    res.json({ ...ticket.toObject(), csat: csat || null });
  } catch (err) {
    next(err);
  }
}

export async function listTickets(req, res, next) {
  try {
    const { status, priority, agent, team, category, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (agent) filter.assignedAgentId = agent;
    if (team) filter.teamId = team;
    if (category) filter.category = category;

    // Customers may only ever see their own tickets, regardless of query params.
    // Agents are scoped to their team's tickets plus anything assigned directly
    // to them; admins see everything.
    if (req.user.role === 'customer') {
      filter.customerId = req.user.id;
    } else if (req.user.role === 'agent') {
      const scope = [{ assignedAgentId: req.user.id }];
      if (req.user.teamId) scope.push({ teamId: req.user.teamId });
      filter.$or = scope;
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate('customerId', 'name email')
        .populate('assignedAgentId', 'name email')
        .populate('teamId', 'name')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Ticket.countDocuments(filter),
    ]);

    res.json({ tickets, total, page: pageNum, limit: limitNum });
  } catch (err) {
    next(err);
  }
}

export async function updateTicket(req, res, next) {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const { status, assignedAgentId, priority, category, teamId } = req.body;
    const events = [];

    const notifications = [];

    if (assignedAgentId !== undefined && String(assignedAgentId) !== String(ticket.assignedAgentId || '')) {
      events.push({
        ticketId: ticket._id,
        type: 'reassigned',
        actorId: req.user.id,
        meta: { oldAgentId: ticket.assignedAgentId, newAgentId: assignedAgentId || null },
      });
      ticket.assignedAgentId = assignedAgentId || null;
      // Tell the newly assigned agent (unless they assigned it to themselves).
      if (ticket.assignedAgentId && String(ticket.assignedAgentId) !== String(req.user.id)) {
        notifications.push({
          userId: ticket.assignedAgentId,
          type: 'assigned',
          message: `You were assigned ticket "${ticket.subject}"`,
          ticketId: ticket._id,
          link: `/tickets/${ticket._id}`,
        });
      }
    }

    if (status !== undefined && status !== ticket.status) {
      events.push({
        ticketId: ticket._id,
        type: 'status_changed',
        actorId: req.user.id,
        meta: { oldStatus: ticket.status, newStatus: status },
      });
      ticket.status = status;
      if (['resolved', 'closed'].includes(status) && !ticket.resolvedAt) {
        ticket.resolvedAt = new Date();
      }
      // Keep the ticket owner informed of status progress (unless they made it).
      if (String(ticket.customerId) !== String(req.user.id)) {
        notifications.push({
          userId: ticket.customerId,
          type: 'status_changed',
          message: `Ticket "${ticket.subject}" is now ${status.replace('_', ' ')}`,
          ticketId: ticket._id,
          link: `/tickets/${ticket._id}`,
        });
      }
    }

    if (priority !== undefined) ticket.priority = priority;
    if (category !== undefined) ticket.category = category;
    if (teamId !== undefined) ticket.teamId = teamId;

    ticket.slaStatus = slaService.computeSlaStatus(ticket);

    await ticket.save();
    if (events.length) await TicketEvent.insertMany(events);
    // Fire-and-forget: a notification failure must not fail the update.
    await Promise.all(notifications.map((n) => notify(n)));

    const populated = await Ticket.findById(ticket._id)
      .populate('customerId', 'name email')
      .populate('assignedAgentId', 'name email')
      .populate('teamId', 'name');

    res.json(populated);
  } catch (err) {
    next(err);
  }
}

export async function submitCsat(req, res, next) {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (!['resolved', 'closed'].includes(ticket.status)) {
      return res.status(400).json({ message: 'CSAT can only be submitted for resolved or closed tickets' });
    }

    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'rating must be a number between 1 and 5' });
    }

    // One CSAT per ticket. Pre-check for a friendly message; the unique index
    // on ticketId is the real guard against a race between two submissions.
    const existing = await CsatResponse.findOne({ ticketId: ticket._id });
    if (existing) {
      return res.status(409).json({ message: 'CSAT has already been submitted for this ticket' });
    }

    let csat;
    try {
      csat = await CsatResponse.create({
        ticketId: ticket._id,
        agentId: ticket.assignedAgentId,
        rating,
        comment: comment || '',
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ message: 'CSAT has already been submitted for this ticket' });
      }
      throw err;
    }

    await TicketEvent.create({
      ticketId: ticket._id,
      type: 'csat_submitted',
      actorId: req.user.id,
      meta: { rating },
    });

    res.status(201).json(csat);
  } catch (err) {
    next(err);
  }
}

export default { createTicket, getTicket, listTickets, updateTicket, submitCsat };
