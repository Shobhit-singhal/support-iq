import { Router } from 'express';
import {
  listAgents,
  createUser,
  listUsers,
  listTeams,
  resetUserPassword,
} from '../controllers/user.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Only agents/admins need the agent roster (for the ticket assignment picker).
router.get('/agents', requireAuth, requireRole('agent', 'admin'), listAgents);

// Admin-only user management: list all users, create agent/admin accounts, and
// read the team list for the create form.
router.get('/', requireAuth, requireRole('admin'), listUsers);
router.post('/', requireAuth, requireRole('admin'), createUser);
router.get('/teams', requireAuth, requireRole('admin'), listTeams);
// Admin resets another user's password and hands them the new value.
router.post('/:id/reset-password', requireAuth, requireRole('admin'), resetUserPassword);

export default router;
