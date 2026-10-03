import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';

const SALT_ROUNDS = 10;

// Roughly mirror JWT_EXPIRES_IN (default 7d) so the cookie and token expire
// together. httpOnly keeps JS (and thus XSS) from reading the token; sameSite
// 'lax' is fine for this same-site dev setup. secure is enabled outside dev so
// production only sends the cookie over HTTPS.
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  };
}

function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    teamId: user.teamId,
  };
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'A user with this email already exists' });
    }

    // Public self-registration always creates a customer. Any client-supplied
    // `role`/`teamId` is ignored — agents and admins are provisioned by an admin
    // via the admin-only POST /api/users (see user.controller.createUser).
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'customer',
      teamId: null,
    });

    const token = signToken({ id: user._id, role: user.role, email: user.email, teamId: user.teamId });
    res.cookie('token', token, authCookieOptions());
    // token is still returned for non-browser clients (tests/scripts); browsers
    // rely on the httpOnly cookie above and ignore this field.
    res.status(201).json({ token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken({ id: user._id, role: user.role, email: user.email, teamId: user.teamId });
    res.cookie('token', token, authCookieOptions());
    res.json({ token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

// Clears the auth cookie. The client also drops its cached user object, but
// this is what actually invalidates the browser session server-side.
export async function logout(req, res) {
  res.clearCookie('token', { ...authCookieOptions(), maxAge: undefined });
  res.json({ message: 'Logged out' });
}

// Self-service password change for the logged-in user. Requires the current
// password so a hijacked (but not re-authenticated) session can't silently
// change it. req.user is set by requireAuth.
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: 'currentPassword and newPassword are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    if (currentPassword === newPassword) {
      return res
        .status(400)
        .json({ message: 'New password must differ from the current password' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    next(err);
  }
}

export default { register, login, logout, changePassword };
