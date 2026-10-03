import { Router } from 'express';
import { agentAnalytics, slaAnalytics, csatAnalytics } from '../controllers/analytics.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/agents', agentAnalytics);
router.get('/sla', slaAnalytics);
router.get('/csat', csatAnalytics);

export default router;
