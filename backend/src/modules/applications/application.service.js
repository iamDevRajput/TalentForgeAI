import Application from '../../models/Application.js';
import Job from '../../models/Job.js';
import AuditLog from '../../models/AuditLog.js';
import { AppError } from '../../utils/AppError.js';
import { uploadResumeToCloudinary } from '../uploads/upload.service.js';

/**
 * Creates an application (Candidate only)
 */
export const createApplication = async (jobId, candidateId, callerRole, fileBuffer, originalName, mimeType, sizeBytes) => {
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
      resume: {
        url: uploadResult.secure_url,
        originalFilename: originalName,
        mimeType: mimeType || 'application/pdf',
        sizeBytes: sizeBytes || uploadResult.bytes || fileBuffer.length,
        uploadedAt: uploadResult.created_at || new Date()
      },
      status: 'applied',
    });

    await AuditLog.create({
      actorId: candidateId,
      action: 'UPDATE_APPLICATION_STAGE',
      entityType: 'application',
      entityId: application._id,
      metadata: {
        from: null,
        to: 'applied',
        notes: 'Application submitted'
      }
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

/**
 * Valid allowed transitions for the Kanban pipeline
 */
const ALLOWED_TRANSITIONS = {
  applied: ['screening', 'rejected'],
  screening: ['interviewing', 'rejected'],
  interviewing: ['offered', 'rejected'],
  offered: ['hired', 'rejected'],
  hired: [], // Terminal
  rejected: [], // Terminal
};

/**
 * Updates an application's stage (HR only)
 */
export const updateApplicationStage = async (applicationId, callerId, callerRole, newStatus, notes) => {
  if (callerRole !== 'hr') {
    throw new AppError("Role 'candidate' is not permitted to access this resource", 403);
  }

  const application = await Application.findById(applicationId);
  if (!application) {
    throw new AppError('Application not found', 404);
  }

  const currentStatus = application.status;
  
  if (currentStatus === 'hired' || currentStatus === 'rejected') {
    throw new AppError(`Cannot transition from terminal state: ${currentStatus}`, 400);
  }

  const allowedNextStates = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowedNextStates.includes(newStatus)) {
    throw new AppError(`Invalid transition from ${currentStatus} to ${newStatus}`, 400);
  }

  application.status = newStatus;
  
  await application.save();

  await AuditLog.create({
    actorId: callerId,
    action: 'UPDATE_APPLICATION_STAGE',
    entityType: 'application',
    entityId: application._id,
    metadata: {
      from: currentStatus,
      to: newStatus,
      notes: notes || `Moved to ${newStatus}`
    }
  });

  return application;
};

