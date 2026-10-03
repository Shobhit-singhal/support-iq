import Team from '../models/Team.js';
import User from '../models/User.js';
import RoutingRule from '../models/RoutingRule.js';
import Ticket from '../models/Ticket.js';

async function resolveTeam({ category, suggestedTeamName }) {
  // Prefer the ML service's suggested team name when it matches a real team,
  // since it may be more specific than the coarse category->team routing table.
  if (suggestedTeamName) {
    const bySuggestion = await Team.findOne({ name: suggestedTeamName });
    if (bySuggestion) return bySuggestion;
  }

  const rules = await RoutingRule.find({ category }).sort({ priorityWeight: -1 }).populate('teamId');
  const ruleWithTeam = rules.find((r) => r.teamId);
  if (ruleWithTeam) return ruleWithTeam.teamId;

  // No matching rule: fall back to any team that lists this category, then any team at all.
  const byCategory = await Team.findOne({ categories: category });
  if (byCategory) return byCategory;

  return Team.findOne();
}

// Pure selection: given the candidate agents and a map of open-ticket counts,
// pick the least-busy one. The first agent wins ties (stable, deterministic).
// Extracted from the DB query below so it can be unit-tested without Mongo.
export function selectLeastBusyAgent(agents, countByAgent) {
  if (!agents || agents.length === 0) return null;

  let chosen = agents[0];
  let lowest = countByAgent.get(String(chosen._id)) || 0;

  for (const agent of agents.slice(1)) {
    const count = countByAgent.get(String(agent._id)) || 0;
    if (count < lowest) {
      chosen = agent;
      lowest = count;
    }
  }

  return chosen;
}

async function pickAgentWithFewestOpenTickets(teamId) {
  if (!teamId) return null;

  const agents = await User.find({ role: 'agent', teamId }).lean();
  if (agents.length === 0) return null;

  const openCounts = await Ticket.aggregate([
    {
      $match: {
        teamId,
        assignedAgentId: { $in: agents.map((a) => a._id) },
        status: { $in: ['open', 'in_progress'] },
      },
    },
    { $group: { _id: '$assignedAgentId', count: { $sum: 1 } } },
  ]);

  const countByAgent = new Map(openCounts.map((c) => [String(c._id), c.count]));
  return selectLeastBusyAgent(agents, countByAgent);
}

export async function routeTicket({ category, suggestedTeamName }) {
  const team = await resolveTeam({ category, suggestedTeamName });
  const agent = team ? await pickAgentWithFewestOpenTickets(team._id) : null;

  return {
    teamId: team ? team._id : null,
    assignedAgentId: agent ? agent._id : null,
  };
}

export default { routeTicket };
