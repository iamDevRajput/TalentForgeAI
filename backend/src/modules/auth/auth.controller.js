/**
 * auth.controller.js — HTTP layer for auth routes
 *
 * Controllers are intentionally thin:
 *   1. Parse and validate the request body (using Zod schema)
 *   2. Call the appropriate service function
 *   3. Format and send the HTTP response
 *
 * No business logic here. If you find yourself writing an `if` that isn't
 * about HTTP (e.g. not about status codes), it belongs in auth.service.js.
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  registerCandidateSchema,
  registerStaffSchema,
  loginSchema,
} from './auth.validator.js';
import {
  registerCandidate,
  registerStaff,
  login,
  getMe,
  signToken,
  getCookieOptions,
} from './auth.service.js';

/**
 * POST /api/auth/register
 * Public — creates a candidate account.
 */
export const registerCandidateHandler = asyncHandler(async (req, res) => {
  const data = registerCandidateSchema.parse(req.body);
  const user = await registerCandidate(data);
  const token = signToken(user);

  res.cookie('accessToken', token, getCookieOptions());

  res.status(201).json({
    success: true,
    data: { user, token },
  });
});

/**
 * POST /api/auth/register/staff
 * Protected — HR only. Creates an HR or Interviewer account.
 */
export const registerStaffHandler = asyncHandler(async (req, res) => {
  const data = registerStaffSchema.parse(req.body);
  const user = await registerStaff(data, req.user.role);
  // No cookie for staff creation — HR is creating an account for someone else

  res.status(201).json({
    success: true,
    data: { user },
    message: `${data.role} account created successfully`,
  });
});

/**
 * POST /api/auth/login
 * Public — validates credentials, issues JWT in httpOnly cookie.
 */
export const loginHandler = asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body);
  const { user, token } = await login(data);

  res.cookie('accessToken', token, getCookieOptions());

  res.status(200).json({
    success: true,
    data: { user, token },
  });
});

/**
 * POST /api/auth/logout
 * Clears the auth cookie. Stateless — no server-side session to invalidate.
 * (Token blacklisting is a Phase 13 concern if needed.)
 */
export const logoutHandler = asyncHandler(async (_req, res) => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * GET /api/auth/me
 * Protected — returns the authenticated user's profile.
 */
export const getMeHandler = asyncHandler(async (req, res) => {
  const user = await getMe(req.user.id);

  res.status(200).json({
    success: true,
    data: { user },
  });
});
