import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ticketflow';
  mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err.message));
  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${uri}`);
}

export default connectDB;
