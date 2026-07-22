import express from 'express';
import multer from 'multer';
import {
  submitApplication,
  getMyApplications,
  getJobApplications,
} from './application.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/rbac.js';
import { validateApplicationSubmit } from './application.validator.js';
import { withAudit } from '../../middlewares/auditLogger.js';

const router = express.Router();

// Setup Multer to store uploaded file in memory
// We don't limit file size here because we want Zod to throw the specific 422 error
const upload = multer({
  storage: multer.memoryStorage(),
});

// Protect all routes
router.use(authenticate);

// Candidate routes
router.get('/my', authorize('candidate'), getMyApplications);

router.post(
  '/:jobId',
  authorize('candidate'),
  upload.single('resume'),
  validateApplicationSubmit,
  withAudit('SUBMIT_APPLICATION', 'application', (req, resBody) => resBody?.data?.application?._id),
  submitApplication
);

// HR routes
router.get('/job/:jobId', authorize('hr'), getJobApplications);

export default router;
