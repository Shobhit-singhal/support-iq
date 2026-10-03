import { Router } from 'express';
import {
  createTicket,
  getTicket,
  listTickets,
  updateTicket,
  submitCsat,
} from '../controllers/ticket.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { listComments, createComment } from '../controllers/comment.controller.js';

const router = Router();

router.use(requireAuth);

router.post('/', createTicket);
router.get('/', listTickets);
router.get('/:id', getTicket);
router.patch('/:id', requireRole('agent', 'admin'), updateTicket);
router.post('/:id/csat', submitCsat);
router.get('/:id/comments', listComments);
router.post('/:id/comments', createComment);

export default router;
