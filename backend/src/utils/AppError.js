/**
 * AppError.js — Custom application error class
 *
 * WHY a custom class: Express's global error handler needs to distinguish
 * between "errors we deliberately threw" (AppError) and "unexpected crashes"
 * (plain Error). The former gets the statusCode and code we set; the latter
 * always becomes a 500 so we never leak internals.
 *
 * Usage:
 *   throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
 */

export class AppError extends Error {
  /**
   * @param {string} message  Human-readable message (safe to expose to client)
   * @param {number} statusCode  HTTP status code
   * @param {string} [code]  Machine-readable code for client error handling
   */
  constructor(message, statusCode, code) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code || `HTTP_${statusCode}`;
    this.isOperational = true; // Flag: safe to expose details
    Error.captureStackTrace(this, this.constructor);
  }
}

// ── Common factory shortcuts ─────────────────────────────────────────────────

export const notFound = (resource = 'Resource') =>
  new AppError(`${resource} not found`, 404, 'NOT_FOUND');

export const unauthorized = (msg = 'Authentication required') =>
  new AppError(msg, 401, 'UNAUTHENTICATED');

export const forbidden = (msg = 'Access denied') =>
  new AppError(msg, 403, 'FORBIDDEN');

export const conflict = (msg, code = 'CONFLICT') =>
  new AppError(msg, 409, code);

export const badRequest = (msg, code = 'BAD_REQUEST') =>
  new AppError(msg, 400, code);
