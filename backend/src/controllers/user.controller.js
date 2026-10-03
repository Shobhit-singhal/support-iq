import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Team from '../models/Team.js';

const SALT_ROUNDS = 10;

// Lists agents for the assignment picker on the ticket detail page. Optionally
// scoped to a team via ?team=<id>. Returns only non-sensitive fields.
export async function listAgents(req, res, next) {
  try {
    const filter = { role: 'agent' };
    if (req.query.team) filter.teamId = req.query.team;

    const agents = await User.find(filter, 'name email teamId').sort({ name: 1 }).lean();
    res.json(agents);
  } catch (err) {
    next(err);
  }
}

// Admin-only. Creates an agent or admin account (customers self-register). This
// is where role selection legitimately lives — behind an admin session — unlike
// the public register route, which always creates a customer. The admin sets
// the password and hands the credentials to the new user.
export async function createUser(req, res, next) {
  try {
    const { name, email, password, role, teamId } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }
    if (!['agent', 'admin'].includes(role)) {
      return res.status(400).json({ message: "role must be 'agent' or 'admin'" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'A user with this email already exists' });
    }

    // A team only makes sense for agents; validate it exists if provided.
    let resolvedTeamId = null;
    if (role === 'agent' && teamId) {
      const team = await Team.findById(teamId);
      if (!team) return res.status(400).json({ message: 'Invalid teamId' });
      resolvedTeamId = team._id;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      teamId: resolvedTeamId,
    });

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      teamId: user.teamId,
    });
  } catch (err) {
    next(err);
  }
}

// Admin-only. Lists all users for the admin management table.
export async function listUsers(req, res, next) {
  try {
    const users = await User.find({}, 'name email role teamId createdAt')
      .populate('teamId', 'name')
      .sort({ createdAt: -1 })
      .lean();
    res.json(users);
  } catch (err) {
    next(err);
  }
}

// Teams for the admin "create user" team dropdown.
export async function listTeams(req, res, next) {
  try {
    const teams = await Team.find({}, 'name categories').sort({ name: 1 }).lean();
    res.json(teams);
  } catch (err) {
    next(err);
  }
}

// Admin-only. Resets any user's password to an admin-supplied value, which the
// admin then hands to that person (matches the credential-handoff flow). No
// current-password check here — that authority comes from being an admin. An
// admin cannot reset their own password this way; they use changePassword so a
// stolen admin session can't lock out the real admin.
export async function resetUserPassword(req, res, next) {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'newPassword must be at least 6 characters' });
    }

    const target = await User.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (String(target._id) === String(req.user.id)) {
      return res
        .status(400)
        .json({ message: 'Use change-password for your own account' });
    }

    target.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await target.save();
    res.json({ message: `Password reset for ${target.email}` });
  } catch (err) {
    next(err);
  }
}

export default { listAgents, createUser, listUsers, listTeams, resetUserPassword };
