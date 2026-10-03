import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import connectDB from './config/db.js';
import { startSlaMonitor } from './jobs/slaMonitor.job.js';

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error(
        'JWT_SECRET is not set. Copy .env.example to .env and set a value before starting.'
      );
    }
    await connectDB();
    startSlaMonitor();
    app.listen(PORT, () => {
      console.log(`TicketFlow backend listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
