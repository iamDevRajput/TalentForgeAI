/**
 * auth.service.js — Auth business logic
 *
 * Controllers are thin (parse request, call service, format response).
 * All business rules live here:
 *   - Password hashing (delegated to User model pre-save hook)
 *   - JWT issuance
 *   - Role-based registration guard
 *   - Login credential verification
 *
 * This layer has no knowledge of HTTP — it doesn't touch req/res.
 * This makes it fully testable without an HTTP server.
 */

import jwt from 'jsonwebtoken';
import User from '../../models/User.js';
import { env } from '../../config/env.js';
import { AppError, conflict, unauthorized, forbidden } from '../../utils/AppError.js';

// ── JWT helpers ──────────────────────────────────────────────────────────────

/**
 * Issues a signed JWT with the minimum payload needed to enforce RBAC.
 * WHY sub/email/role only: JWT payload is visible to anyone who decodes it
 * (even if unverifiable without the secret). Minimise PII exposure.
 */
export function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN },
  );
}

/**
 * Returns cookie options appropriate to the current environment.
 * httpOnly: XSS cannot read this cookie via document.cookie
 * secure: only sent over HTTPS (enforced in production)
 * sameSite: CSRF protection — browser won't include cookie on cross-origin requests
 */
export function getCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000, // days → ms
  };
}

// ── Service functions ────────────────────────────────────────────────────────

/**
 * Register a candidate (public endpoint — no auth required).
 * Returns the new user document (without passwordHash).
 */
export async function registerCandidate({ name, email, password }) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw conflict('An account with this email already exists', 'EMAIL_TAKEN');
  }

  const user = await User.create({
    name,
    email,
    passwordHash: password, // Pre-save hook hashes this
    role: 'candidate',       // Hard-coded — public registration always creates candidates
  });

  return user;
}

/**
 * Register HR or Interviewer staff (requires the caller to be an HR user).
 * Called from a protected route: authenticate + authorize('hr') run first.
 */
export async function registerStaff({ name, email, password, role }, callerRole) {
  if (callerRole !== 'hr') {
    throw forbidden('Only HR users can create staff accounts');
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw conflict('An account with this email already exists', 'EMAIL_TAKEN');
  }

  const user = await User.create({ name, email, passwordHash: password, role });
  return user;
}

/**
 * Verify credentials and return the user + a signed token.
 * Deliberately returns the same error message for wrong email AND wrong password
 * — prevents user enumeration attacks.
 */
export async function login({ email, password }) {
  // select('+passwordHash') overrides the field's select:false setting
  const user = await User.findOne({ email, isActive: true }).select('+passwordHash');

  if (!user) {
    throw unauthorized('Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw unauthorized('Invalid email or password');
  }

  const token = signToken(user);
  return { user, token };
}

/**
 * Returns the authenticated user's profile.
 * Used by GET /api/auth/me — reads from DB to get fresh data (role changes, etc.)
 */
export async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  return user;
}
