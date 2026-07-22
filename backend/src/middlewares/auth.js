/**
 * auth.js middleware — JWT verification
 *
 * Token source priority:
 *   1. httpOnly cookie `accessToken` (browser clients — XSS-safe)
 *   2. Authorization: Bearer <token> header (API clients, Postman, mobile)
 *
 * On success: attaches req.user = { id, email, role } and calls next()
 * On failure: returns 401 — no stack trace, no token detail in response
 */

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { unauthorized } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  // 1. Extract token
  let token = req.cookies?.accessToken;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    throw unauthorized('No authentication token provided');
  }

  // 2. Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw unauthorized('Token has expired');
    }
    throw unauthorized('Invalid authentication token');
  }

  // 3. Attach minimal user context (no DB round-trip here — role is in the JWT)
  // The JWT payload is signed, so role cannot be forged without the secret.
  // A DB call on every request would add latency; we only need fresh DB data
  // on routes that require the full user document (handled in those controllers).
  req.user = {
    id: decoded.sub,
    email: decoded.email,
    role: decoded.role,
  };

  next();
});
