import express from 'express';
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  updateJobStatus,
} from './job.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/rbac.js';
import { withAudit } from '../../middlewares/auditLogger.js';

const router = express.Router();

// All job routes require authentication
router.use(authenticate);

// Public (Authenticated) routes - both Candidate and HR can access
// Service layer handles specific visibility rules
router.get('/', getJobs);
router.get('/:id', getJobById);

// HR Only routes
// WHY: We enforce authorize('hr') at the route level to block immediately,
// and the service layer also re-verifies this to ensure complete boundary security.
router.post('/', authorize('hr'), withAudit('CREATE_JOB', 'job'), createJob);
router.patch('/:id', authorize('hr'), withAudit('UPDATE_JOB', 'job'), updateJob);
router.patch('/:id/status', authorize('hr'), withAudit('UPDATE_JOB_STATUS', 'job'), updateJobStatus);

export default router;
