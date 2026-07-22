import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/rbac.js';
import {
  scheduleInterviewHandler,
  getInterviewsByApplicationHandler,
  getMyInterviewsHandler,
  submitFeedbackHandler,
} from './interview.controller.js';

const router = Router();

// Protect all routes
router.use(authenticate);

// HR only: Schedule an interview
router.post('/schedule', authorize('hr'), scheduleInterviewHandler);

// HR and Interviewer: View interviews for an application
router.get('/application/:applicationId', authorize('hr', 'interviewer'), getInterviewsByApplicationHandler);

// Interviewer only: View own interviews
router.get('/my', authorize('interviewer'), getMyInterviewsHandler);

// Interviewer only: Submit feedback
router.post('/:id/feedback', authorize('interviewer'), submitFeedbackHandler);

export default router;
