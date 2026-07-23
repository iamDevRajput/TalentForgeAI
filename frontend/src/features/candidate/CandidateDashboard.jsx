import EmptyState from "@/shared/components/EmptyState";
import DashboardHero from "@/shared/components/DashboardHero";
import { useState, useEffect, useMemo } from 'react';
import NavBar from '@/shared/components/NavBar';
import { useAuthStore } from '@/features/auth/authStore';
import { jobApi } from '@/features/jobs/jobApi';
import { applicationApi } from '@/features/applications/applicationApi';
import JobApplicationForm from '@/features/jobs/JobApplicationForm';
import {
  Briefcase, Send, CheckCircle2, Clock, Search, SlidersHorizontal,
  MapPin, Building2, ArrowUpDown, X, TrendingUp, ChevronDown,
  DollarSign, Zap, Globe, LayoutGrid, Bookmark,
} from 'lucide-react';

const STAGE_CONFIG = {
  applied:     { label: 'Applied',     cls: 'stage-applied' },
  screening:   { label: 'Screening',   cls: 'stage-screening' },
  interviewing:{ label: 'Interviewing',cls: 'stage-interview' },
  offered:     { label: 'Offered',     cls: 'stage-offer' },
  hired:       { label: 'Hired',       cls: 'stage-hired' },
  rejected:    { label: 'Rejected',    cls: 'stage-rejected' },
};

const WORKPLACE_ICONS = {
  Remote: <Globe className="size-3" />,
  Hybrid: <LayoutGrid className="size-3" />,
  Onsite: <Building2 className="size-3" />,
};

function StageBadge({ status }) {
  const cfg = STAGE_CONFIG[status] || STAGE_CONFIG.applied;
  return (
    <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
  );
}

function KpiCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="premium-card rounded-xl p-5 border border-border/50">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">{label}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {sub && <span className="text-[11px] font-medium text-emerald-500/80">{sub}</span>}
          </div>
        </div>
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-[8px] ${accent.replace('/10', '/5')} border border-border/30`}>
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  );
}

function JobCard({ job, applied, onApply }) {
  const formatSalary = (min, max, currency = 'INR') => {
    if (!min && !max) return null;
    const fmt = (n) => n >= 100000
      ? `${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`
      : `${(n / 1000).toFixed(0)}K`;
    const symbol = currency === 'INR' ? '₹' : '$';
    if (min && max) return `${symbol}${fmt(min)} – ${symbol}${fmt(max)}`;
    if (min) return `${symbol}${fmt(min)}+`;
    return `Up to ${symbol}${fmt(max)}`;
  };

  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const skills = job.skills || ['React', 'Node.js', 'TypeScript']; // Fallback for realism

  return (
    <div className="premium-card rounded-xl p-5 flex flex-col gap-4 border border-border/50 hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)] hover:border-border transition-all duration-300 ease-out group">
      {/* Top: Logo + Header */}
      <div className="flex items-start gap-4">
        {/* Company Logo */}
        <div className="flex size-12 shrink-0 items-center justify-center rounded-[8px] bg-secondary/50 border border-border/40 shadow-sm overflow-hidden">
          {job.companyLogo ? (
            <img src={job.companyLogo} alt={job.companyName} className="size-full object-cover" />
          ) : (
            <Building2 className="size-6 text-muted-foreground/50" />
          )}
        </div>
        
        {/* Company & Title */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.08em] truncate">
              {job.companyName || job.department || 'Company Name'}
            </p>
          </div>
          <h3 className="text-[16px] font-bold text-foreground mt-0.5 leading-tight truncate group-hover:text-primary transition-colors duration-200">
            {job.title}
          </h3>
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 mt-1">
        {salary && (
          <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-foreground">
            <DollarSign className="size-3.5 text-muted-foreground" />
            {salary} {job.salaryCurrency === 'INR' ? 'LPA' : '/ yr'}
          </div>
        )}
        {job.location && (
          <div className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground truncate">
            <MapPin className="size-3.5" />
            <span className="truncate">{job.location}</span>
          </div>
        )}
        {job.experienceLevel && (
          <div className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground truncate">
            <TrendingUp className="size-3.5" />
            <span className="truncate">{job.experienceLevel}</span>
          </div>
        )}
        {job.workplaceType && (
          <div className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground truncate">
            {WORKPLACE_ICONS[job.workplaceType] || <Globe className="size-3.5" />}
            <span className="truncate">{job.workplaceType} {job.employmentType ? `· ${job.employmentType}` : ''}</span>
          </div>
        )}
      </div>

      {/* Skills Chips */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {skills.slice(0, 3).map((skill, idx) => (
            <span key={idx} className="inline-flex items-center rounded-md bg-secondary/40 px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
              {skill}
            </span>
          ))}
          {skills.length > 3 && (
            <span className="inline-flex items-center rounded-md bg-secondary/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              +{skills.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer: Date + Actions */}
      <div className="flex items-center justify-between pt-4 mt-auto border-t border-border/15">
        <span className="text-[11.5px] font-medium text-muted-foreground flex items-center gap-1.5">
          <Clock className="size-3.5" />
          {new Date(job.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
        </span>
        <div className="flex items-center gap-2">
          {!applied && (
            <button className="flex size-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors active:scale-[0.98]">
              <Bookmark className="size-4" />
            </button>
          )}
          {applied ? (
            <div className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-3 py-1.5 text-[12px] font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" />
              Applied
            </div>
          ) : (
            <button
              onClick={() => onApply(job)}
              className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-[12px] font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all active:scale-[0.98]"
            >
              Apply Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AppCard({ app }) {
  const job = app.jobId;
  return (
    <div className="premium-card rounded-xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/40">
          <Briefcase className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
            {job?.companyName || job?.department || 'Company'}
          </p>
          <h3 className="text-[15px] font-semibold text-foreground truncate">{job?.title || 'Unknown Job'}</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <Clock className="size-3" />
            Applied {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>
      <StageBadge status={app.status} />
    </div>
  );
}

export default function CandidateDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('available');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  // Search / filter / sort state
  const [search, setSearch] = useState('');
  const [filterWorkplace, setFilterWorkplace] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [jobsData, appsData] = await Promise.all([
        jobApi.getJobs({ limit: 100 }),
        applicationApi.getMyApplications()
      ]);
      setJobs(jobsData.jobs);
      setApplications(appsData);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplicationSuccess = (newApp) => {
    setApplications([newApp, ...applications]);
    setActiveTab('applications');
  };

  const hasApplied = (jobId) =>
    applications.some(app => app.jobId === jobId || app.jobId?._id === jobId);

  const filteredJobs = useMemo(() => {
    let list = [...jobs];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(j =>
        j.title?.toLowerCase().includes(q) ||
        j.companyName?.toLowerCase().includes(q) ||
        j.department?.toLowerCase().includes(q) ||
        j.location?.toLowerCase().includes(q)
      );
    }
    if (filterWorkplace) list = list.filter(j => j.workplaceType === filterWorkplace);
    if (filterType) list = list.filter(j => j.employmentType === filterType);
    if (sortBy === 'newest') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortBy === 'oldest') list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sortBy === 'salary-high') list.sort((a, b) => (b.salaryMax || 0) - (a.salaryMax || 0));
    return list;
  }, [jobs, search, filterWorkplace, filterType, sortBy]);

  const inProgress = applications.filter(a => !['hired', 'rejected'].includes(a.status));

  const kpis = [
    { icon: Briefcase, label: 'Available Jobs', value: jobs.length, sub: 'Updated today', accent: 'bg-primary/10 text-primary' },
    { icon: Send, label: 'Applied', value: applications.length, sub: 'Active', accent: 'bg-blue-500/10 text-blue-400' },
    { icon: TrendingUp, label: 'In Progress', value: inProgress.length, sub: 'Screening', accent: 'bg-violet-500/10 text-violet-400' },
    { icon: CheckCircle2, label: 'Hired', value: applications.filter(a => a.status === 'hired').length, sub: 'Congrats!', accent: 'bg-emerald-500/10 text-emerald-400' },
  ];

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <NavBar />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <DashboardHero 
              subtitle="Welcome back to TalentForgeAI. Discover opportunities, track applications and manage your hiring journey from one intelligent workspace."
              actionLabel="Browse Jobs"
              action={() => {}} // Phase 2: Redirect to jobs board
            />

            {/* Application Progress */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map(k => <KpiCard key={k.label} {...k} />)}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-border/50">
          {[
            { id: 'available', label: 'Available Jobs', count: jobs.length },
            { id: 'applications', label: 'My Applications', count: applications.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 pb-3 text-[13px] font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                activeTab === tab.id ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 skeleton rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="error-state">
            <p className="text-destructive font-semibold text-[15px]">{error}</p>
            <p className="text-muted-foreground text-[13px] mt-1">Check your connection and try again.</p>
            <button
              onClick={fetchDashboardData}
              className="mt-4 text-[13px] font-semibold text-primary hover:underline underline-offset-4"
            >
              Retry →
            </button>
          </div>
        ) : (
          <div className="space-y-6 page-enter">
            {/* Available Jobs Tab */}
            {activeTab === 'available' && (
              <>
                {/* Search + Filter + Sort bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search jobs, companies, locations..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="input-field pl-10 pr-10"
                    />
                    {search && (
                      <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <SlidersHorizontal className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <select
                        value={filterWorkplace}
                        onChange={e => setFilterWorkplace(e.target.value)}
                        className="input-field pl-9 pr-8 appearance-none cursor-pointer text-[13px] min-w-[130px]"
                      >
                        <option value="">All Locations</option>
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Onsite">Onsite</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        className="input-field pr-8 appearance-none cursor-pointer text-[13px] min-w-[130px]"
                      >
                        <option value="">All Types</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Internship">Internship</option>
                        <option value="Contract">Contract</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
                    </div>
                    <div className="relative">
                      <ArrowUpDown className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="input-field pl-9 pr-8 appearance-none cursor-pointer text-[13px] min-w-[120px]"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="salary-high">Highest Salary</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Results count */}
                {(search || filterWorkplace || filterType) && (
                  <p className="text-[13px] text-muted-foreground">
                    Showing <span className="font-semibold text-foreground">{filteredJobs.length}</span> of {jobs.length} jobs
                    {search && <> matching "<span className="text-primary">{search}</span>"</>}
                  </p>
                )}

                {filteredJobs.length === 0 ? (
                  <EmptyState 
                    icon={Briefcase}
                    title="No jobs found"
                    description={search || filterWorkplace || filterType
                      ? 'Try adjusting your search or filters to find more opportunities.'
                      : 'No open positions right now. Check back later!'}
                    action={search || filterWorkplace || filterType ? () => { setSearch(''); setFilterWorkplace(''); setFilterType(''); } : null}
                    actionLabel={search || filterWorkplace || filterType ? "Clear filters" : null}
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredJobs.map(job => (
                      <JobCard
                        key={job._id}
                        job={job}
                        applied={hasApplied(job._id)}
                        onApply={setSelectedJob}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* My Applications Tab */}
            {activeTab === 'applications' && (
              <>
                {applications.length === 0 ? (
                  <EmptyState 
                    icon={Send}
                    title="No applications yet"
                    description="You haven't applied to any positions yet. Browse available jobs to get started."
                    action={() => setActiveTab('available')}
                    actionLabel="Browse Jobs"
                  />
                ) : (
                  <div className="flex flex-col gap-3">
                    {applications.map(app => (
                      <AppCard key={app._id} app={app} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      <JobApplicationForm
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        onApplied={handleApplicationSuccess}
      />
    </div>
  );
}
