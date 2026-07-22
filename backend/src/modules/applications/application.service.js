import Application from '../../models/Application.js';
import Job from '../../models/Job.js';
import { AppError } from '../../utils/AppError.js';
import { uploadResumeToCloudinary } from '../uploads/upload.service.js';

/**
 * Creates an application (Candidate only)
 */
export const createApplication = async (jobId, candidateId, callerRole, fileBuffer, originalName) => {
  if (callerRole !== 'candidate') {
    throw new AppError("Role 'hr' is not permitted to access this resource", 403);
  }

  // Business rule check: target job must have status "open"
  // If draft or closed, return 404 to match information-hiding pattern
  const job = await Job.findById(jobId);
  if (!job || job.status !== 'open') {
    throw new AppError('Job not found', 404);
  }

  // Upload to Cloudinary
  const uploadResult = await uploadResumeToCloudinary(fileBuffer, originalName);

  try {
    const application = await Application.create({
      jobId,
      candidateId,
      resumeUrl: uploadResult.secure_url,
      status: 'applied',
    });

    return application;
  } catch (err) {
    // Rely on the DB unique index to catch duplicates
    if (err.code === 11000) {
      throw new AppError('You have already applied to this job', 409);
    }
    throw err;
  }
};

/**
 * Gets candidate's own applications
 */
export const getMyApplications = async (candidateId, callerRole) => {
  if (callerRole !== 'candidate') {
    throw new AppError('Forbidden', 403);
  }

  const applications = await Application.find({ candidateId })
    .populate('jobId', 'title department status')
    .sort({ createdAt: -1 });
  
  return applications;
};

/**
 * Gets all applications for a specific job (HR only)
 */
export const getJobApplications = async (jobId, callerRole) => {
  if (callerRole !== 'hr') {
    throw new AppError('Forbidden', 403);
  }

  const applications = await Application.find({ jobId })
    .populate('candidateId', 'name email')
    .sort({ createdAt: -1 });

  return applications;
};
