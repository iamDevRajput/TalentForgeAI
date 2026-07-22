/**
 * auth.validator.js — Zod schemas for auth endpoints
 *
 * WHY Zod here (not just Mongoose validation):
 *   Mongoose validation runs at the DB layer — it's too late to give a good
 *   client error about a missing field. Zod validates at the controller entry
 *   point, before any DB operation, giving field-level 422 responses.
 */

import { z } from 'zod';

export const registerCandidateSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    ),
});

/**
 * HR/Interviewer creation — called by an authenticated HR user via the invite flow.
 * Adds a `role` field that the public registration endpoint doesn't accept.
 */
export const registerStaffSchema = registerCandidateSchema.extend({
  role: z.enum(['hr', 'interviewer'], {
    required_error: 'Role is required for staff accounts',
    invalid_type_error: "Role must be 'hr' or 'interviewer'",
  }),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address')
    .toLowerCase(),
  password: z.string({ required_error: 'Password is required' }),
});
