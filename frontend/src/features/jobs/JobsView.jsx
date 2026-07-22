import { useState, useEffect } from 'react';
import { jobApi } from './jobApi';
import CreateJobModal from './CreateJobModal';
import { Plus, Briefcase, ChevronDown, Loader2 } from 'lucide-react';

export default function JobsView() {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const data = await jobApi.getJobs({ limit: 100 });
      setJobs(data.jobs);
    } catch (err) {
      console.error(err);
      setError('Failed to load jobs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (jobId, currentStatus, newStatus) => {
    if (currentStatus === newStatus || currentStatus === 'closed') return;
    // Enforce valid transitions client-side
    if (currentStatus === 'draft' && newStatus !== 'open') return;
    if (currentStatus === 'open' && newStatus !== 'closed') return;

    try {
      setUpdatingId(jobId);
      const updatedJob = await jobApi.updateJobStatus(jobId, newStatus);
      setJobs(jobs.map(j => (j._id === jobId ? updatedJob : j)));
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded-lg" />
        <div className="grid gap-4 mt-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-destructive/5 rounded-2xl border border-destructive/20">
        <p className="text-destructive font-medium">{error}</p>
        <button onClick={fetchJobs} className="mt-4 text-sm font-medium hover:underline text-destructive">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Job Postings</h2>
          <p className="text-sm text-muted-foreground">Manage your company's open roles.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Create Job
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-2xl bg-muted/30">
          <Briefcase className="size-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium">No jobs yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Create your first job posting to start building your candidate pipeline.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-6 text-sm font-medium text-primary hover:underline"
          >
            Create your first job
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map(job => (
            <div key={job._id} className="glass-card flex flex-col sm:flex-row gap-4 p-5 rounded-xl border items-start sm:items-center justify-between transition-shadow hover:shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground">{job.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                    job.status === 'open' ? 'bg-emerald-500/10 text-emerald-500' :
                    job.status === 'draft' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-slate-500/10 text-slate-500'
                  }`}>
                    {job.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-primary/70">{job.department}</span>
                  <span>•</span>
                  <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Status transition dropdown logic */}
                {job.status !== 'closed' && (
                  <div className="relative group">
                    <button
                      disabled={updatingId === job._id}
                      className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
                    >
                      {updatingId === job._id ? <Loader2 className="size-3 animate-spin" /> : 'Update Status'}
                      <ChevronDown className="size-3" />
                    </button>
                    <div className="absolute right-0 top-full z-10 mt-1 hidden w-32 rounded-lg border bg-popover p-1 shadow-md group-hover:block">
                      {job.status === 'draft' && (
                        <button
                          onClick={() => handleStatusChange(job._id, job.status, 'open')}
                          className="w-full rounded-md px-2 py-1.5 text-left text-xs font-medium hover:bg-muted text-emerald-500"
                        >
                          Publish to Open
                        </button>
                      )}
                      {job.status === 'open' && (
                        <button
                          onClick={() => handleStatusChange(job._id, job.status, 'closed')}
                          className="w-full rounded-md px-2 py-1.5 text-left text-xs font-medium hover:bg-muted text-destructive"
                        >
                          Close Job
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateJobModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onJobCreated={(newJob) => setJobs([newJob, ...jobs])}
      />
    </div>
  );
}
