import mongoose from 'mongoose';

const routingRuleSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    priorityWeight: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export default mongoose.model('RoutingRule', routingRuleSchema);
