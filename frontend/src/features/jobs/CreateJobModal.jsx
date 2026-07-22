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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl relative">
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
