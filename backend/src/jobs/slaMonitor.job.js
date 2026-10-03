import cron from 'node-cron';
import Ticket from '../models/Ticket.js';
import SlaLog from '../models/SlaLog.js';
import { computeSlaStatus } from '../services/slaService.js';
import { notify } from '../services/notificationService.js';

async function runSlaSweep() {
  const openTickets = await Ticket.find({ status: { $in: ['open', 'in_progress'] } });
  const now = new Date();
  const logs = [];
  const breachNotifications = [];

  for (const ticket of openTickets) {
    const newStatus = computeSlaStatus(ticket, now);
    if (newStatus !== ticket.slaStatus) {
      logs.push({ ticketId: ticket._id, event: `sla_status_changed:${ticket.slaStatus}->${newStatus}`, timestamp: now });
      // Alert the assigned agent when a ticket newly breaches SLA.
      if (newStatus === 'breached' && ticket.assignedAgentId) {
        breachNotifications.push({
          userId: ticket.assignedAgentId,
          type: 'sla_breached',
          message: `SLA breached on ticket "${ticket.subject}"`,
          ticketId: ticket._id,
          link: `/tickets/${ticket._id}`,
        });
      }
      ticket.slaStatus = newStatus;
      await ticket.save();
    }
  }

  if (logs.length) await SlaLog.insertMany(logs);
  await Promise.all(breachNotifications.map((n) => notify(n)));
  if (logs.length) console.log(`SLA monitor: updated ${logs.length} ticket(s) at ${now.toISOString()}`);
}

// Every 5 minutes is frequent enough to catch SLA transitions promptly without
// putting meaningful load on the DB for a ticket volume typical of this project.
export function startSlaMonitor() {
  cron.schedule('*/5 * * * *', () => {
    runSlaSweep().catch((err) => console.error('SLA monitor job failed:', err.message));
  });
  console.log('SLA monitor job scheduled (every 5 minutes)');
}

export { runSlaSweep };
export default { startSlaMonitor, runSlaSweep };
