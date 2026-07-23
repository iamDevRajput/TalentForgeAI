import { useState, useEffect } from 'react';
import { jobApi } from './jobApi';
import CreateJobModal from './CreateJobModal';
import {
  Plus, Briefcase, ChevronDown, Loader2, Layout,
  MapPin, Building2, DollarSign, Zap, TrendingUp,
  Globe, LayoutGrid, Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const WORKPLACE_ICONS = {
  Remote: <Globe className="size-3" />,
  Hybrid: <LayoutGrid className="size-3" />,
  Onsite: <Building2 className="size-3" />,
};

function formatSalary(min, max, currency = 'INR') {
  if (!min && !max) return null;
  const fmt = (n) => n >= 100000
    ? `${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`
    : `${(n / 1000).toFixed(0)}K`;
  const symbol = currency === 'INR' ? '₹' : '$';
  if (min && max) return `${symbol}${fmt(min)} – ${symbol}${fmt(max)}`;
  if (min) return `${symbol}${fmt(min)}+`;
  return `Up to ${symbol}${fmt(max)}`;
}

function JobCard({ job, onStatusChange, updating }) {
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const statusCls = job.status === 'open' ? 'status-open' : job.status === 'draft' ? 'status-draft' : 'status-closed';

  return (
    <div className="premium-card rounded-xl p-5 flex flex-col gap-4">
      {/* Header row: company + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Building2 className="size-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {job.companyName || job.department || '—'}
            </p>
            <h3 className="text-[16px] font-bold text-foreground mt-0.5 leading-tight truncate">
              {job.title}
            </h3>
          </div>
        </div>
        <span className={`badge ${statusCls} shrink-0`}>{job.status}</span>
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-2">
        {job.location && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/40 rounded-full px-2.5 py-0.5">
            <MapPin className="size-3" />{job.location}
          </span>
        )}
        {job.workplaceType && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/40 rounded-full px-2.5 py-0.5">
            {WORKPLACE_ICONS[job.workplaceType]}{job.workplaceType}
          </span>
        )}
        {job.employmentType && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/40 rounded-full px-2.5 py-0.5">
            <Zap className="size-3" />{job.employmentType}
          </span>
        )}
        {job.experienceLevel && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/40 rounded-full px-2.5 py-0.5">
            <TrendingUp className="size-3" />{job.experienceLevel}
          </span>
        )}
        {job.department && job.companyName && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/40 rounded-full px-2.5 py-0.5">
            {job.department}
          </span>
        )}
      </div>

      {/* Salary */}
      {salary && (
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground/80">
          <DollarSign className="size-3.5 text-primary/70" />
          {salary} / year
        </div>
      )}

      {/* Footer: date + actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border/30 mt-auto">
        <p className="text-[11px] text-muted-foreground">
          Posted {new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
        <div className="flex items-center gap-2">
          {/* Status update dropdown */}
          {job.status !== 'closed' && (
            <div className="relative group">
              <button
                disabled={updating === job._id}
                className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/80 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted/60 hover:text-foreground disabled:opacity-50 transition-colors"
              >
                {updating === job._id ? <Loader2 className="size-3 animate-spin" /> : null}
                Update
                <ChevronDown className="size-3" />
              </button>
              <div className="absolute right-0 top-full z-20 mt-1 hidden w-36 rounded-xl border border-border/50 bg-card p-1.5 shadow-xl group-hover:block">
                {job.status === 'draft' && (
                  <button
                    onClick={() => onStatusChange(job._id, job.status, 'open')}
                    className="w-full rounded-lg px-3 py-2 text-left text-[12px] font-semibold hover:bg-muted/60 text-emerald-400 transition-colors"
                  >
                    ✓ Publish Job
                  </button>
                )}
                {job.status === 'open' && (
                  <button
                    onClick={() => onStatusChange(job._id, job.status, 'closed')}
                    className="w-full rounded-lg px-3 py-2 text-left text-[12px] font-semibold hover:bg-muted/60 text-destructive transition-colors"
                  >
                    ✕ Close Job
                  </button>
                )}
              </div>
            </div>
          )}
          <Link
            to={`/hr/jobs/${job._id}/pipeline`}
            className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary transition-all hover:bg-primary/20 hover:scale-105 active:scale-95 ring-1 ring-primary/20"
          >
            <Layout className="size-3" />
            Pipeline
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function JobsView() {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => { fetchJobs(); }, []);

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

  const open = jobs.filter(j => j.status === 'open').length;
  const draft = jobs.filter(j => j.status === 'draft').length;
  const closed = jobs.filter(j => j.status === 'closed').length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 skeleton rounded-xl" />)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1,2,3].map(i => <div key={i} className="h-48 skeleton rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p className="text-destructive font-semibold">{error}</p>
        <button onClick={fetchJobs} className="mt-4 text-[13px] font-semibold text-primary hover:underline underline-offset-4">
          Retry →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Briefcase, label: 'Total Jobs', value: jobs.length, accent: 'bg-primary/10 text-primary' },
          { icon: Users, label: 'Open', value: open, accent: 'bg-emerald-500/10 text-emerald-400' },
          { icon: Layout, label: 'Draft', value: draft, accent: 'bg-amber-500/10 text-amber-400' },
          { icon: ChevronDown, label: 'Closed', value: closed, accent: 'bg-slate-500/10 text-slate-400' },
        ].map(({ icon: Icon, label, value, accent }) => (
          <div key={label} className="kpi-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="mt-1.5 text-2xl font-bold text-foreground">{value}</p>
              </div>
              <div className={`flex size-9 items-center justify-center rounded-lg ${accent}`}>
                <Icon className="size-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Job Postings</h2>
          <p className="text-[13px] text-muted-foreground">Manage your open roles and pipelines.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="group flex items-center gap-2 rounded-xl bg-gradient-to-b from-primary to-primary/90 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:scale-105 hover:shadow-[0_4px_12px_hsl(var(--primary)/0.3)] active:scale-95"
        >
          <Plus className="size-4" />
          Create Job
        </button>
      </div>

      {/* Job Cards */}
      {jobs.length === 0 ? (
        <div className="empty-state">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/60 mb-4">
            <Briefcase className="size-8 text-muted-foreground/40" />
          </div>
          <h3 className="text-[16px] font-semibold text-foreground">No jobs yet</h3>
          <p className="text-[13px] text-muted-foreground mt-2 max-w-sm">
            Create your first job posting to start building your candidate pipeline.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-5 group flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-primary to-primary/90 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="size-4" />
            Create First Job
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map(job => (
            <JobCard
              key={job._id}
              job={job}
              onStatusChange={handleStatusChange}
              updating={updatingId}
            />
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
