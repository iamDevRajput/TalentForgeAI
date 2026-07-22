import { z } from 'zod';

export const scheduleInterviewSchema = z.object({
  applicationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid application ID'),
  interviewerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid interviewer ID'),
  scheduledAt: z.string().datetime({ message: 'Invalid ISO date string' }),
  durationMinutes: z.number().min(15).max(240).default(60),
  meetingLink: z.string().url().optional().or(z.literal('')),
});

export const submitFeedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  notes: z.string().min(10, 'Feedback must be at least 10 characters'),
});
