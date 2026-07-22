import * as jobService from './job.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  createJobSchema,
  updateJobSchema,
  updateJobStatusSchema,
} from './job.validator.js';


/**
 * @desc    Create a new job
 * @route   POST /api/jobs
 * @access  Private (HR)
 */
export const createJob = asyncHandler(async (req, res) => {
  // Validate request body
  const parsedData = createJobSchema.parse(req.body);

  const job = await jobService.createJob(
    parsedData,
    req.user.role,
    req.user.id
  );

  res.status(201).json({
    status: 'success',
    data: { job },
  });
});

/**
 * @desc    Get all jobs (paginated)
 * @route   GET /api/jobs
 * @access  Private
 */
export const getJobs = asyncHandler(async (req, res) => {
  const result = await jobService.getJobs(req.query, req.user.role);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

/**
 * @desc    Get single job by ID
 * @route   GET /api/jobs/:id
 * @access  Private
 */
export const getJobById = asyncHandler(async (req, res) => {
  const job = await jobService.getJobById(req.params.id, req.user.role);

  res.status(200).json({
    status: 'success',
    data: { job },
  });
});

/**
 * @desc    Update a job's details
 * @route   PATCH /api/jobs/:id
 * @access  Private (HR)
 */
export const updateJob = asyncHandler(async (req, res) => {
  const parsedData = updateJobSchema.parse(req.body);

  const job = await jobService.updateJob(
    req.params.id,
    parsedData,
    req.user.role
  );

  res.status(200).json({
    status: 'success',
    data: { job },
  });
});

/**
 * @desc    Update a job's status
 * @route   PATCH /api/jobs/:id/status
 * @access  Private (HR)
 */
export const updateJobStatus = asyncHandler(async (req, res) => {
  const { status } = updateJobStatusSchema.parse(req.body);

  const job = await jobService.updateJobStatus(
    req.params.id,
    status,
    req.user.role
  );

  res.status(200).json({
    status: 'success',
    data: { job },
  });
});
