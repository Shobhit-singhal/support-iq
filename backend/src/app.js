import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import userRoutes from './routes/user.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

// Kept free of any DB connection logic so it can be imported/tested (or health-checked)
// without a live MongoDB instance; only server.js calls connectDB() before listening.
const app = express();

// Allow the frontend dev origin(s). 3000 is the default; 3001 is used as a
// fallback when 3000 is occupied by another local app. Override with
// FRONTEND_ORIGINS (comma-separated) if needed.
const allowedOrigins = (process.env.FRONTEND_ORIGINS || 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map((o) => o.trim());
// credentials: true so the browser will send/receive the httpOnly auth cookie
// on cross-origin (localhost:3001 -> localhost:5000) requests.
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
