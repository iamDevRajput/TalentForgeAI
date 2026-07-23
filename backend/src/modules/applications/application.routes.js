import express from 'express';
import multer from 'multer';
import {
  submitApplication,
  getMyApplications,
  getJobApplications,
  updateStage,
} from './application.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/rbac.js';
import { validateApplicationSubmit, validateApplicationStage } from './application.validator.js';

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
  submitApplication
);

// HR routes
router.get('/job/:jobId', authorize('hr'), getJobApplications);

router.patch(
  '/:id/stage',
  authorize('hr'),
  validateApplicationStage,
  updateStage
);

export default router;
