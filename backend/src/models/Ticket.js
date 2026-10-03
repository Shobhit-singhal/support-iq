import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, default: 'General' },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
    sentiment: { type: String, enum: ['Positive', 'Neutral', 'Negative'], default: 'Neutral' },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
    assignedAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    firstResponseDueAt: { type: Date },
    resolutionDueAt: { type: Date },
    resolvedAt: { type: Date, default: null },
    slaStatus: { type: String, enum: ['on_track', 'at_risk', 'breached'], default: 'on_track' },
  },
  { timestamps: true }
);

export default mongoose.model('Ticket', ticketSchema);
