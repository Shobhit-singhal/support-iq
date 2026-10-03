import { Router } from 'express';
import { register, login, logout, changePassword } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
// Self-service password change for the logged-in user.
router.post('/change-password', requireAuth, changePassword);

export default router;
