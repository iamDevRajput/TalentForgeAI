/**
 * rbac.js middleware — Role-Based Access Control
 *
 * WHY middleware (not inline checks): Centralised role enforcement means a
 * role change in one place applies everywhere. Inline `if (req.user.role !== 'hr')`
 * checks scatter the policy and make auditing impossible.
 *
 * Usage:
 *   router.get('/admin-route', authenticate, authorize('hr'), handler)
 *   router.get('/shared-route', authenticate, authorize('hr', 'interviewer'), handler)
 *
 * Enforcement note per PRD NFR:
 *   This middleware enforces role at the route level. Ownership checks
 *   (e.g. "interviewer can only see their own interviews") are enforced at
 *   the query-construction level inside the service layer — not here and
 *   not client-side.
 */

import { forbidden } from '../utils/AppError.js';

/**
 * Returns a middleware that allows only the specified roles.
 * Must be used AFTER the `authenticate` middleware (which sets req.user).
 *
 * @param {...string} allowedRoles  One or more of: 'hr', 'interviewer', 'candidate'
 * @returns {Function}  Express middleware
 */
export const authorize = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) {
    // Shouldn't happen if authenticate runs first, but guard defensively
    return next(forbidden('Authentication required before authorization'));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(
      forbidden(`Role '${req.user.role}' is not permitted to access this resource`),
    );
  }

  next();
};
