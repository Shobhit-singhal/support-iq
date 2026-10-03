import mongoose from 'mongoose';

const csatResponseSchema = new mongoose.Schema({
  ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true, unique: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now },
});

export default mongoose.model('CsatResponse', csatResponseSchema);
