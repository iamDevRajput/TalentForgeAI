/**
 * errorHandler.js — Global Express error handler
 *
 * Rules:
 *   - AppError (isOperational=true): expose message and code to client
 *   - ZodError: 422 with field-level errors (from validation middleware)
 *   - Mongoose ValidationError: 422 with field-level errors
 *   - Mongoose CastError (bad ObjectId): 400
 *   - Mongoose duplicate key (code 11000): 409
 *   - Everything else: 500, generic message in production (no stack leak)
 *
 * This must be the LAST middleware registered in app.js (after all routes).
 */

import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';
import logger from '../config/logger.js';
import { env } from '../config/env.js';

/**
 * Formats a ZodError into a client-friendly array of field errors.
 */
function formatZodError(err) {
  return err.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

/**
 * Formats a Mongoose ValidationError into a client-friendly array.
 */
function formatMongooseValidationError(err) {
  return Object.values(err.errors).map((e) => ({
    field: e.path,
    message: e.message,
  }));
}

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  // Always log the full error server-side
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.id,
  });

  // ── ZodError ────────────────────────────────────────────────────────────────
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        fields: formatZodError(err),
      },
    });
  }

  // ── Mongoose Validation ──────────────────────────────────────────────────────
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Database validation failed',
        fields: formatMongooseValidationError(err),
      },
    });
  }

  // ── Mongoose CastError (bad ObjectId in URL params) ──────────────────────────
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: `Invalid ${err.path}: '${err.value}'`,
      },
    });
  }

  // ── MongoDB Duplicate Key ────────────────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_KEY',
        message: `A record with this ${field} already exists`,
      },
    });
  }

  // ── AppError (operational, safe to expose) ───────────────────────────────────
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // ── Unhandled / unexpected error ─────────────────────────────────────────────
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err.message, // Expose in development for faster debugging
      ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
};
