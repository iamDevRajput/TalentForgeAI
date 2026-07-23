/**
 * job.validator.js — Zod schemas for job endpoints
 *
 * WHY Zod here:
 *   Validates incoming job payloads at the controller boundary, ensuring
 *   malformed data is rejected with a 422 before hitting the service layer.
 */

import { z } from 'zod';

export const createJobSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(150, 'Title must be at most 150 characters'),
  department: z
    .string({ required_error: 'Department is required' })
    .trim()
    .min(1, 'Department cannot be empty'),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(1, 'Description cannot be empty'),
  requirements: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Requirement cannot be empty')
    )
    .optional()
    .default([]),
  companyName: z.string().trim().optional(),
  companyLogo: z.string().url().optional().or(z.literal('')),
  location: z.string().trim().optional(),
  workplaceType: z.enum(['Remote', 'Hybrid', 'Onsite']).optional(),
  employmentType: z.enum(['Full-time', 'Part-time', 'Internship', 'Contract']).optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  salaryCurrency: z.string().trim().optional(),
  experienceLevel: z.enum(['Entry', 'Mid', 'Senior']).optional(),
  applicationDeadline: z.string().datetime().optional(),
});

export const updateJobStatusSchema = z.object({
  status: z.enum(['draft', 'open', 'closed'], {
    required_error: 'Status is required',
    invalid_type_error: "Status must be 'draft', 'open', or 'closed'",
  }),
});

// For general updates, we reuse the create schema but make all fields optional
// Status cannot be updated via this schema per the service layer rules.
export const updateJobSchema = createJobSchema.partial();
