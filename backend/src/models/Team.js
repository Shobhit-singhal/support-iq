import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    categories: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Team', teamSchema);
