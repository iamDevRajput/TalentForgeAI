import { asyncHandler } from '../../utils/asyncHandler.js';
import * as interviewService from './interview.service.js';
import { scheduleInterviewSchema, submitFeedbackSchema } from './interview.validator.js';

export const scheduleInterviewHandler = asyncHandler(async (req, res) => {
  const data = scheduleInterviewSchema.parse(req.body);
  const interview = await interviewService.scheduleInterview(data, req.user.id);

  res.status(201).json({
    success: true,
    data: { interview },
  });
});

export const getInterviewsByApplicationHandler = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const interviews = await interviewService.getInterviewsByApplication(applicationId);

  res.status(200).json({
    success: true,
    data: { interviews },
  });
});

export const getMyInterviewsHandler = asyncHandler(async (req, res) => {
  const interviews = await interviewService.getMyInterviews(req.user.id);

  res.status(200).json({
    success: true,
    data: { interviews },
  });
});

export const submitFeedbackHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = submitFeedbackSchema.parse(req.body);
  const interview = await interviewService.submitFeedback(id, req.user.id, data);

  res.status(200).json({
    success: true,
    data: { interview },
  });
});
