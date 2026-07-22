import { Interview } from '../../models/Interview.js';
import Application from '../../models/Application.js';
import User from '../../models/User.js';
import { notFound, badRequest, forbidden } from '../../utils/AppError.js';
import * as applicationService from '../applications/application.service.js';

export async function scheduleInterview(data, hrId) {
  const { applicationId, interviewerId, scheduledAt, durationMinutes, meetingLink } = data;

  // Verify application exists
  const application = await Application.findById(applicationId);
  if (!application) {
    throw notFound('Application not found');
  }

  // Verify interviewer exists and has role 'interviewer'
  const interviewer = await User.findOne({ _id: interviewerId, role: 'interviewer' });
  if (!interviewer) {
    throw badRequest('Interviewer not found or invalid role');
  }

  // Create the interview
  const interview = await Interview.create({
    applicationId,
    interviewerId,
    scheduledAt,
    durationMinutes,
    meetingLink,
    status: 'scheduled',
  });

  // Automatically update the application stage to 'interviewing' if it is not already
  if (application.status !== 'interviewing' && application.status !== 'offered' && application.status !== 'hired' && application.status !== 'rejected') {
    await applicationService.updateApplicationStage(
      applicationId,
      hrId,
      'hr',
      'interviewing',
      `Interview scheduled with ${interviewer.name}`
    );
  }

  return interview.populate([
    { path: 'interviewerId', select: 'name email' },
    {
      path: 'applicationId',
      populate: [
        { path: 'candidateId', select: 'name email' },
        { path: 'jobId', select: 'title department' }
      ]
    }
  ]);
}

export async function getInterviewsByApplication(applicationId) {
  return await Interview.find({ applicationId })
    .populate('interviewerId', 'name email')
    .sort({ scheduledAt: 1 });
}

export async function getMyInterviews(interviewerId) {
  return await Interview.find({ interviewerId })
    .populate({
      path: 'applicationId',
      populate: [
        { path: 'candidateId', select: 'name email' },
        { path: 'jobId', select: 'title department' }
      ]
    })
    .sort({ scheduledAt: 1 });
}

export async function submitFeedback(interviewId, interviewerId, data) {
  const interview = await Interview.findById(interviewId);
  if (!interview) {
    throw notFound('Interview not found');
  }

  if (interview.interviewerId.toString() !== interviewerId.toString()) {
    throw forbidden('Only the assigned interviewer can submit feedback');
  }

  if (interview.status === 'completed') {
    throw badRequest('Feedback has already been submitted for this interview');
  }

  interview.feedback = {
    rating: data.rating,
    notes: data.notes,
    submittedAt: new Date(),
  };
  interview.status = 'completed';
  
  await interview.save();
  return interview;
}
