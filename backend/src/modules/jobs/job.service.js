import Job from '../../models/Job.js';
import { AppError } from '../../utils/AppError.js';

/**
 * Creates a new job.
 * @param {Object} data - Job data
 * @param {string} callerRole - Role of the user attempting to create
 * @param {string} callerId - ID of the creator
 * @returns {Object} Created job document
 */
export const createJob = async (data, callerRole, callerId) => {
  // Service-layer RBAC: Only HR can create jobs
  if (callerRole !== 'hr') {
    throw new AppError('Only HR personnel can create jobs', 403);
  }

  const job = new Job({
    ...data,
    createdBy: callerId,
    status: 'draft', // Ensure it always starts as draft regardless of payload
  });

  await job.save();
  return job;
};

/**
 * Retrieves a paginated list of jobs.
 * @param {Object} options - Pagination and filter options (page, limit)
 * @param {string} callerRole - Role of the requesting user
 * @returns {Object} { jobs, total, page, limit }
 */
export const getJobs = async ({ page = 1, limit = 10 }, callerRole) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  // Cap max limit at 100 to prevent large data dumps
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  // Build query based on role
  // WHY: We conditionally build the Mongoose query rather than filtering post-fetch
  // to ensure pagination is accurate and memory is preserved.
  const query = {};
  if (callerRole === 'candidate') {
    query.status = 'open';
  }

  const [jobs, total] = await Promise.all([
    // Default sorting is newest first
    Job.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Job.countDocuments(query),
  ]);

  // Strip createdBy for candidates at the service level
  if (callerRole === 'candidate') {
    jobs.forEach(job => {
      delete job.createdBy;
    });
  }

  return {
    jobs,
    total,
    page: pageNum,
    limit: limitNum,
  };
};

/**
 * Retrieves a single job by ID.
 * @param {string} jobId - ID of the job
 * @param {string} callerRole - Role of the requesting user
 * @returns {Object} Job document
 */
export const getJobById = async (jobId, callerRole) => {
  const job = await Job.findById(jobId).lean();

  if (!job) {
    throw new AppError('Job not found', 404);
  }

  // Candidates can only see 'open' jobs. If they request a draft/closed job,
  // we return 404 instead of 403 to avoid leaking the existence of restricted jobs.
  if (callerRole === 'candidate' && job.status !== 'open') {
    throw new AppError('Job not found', 404);
  }

  // Strip createdBy for candidates
  if (callerRole === 'candidate') {
    delete job.createdBy;
  }

  return job;
};

/**
 * Updates a job's status.
 * @param {string} jobId - ID of the job
 * @param {string} newStatus - The new status to transition to
 * @param {string} callerRole - Role of the requesting user
 * @returns {Object} Updated job document
 */
export const updateJobStatus = async (jobId, newStatus, callerRole) => {
  if (callerRole !== 'hr') {
    throw new AppError('Only HR personnel can update job statuses', 403);
  }

  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError('Job not found', 404);
  }

  // State Machine Validation
  // Valid transitions: draft -> open, open -> closed
  const currentStatus = job.status;

  if (currentStatus === 'draft' && newStatus !== 'open') {
    throw new AppError('Draft jobs can only be transitioned to open', 422);
  }
  if (currentStatus === 'open' && newStatus !== 'closed') {
    throw new AppError('Open jobs can only be transitioned to closed', 422);
  }
  if (currentStatus === 'closed') {
    throw new AppError('Closed jobs cannot change status', 422);
  }

  job.status = newStatus;
  await job.save();
  
  return job;
};

/**
 * Updates job details.
 * @param {string} jobId - ID of the job
 * @param {Object} updates - Details to update
 * @param {string} callerRole - Role of the requesting user
 * @returns {Object} Updated job document
 */
export const updateJob = async (jobId, updates, callerRole) => {
  if (callerRole !== 'hr') {
    throw new AppError('Only HR personnel can update jobs', 403);
  }

  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError('Job not found', 404);
  }

  // Business Rule: Closed jobs are locked and cannot be edited.
  if (job.status === 'closed') {
    throw new AppError('Cannot edit a closed job', 400);
  }

  // Strip out status updates from this generic update method 
  // (status must be updated via updateJobStatus)
  delete updates.status;
  delete updates.createdBy;

  Object.assign(job, updates);
  await job.save();

  return job;
};
