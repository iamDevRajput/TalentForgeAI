import * as applicationService from './application.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const submitApplication = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const candidateId = req.user.id;
  const callerRole = req.user.role;
  const fileBuffer = req.file.buffer;
  const originalName = req.file.originalname;

  const application = await applicationService.createApplication(
    jobId,
    candidateId,
    callerRole,
    fileBuffer,
    originalName
  );

  res.status(201).json({
    status: 'success',
    data: { application },
  });
});

export const getMyApplications = asyncHandler(async (req, res) => {
  const candidateId = req.user.id;
  const callerRole = req.user.role;

  const applications = await applicationService.getMyApplications(candidateId, callerRole);

  res.status(200).json({
    status: 'success',
    data: { applications },
  });
});

export const getJobApplications = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const callerRole = req.user.role;

  const applications = await applicationService.getJobApplications(jobId, callerRole);

  res.status(200).json({
    status: 'success',
    data: { applications },
  });
});
