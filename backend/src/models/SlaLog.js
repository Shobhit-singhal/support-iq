import mongoose from 'mongoose';

const slaLogSchema = new mongoose.Schema({
  ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  event: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model('SlaLog', slaLogSchema);
