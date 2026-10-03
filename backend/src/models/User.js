import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ['admin', 'agent', 'customer'], default: 'customer' },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
