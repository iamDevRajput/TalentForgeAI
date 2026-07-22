/**
 * asyncHandler.js — Wraps async route handlers to forward errors to next()
 *
 * WHY: Without this wrapper, any unhandled promise rejection in an async
 * route handler silently crashes the request (Express 4 doesn't catch async
 * errors automatically). This wrapper makes the correct pattern the easy path
 * — developers never need to write try/catch in controllers.
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => { ... }))
 *
 * Note: Express 5 handles this natively — this wrapper will become a no-op
 * when we upgrade. That's intentional: no controller code needs to change.
 */

/**
 * @param {Function} fn  Async route handler (req, res, next) => Promise<void>
 * @returns {Function}   Standard Express middleware
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
