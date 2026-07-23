import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { jobApi } from './jobApi';
import { X, Plus, Loader2 } from 'lucide-react';

const createJobSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(150, 'Title must be at most 150 characters'),
  department: z.string().min(1, 'Department is required'),
  description: z.string().min(1, 'Description is required'),
  requirements: z.string().optional(), // We'll parse this to an array
  companyName: z.string().optional(),
  companyLogo: z.string().optional(),
  location: z.string().optional(),
  workplaceType: z.enum(['Remote', 'Hybrid', 'Onsite']).optional(),
  employmentType: z.enum(['Full-time', 'Part-time', 'Internship', 'Contract']).optional(),
  salaryMin: z.preprocess((val) => (val ? Number(val) : undefined), z.number().min(0).optional()),
  salaryMax: z.preprocess((val) => (val ? Number(val) : undefined), z.number().min(0).optional()),
  salaryCurrency: z.string().optional(),
  experienceLevel: z.enum(['Entry', 'Mid', 'Senior']).optional(),
  applicationDeadline: z.string().optional(),
});

export default function CreateJobModal({ isOpen, onClose, onJobCreated }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createJobSchema),
  });

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      setError('');
      
      const payload = {
        title: data.title,
        department: data.department,
        description: data.description,
        requirements: data.requirements
          ? data.requirements.split('\\n').map(req => req.trim()).filter(Boolean)
          : [],
        companyName: data.companyName,
        companyLogo: data.companyLogo,
        location: data.location,
        workplaceType: data.workplaceType,
        employmentType: data.employmentType,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        salaryCurrency: data.salaryCurrency,
        experienceLevel: data.experienceLevel,
        applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline).toISOString() : undefined,
      };

      const newJob = await jobApi.createJob(payload);
      reset();
      onJobCreated(newJob);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border bg-card p-6 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:bg-muted"
        >
          <X className="size-5" />
        </button>

        <div className="mb-6 space-y-2">
          <h2 className="text-xl font-bold">Create New Job</h2>
          <p className="text-sm text-muted-foreground">
            Jobs are created as drafts. You can open them later.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Job Title</label>
            <input
              {...register('title')}
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm"
              placeholder="e.g. Senior Frontend Engineer"
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Department</label>
            <input
              {...register('department')}
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm"
              placeholder="e.g. Engineering"
            />
            {errors.department && (
              <p className="text-xs text-destructive">{errors.department.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm resize-none"
              placeholder="Describe the role..."
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Requirements (One per line)</label>
            <textarea
              {...register('requirements')}
              rows={4}
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm resize-none"
              placeholder="React.js\nNode.js\n5+ years experience"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Company Name</label>
            <input {...register('companyName')} className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Location</label>
            <input {...register('location')} className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Workplace Type</label>
              <select {...register('workplaceType')} className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm">
                <option value="">Select...</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Onsite">Onsite</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Employment Type</label>
              <select {...register('employmentType')} className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm">
                <option value="">Select...</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Salary</label>
              <input type="number" {...register('salaryMin')} className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Salary</label>
              <input type="number" {...register('salaryMax')} className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Currency</label>
              <input defaultValue="INR" {...register('salaryCurrency')} className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Experience Level</label>
              <select {...register('experienceLevel')} className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm">
                <option value="">Select...</option>
                <option value="Entry">Entry</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Deadline</label>
              <input type="date" {...register('applicationDeadline')} className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm" />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Create Draft Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
