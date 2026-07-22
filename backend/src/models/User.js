/**
 * User.js — Mongoose schema for all user types
 *
 * WHY one collection:
 *   Auth logic (login, JWT issuance, password reset) is identical across roles.
 *   Splitting into hrUsers/interviewerUsers/candidateUsers would duplicate that
 *   logic three times and make cross-role queries (analytics) painful.
 *   Role-specific data lives in separate linked collections (candidateProfiles,
 *   etc.) that are added in later phases.
 *
 * HR/Interviewer accounts: can only be created by an existing HR user.
 *   Enforced in auth.service.js — not in this schema (schema doesn't know the
 *   caller's context).
 *
 * Candidate accounts: self-registerable via POST /api/auth/register.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12; // bcrypt work factor — 12 is the current OWASP recommendation

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Never returned in queries by default — must be explicitly requested
    },
    role: {
      type: String,
      enum: {
        values: ['hr', 'interviewer', 'candidate'],
        message: 'Role must be hr, interviewer, or candidate',
      },
      default: 'candidate',
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must be at most 100 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
    // Never return passwordHash in toJSON output (belt-and-suspenders with select: false)
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// ── Instance methods ─────────────────────────────────────────────────────────

/**
 * Compare a plain-text password against the stored hash.
 * NOTE: passwordHash is select:false — the calling code must explicitly
 * include it: User.findOne({ email }).select('+passwordHash')
 */
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// ── Pre-save hook ────────────────────────────────────────────────────────────

userSchema.pre('save', async function (next) {
  // Only hash when the password field is actually being changed
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, SALT_ROUNDS);
  next();
});

// ── Compound index for analytics queries ─────────────────────────────────────
userSchema.index({ role: 1, createdAt: -1 });

const User = mongoose.model('User', userSchema);

export default User;
