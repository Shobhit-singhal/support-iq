import mongoose from 'mongoose';

// A message in a ticket's conversation thread. `internal` comments are notes
// between agents/admins that the customer must never see (enforced in the
// controller by filtering them out for customer requests).
const commentSchema = new mongoose.Schema(
  {
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true },
    internal: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Comment', commentSchema);
