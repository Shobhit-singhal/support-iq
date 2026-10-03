import Ticket from '../models/Ticket.js';
import TicketEvent from '../models/TicketEvent.js';
import CsatResponse from '../models/CsatResponse.js';
import User from '../models/User.js';

export async function agentAnalytics(req, res, next) {
  try {
    const ticketStats = await Ticket.aggregate([
      { $match: { assignedAgentId: { $ne: null } } },
      {
        $group: {
          _id: '$assignedAgentId',
          totalAssigned: { $sum: 1 },
          resolvedCount: {
            $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] },
          },
          breachedCount: {
            $sum: { $cond: [{ $eq: ['$slaStatus', 'breached'] }, 1, 0] },
          },
          // $avg silently ignores non-numeric/null inputs, so unresolved tickets
          // (resolvedAt: null -> subtraction yields null) don't skew the average.
          avgResolutionTimeMs: {
            $avg: {
              $cond: [{ $ne: ['$resolvedAt', null] }, { $subtract: ['$resolvedAt', '$createdAt'] }, null],
            },
          },
        },
      },
    ]);

    // "First response" isn't a dedicated field on Ticket; we treat the agent's
    // first open->in_progress transition (logged as a ticket_event) as the
    // first-response marker, since that's the first agent-driven state change.
    const responseStats = await TicketEvent.aggregate([
      { $match: { type: 'status_changed', 'meta.newStatus': 'in_progress' } },
      { $sort: { timestamp: 1 } },
      { $group: { _id: '$ticketId', firstResponseAt: { $first: '$timestamp' }, actorId: { $first: '$actorId' } } },
      {
        $lookup: {
          from: 'tickets',
          localField: '_id',
          foreignField: '_id',
          as: 'ticket',
        },
      },
      { $unwind: '$ticket' },
      {
        $project: {
          actorId: 1,
          responseTimeMs: { $subtract: ['$firstResponseAt', '$ticket.createdAt'] },
        },
      },
      { $group: { _id: '$actorId', avgResponseTimeMs: { $avg: '$responseTimeMs' } } },
    ]);

    const csatStats = await CsatResponse.aggregate([
      { $match: { agentId: { $ne: null } } },
      { $group: { _id: '$agentId', avgCsat: { $avg: '$rating' }, csatCount: { $sum: 1 } } },
    ]);

    const byAgent = new Map();
    const ensure = (id) => {
      const key = String(id);
      if (!byAgent.has(key)) {
        byAgent.set(key, {
          agentId: id,
          totalAssigned: 0,
          resolvedCount: 0,
          breachedCount: 0,
          avgResolutionTimeMs: null,
          avgResponseTimeMs: null,
          slaComplianceRate: null,
          avgCsat: null,
          csatCount: 0,
        });
      }
      return byAgent.get(key);
    };

    for (const stat of ticketStats) {
      const entry = ensure(stat._id);
      entry.totalAssigned = stat.totalAssigned;
      entry.resolvedCount = stat.resolvedCount;
      entry.breachedCount = stat.breachedCount;
      entry.avgResolutionTimeMs = stat.avgResolutionTimeMs ?? null;
      entry.slaComplianceRate = stat.totalAssigned
        ? Number((((stat.totalAssigned - stat.breachedCount) / stat.totalAssigned) * 100).toFixed(2))
        : null;
    }

    for (const stat of responseStats) {
      const entry = ensure(stat._id);
      entry.avgResponseTimeMs = stat.avgResponseTimeMs ?? null;
    }

    for (const stat of csatStats) {
      const entry = ensure(stat._id);
      entry.avgCsat = stat.avgCsat != null ? Number(stat.avgCsat.toFixed(2)) : null;
      entry.csatCount = stat.csatCount;
    }

    const agentIds = Array.from(byAgent.keys()).filter((id) => id !== 'null');
    const agents = await User.find({ _id: { $in: agentIds } }, 'name email').lean();
    const agentNameById = new Map(agents.map((a) => [String(a._id), a]));

    // Shape the response to the frontend contract (lib/types.ts::AgentAnalytics):
    // flat fields, non-null numbers (the dashboard calls .toFixed() on these),
    // and a top-level `name`.
    const result = Array.from(byAgent.values()).map((entry) => {
      const agent = agentNameById.get(String(entry.agentId));
      return {
        agentId: String(entry.agentId),
        name: agent?.name || 'Unknown',
        ticketsResolved: entry.resolvedCount,
        avgResponseTimeMs: entry.avgResponseTimeMs ?? 0,
        avgResolutionTimeMs: entry.avgResolutionTimeMs ?? 0,
        slaCompliancePct: entry.slaComplianceRate ?? 0,
        avgCsat: entry.avgCsat ?? 0,
      };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function slaAnalytics(req, res, next) {
  try {
    const countsByStatus = await Ticket.aggregate([
      { $group: { _id: '$slaStatus', count: { $sum: 1 } } },
    ]);

    const breachRateOverTime = await Ticket.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: 1 },
          breached: { $sum: { $cond: [{ $eq: ['$slaStatus', 'breached'] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          // Frontend (lib/types.ts::SlaAnalytics) reads `.rate`; round for display.
          rate: {
            $cond: [
              { $eq: ['$total', 0] },
              0,
              { $round: [{ $multiply: [{ $divide: ['$breached', '$total'] }, 100] }, 2] },
            ],
          },
        },
      },
      { $sort: { date: 1 } },
    ]);

    // Frontend contract (lib/types.ts::SlaAnalytics) wants flat counts, not a
    // status/count array. Missing statuses default to 0.
    const countByStatus = new Map(countsByStatus.map((c) => [c._id, c.count]));
    res.json({
      onTrack: countByStatus.get('on_track') || 0,
      atRisk: countByStatus.get('at_risk') || 0,
      breached: countByStatus.get('breached') || 0,
      breachRateOverTime,
    });
  } catch (err) {
    next(err);
  }
}

// byCategoryAndTeam splits one category across teams; collapse to one row per
// category with a count-weighted average so the frontend gets a single bar per
// category label.
function mergeByCategory(rows) {
  const byCategory = new Map();
  for (const row of rows) {
    const key = row.category || 'Uncategorized';
    const entry = byCategory.get(key) || { ratingSum: 0, count: 0 };
    entry.ratingSum += row.avgRating * row.count;
    entry.count += row.count;
    byCategory.set(key, entry);
  }
  return Array.from(byCategory.entries())
    .map(([category, { ratingSum, count }]) => ({
      category,
      avgRating: count ? Number((ratingSum / count).toFixed(2)) : 0,
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

export async function csatAnalytics(req, res, next) {
  try {
    const trendsOverTime = await CsatResponse.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, date: '$_id', avgRating: { $round: ['$avgRating', 2] }, count: 1 } },
      { $sort: { date: 1 } },
    ]);

    const byCategoryAndTeam = await CsatResponse.aggregate([
      {
        $lookup: {
          from: 'tickets',
          localField: 'ticketId',
          foreignField: '_id',
          as: 'ticket',
        },
      },
      { $unwind: '$ticket' },
      {
        $lookup: {
          from: 'teams',
          localField: 'ticket.teamId',
          foreignField: '_id',
          as: 'team',
        },
      },
      { $unwind: { path: '$team', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { category: '$ticket.category', teamId: '$ticket.teamId', teamName: '$team.name' },
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: '$_id.category',
          teamId: '$_id.teamId',
          teamName: '$_id.teamName',
          avgRating: { $round: ['$avgRating', 2] },
          count: 1,
        },
      },
      { $sort: { category: 1 } },
    ]);

    const byAgentRaw = await CsatResponse.aggregate([
      { $match: { agentId: { $ne: null } } },
      { $group: { _id: '$agentId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    const agentIds = byAgentRaw.map((a) => a._id);
    const agents = await User.find({ _id: { $in: agentIds } }, 'name email').lean();
    const agentNameById = new Map(agents.map((a) => [String(a._id), a]));

    const byAgent = byAgentRaw.map((a) => ({
      agentId: String(a._id),
      name: agentNameById.get(String(a._id))?.name || 'Unknown',
      avgRating: Number(a.avgRating.toFixed(2)),
      count: a.count,
    }));

    // Shape to the frontend contract (lib/types.ts::CsatAnalytics): `trend`,
    // `byCategory` (with a flat `category` label), and `byAgent` (with `name`).
    res.json({
      trend: trendsOverTime,
      byCategory: mergeByCategory(byCategoryAndTeam),
      byAgent,
    });
  } catch (err) {
    next(err);
  }
}

export default { agentAnalytics, slaAnalytics, csatAnalytics };
