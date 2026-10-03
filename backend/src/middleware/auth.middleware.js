import { verifyToken } from '../utils/jwt.js';

export function requireAuth(req, res, next) {
  // Prefer the httpOnly cookie (set at login/register); fall back to a Bearer
  // header so scripts/tests and non-browser clients still work.
  const header = req.headers.authorization || '';
  const [scheme, headerToken] = header.split(' ');
  const bearer = scheme === 'Bearer' ? headerToken : null;
  const token = req.cookies?.token || bearer;

  if (!token) {
    return res.status(401).json({ message: 'Missing authentication token' });
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.id, role: payload.role, email: payload.email, teamId: payload.teamId };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}

export default { requireAuth, requireRole };
