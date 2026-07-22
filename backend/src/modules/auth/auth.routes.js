/**
 * auth.routes.js — Auth route definitions
 *
 * Separation of routes from controllers allows:
 *   - Routes to be tested for 404s without loading controller logic
 *   - Clean middleware chain declaration in one place
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/rbac.js';
import {
  registerCandidateHandler,
  registerStaffHandler,
  loginHandler,
  logoutHandler,
  getMeHandler,
} from './auth.controller.js';

const router = Router();

// ── Public routes ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Candidate self-registration. No auth required.
 */
router.post('/register', registerCandidateHandler);

/**
 * POST /api/auth/login
 * All roles. Returns JWT in httpOnly cookie.
 */
router.post('/login', loginHandler);

// ── Protected routes ──────────────────────────────────────────────────────────

/**
 * POST /api/auth/register/staff
 * HR-only. Creates HR or Interviewer accounts.
 * Path is /register/staff to group it semantically with /register.
 */
router.post(
  '/register/staff',
  authenticate,
  authorize('hr'),
  registerStaffHandler,
);

/**
 * POST /api/auth/logout
 * All authenticated roles.
 */
router.post('/logout', authenticate, logoutHandler);

/**
 * GET /api/auth/me
 * All authenticated roles. Returns current user profile.
 */
router.get('/me', authenticate, getMeHandler);

export default router;
