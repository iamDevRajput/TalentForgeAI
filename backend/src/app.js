/**
 * app.js — Express application factory
 *
 * WHY factory (not app.listen here):
 *   app.js exports the configured Express app without binding to a port.
 *   server.js calls app.listen() after connecting to DB + Redis.
 *   Integration tests import app directly — no port binding needed, no port
 *   conflicts between test runs.
 *
 * Middleware stack (order matters):
 *   1. Security headers (helmet)
 *   2. CORS (must be before any route)
 *   3. Cookie parser (before any route that reads cookies)
 *   4. Body parser
 *   5. Rate limiter
 *   6. HTTP request logging
 *   7. Routes
 *   8. 404 handler
 *   9. Global error handler (MUST be last)
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

import { env } from './config/env.js';
import { morganStream } from './config/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { AppError } from './utils/AppError.js';

// ── Route imports (each phase adds its own module here) ─────────────────────
import authRouter from './modules/auth/auth.routes.js';
// Phase 2+: import jobsRouter from './modules/jobs/jobs.routes.js';

const app = express();

// ── 1. Security headers ───────────────────────────────────────────────────────
app.use(helmet());

// ── 2. CORS ───────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,     // Required for cookies (httpOnly) to be sent cross-origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ── 3. Cookie parser ──────────────────────────────────────────────────────────
app.use(cookieParser());

// ── 4. Body parser ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── 5. Rate limiting ──────────────────────────────────────────────────────────
const skipInTest = () => env.NODE_ENV === 'test';

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,                  // requests per window (general endpoints)
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
  },
});

// Stricter limiter for auth endpoints (prevent brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 auth attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many login attempts, please try again later' },
  },
});

app.use(globalLimiter);

// ── 6. HTTP request logging ───────────────────────────────────────────────────
const morganFormat = env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, { stream: morganStream }));

// ── 7. Routes ─────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    service: 'talentforgeai-api',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

app.use('/api/auth', authLimiter, authRouter);

// Phase 2+: app.use('/api/jobs', authenticate, jobsRouter);
// Phase 3+: app.use('/api/candidates', authenticate, candidatesRouter);
// Phase 5+: app.use('/api/applications', authenticate, applicationsRouter);
// Phase 7+: app.use('/api/interviews', authenticate, interviewsRouter);
// Phase 11+: app.use('/api/analytics', authenticate, analyticsRouter);

// ── 8. 404 handler ────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND'));
});

// ── 9. Global error handler (MUST be last) ────────────────────────────────────
app.use(errorHandler);

export default app;
