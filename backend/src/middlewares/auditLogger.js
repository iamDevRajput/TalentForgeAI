/**
 * auditLogger.js — Audit log middleware (interface locked; DB writes in Phase 5)
 *
 * WHY stub now: Phase 5 (pipeline/stage transitions) introduces the highest-
 * volume write path — that's where full audit logging is activated. But locking
 * the interface here means Phase 2–4 code can already import and call
 * `withAudit(...)` without a breaking change later.
 *
 * When Phase 5 activates this, the AuditLog.create() call replaces the
 * logger.debug() call below — controller code doesn't change at all.
 *
 * Usage:
 *   router.patch('/applications/:id/stage',
 *     authenticate,
 *     authorize('hr'),
 *     withAudit('stage_changed', 'application'),
 *     handler
 *   )
 */

import logger from '../config/logger.js';
import AuditLog from '../models/AuditLog.js';

/**
 * Middleware factory. Wraps a state-changing route to record an audit entry.
 *
 * @param {string} action      e.g. 'stage_changed', 'interview_scheduled'
 * @param {string} entityType  e.g. 'application', 'interview', 'job'
 * @param {Function} [getEntityId]  Optional fn(req) => ObjectId. Defaults to req.params.id.
 */
export const withAudit = (action, entityType, getEntityId) => async (req, res, next) => {
  // Store original res.json to intercept after successful response
  const originalJson = res.json.bind(res);

  res.json = async (body) => {
    // Only log on successful state-changing responses (2xx)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      let entityId = req.params.id;
      if (getEntityId) {
        entityId = getEntityId(req, body);
      } else if (!entityId && body?.data?.job?._id) {
        entityId = body.data.job._id;
      }

      const auditEntry = {
        actorId: req.user?.id,
        action,
        entityType,
        entityId,
        metadata: {
          body: req.body, // what was sent
          params: req.params,
        },
        timestamp: new Date(),
      };

      // Log to DB for Phase 2+ (Jobs and beyond)
      await AuditLog.create(auditEntry);
      logger.debug(`[AUDIT CREATED] ${JSON.stringify(auditEntry)}`);
    }

    return originalJson(body);
  };

  next();
};
