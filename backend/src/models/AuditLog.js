/**
 * AuditLog.js — Append-only audit log schema
 *
 * Design constraints (from PRD):
 *   - Append-only: no updates, no deletes. Ever.
 *   - Must record: who (actorId), what (action + entityType/Id), when (timestamp),
 *     and metadata (before/after values for reversibility analysis).
 *
 * This schema is finalised in Phase 1 so its shape is locked before any
 * state-changing routes are added in Phase 2+. The auditLogger middleware
 * stub already references this model's shape.
 *
 * MongoDB TTL note: do NOT add a TTL index here. Audit logs are permanent
 * records. If storage becomes a concern, archive to cold storage externally.
 */

import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      // nullable for system-generated actions (e.g. cron jobs)
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      // e.g. 'stage_changed', 'interview_scheduled', 'job_created', 'email_sent'
      index: true,
    },
    entityType: {
      type: String,
      required: [true, 'Entity type is required'],
      enum: ['job', 'application', 'interview', 'user', 'feedback', 'email'],
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Entity ID is required'],
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      // Stores before/after values for state changes, request body for creates, etc.
    },
    ipAddress: {
      type: String,
      // Populated from req.ip when available
    },
    userAgent: {
      type: String,
      // Populated from req.headers['user-agent']
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    // No updatedAt — this is an append-only log
    timestamps: { createdAt: true, updatedAt: false },
    // Disable Mongoose's version key — not needed for append-only
    versionKey: false,
  },
);

// ── Compound indexes for common query patterns ────────────────────────────────
auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 }); // "history of this entity"
auditLogSchema.index({ actorId: 1, timestamp: -1 });                  // "what did this user do"

// ── Guard against updates (enforce append-only at the ODM level) ──────────────
auditLogSchema.pre('findOneAndUpdate', function () {
  throw new Error('AuditLog is append-only. Use AuditLog.create() instead.');
});
auditLogSchema.pre('updateOne', function () {
  throw new Error('AuditLog is append-only. Use AuditLog.create() instead.');
});
auditLogSchema.pre('updateMany', function () {
  throw new Error('AuditLog is append-only. Use AuditLog.create() instead.');
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
