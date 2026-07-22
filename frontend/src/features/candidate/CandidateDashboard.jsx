import { useState, useEffect } from 'react';
import NavBar from '@/shared/components/NavBar';
import { useAuthStore } from '@/features/auth/authStore';
import { jobApi } from '@/features/jobs/jobApi';
import { applicationApi } from '@/features/applications/applicationApi';
import JobApplicationForm from '@/features/jobs/JobApplicationForm';
import { Briefcase, Send, CheckCircle2, Clock } from 'lucide-react';

export default function CandidateDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('available'); // 'available' or 'applications'
  
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Fetch both in parallel
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

  const handleApplicationSuccess = (newApplication) => {
    setApplications([newApplication, ...applications]);
    setActiveTab('applications'); // switch tab to show the new application
  };

  const hasApplied = (jobId) => {
    return applications.some(app => app.jobId === jobId || (app.jobId?._id === jobId));
  };

  const statusColors = {
    applied: 'bg-blue-500/10 text-blue-500',
    screening: 'bg-amber-500/10 text-amber-500',
    interviewing: 'bg-purple-500/10 text-purple-500',
    offered: 'bg-emerald-500/10 text-emerald-500',
    hired: 'bg-emerald-500/10 text-emerald-500',
    rejected: 'bg-red-500/10 text-red-500',
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <NavBar />
      
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back, {user?.name?.split(' ')[0] || 'Candidate'}</h1>
          <p className="text-muted-foreground mt-2">Find your next role and track your applications.</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b mb-6">
          <button
            onClick={() => setActiveTab('available')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'available' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Available Jobs
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'applications' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            My Applications ({applications.length})
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-destructive/5 rounded-2xl border border-destructive/20">
            <p className="text-destructive font-medium">{error}</p>
            <button onClick={fetchDashboardData} className="mt-4 text-sm font-medium hover:underline text-destructive">
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-6 page-enter">
            {activeTab === 'available' && (
              <>
                {jobs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-2xl bg-muted/30">
                    <Briefcase className="size-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium">No open positions</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                      Check back later for new opportunities.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {jobs.map(job => {
                      const applied = hasApplied(job._id);
                      return (
                        <div key={job._id} className="glass-card flex flex-col sm:flex-row gap-4 p-5 rounded-xl border items-start sm:items-center justify-between transition-shadow hover:shadow-sm">
                          <div className="space-y-1">
                            <h3 className="font-medium text-foreground text-lg">{job.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="font-medium text-primary/70">{job.department}</span>
                              <span>•</span>
                              <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="w-full sm:w-auto mt-2 sm:mt-0">
                            {applied ? (
                              <div className="flex items-center justify-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium text-muted-foreground w-full sm:w-auto border border-transparent">
                                <CheckCircle2 className="size-4" />
                                Applied
                              </div>
                            ) : (
                              <button
                                onClick={() => setSelectedJob(job)}
                                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 w-full sm:w-auto shadow-sm"
                              >
                                <Send className="size-4" />
                                Apply Now
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {activeTab === 'applications' && (
              <>
                {applications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-2xl bg-muted/30">
                    <Send className="size-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium">No applications yet</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                      You haven't applied to any jobs yet. Check the Available Jobs tab to get started.
                    </p>
                    <button
                      onClick={() => setActiveTab('available')}
                      className="mt-6 text-sm font-medium text-primary hover:underline"
                    >
                      Browse Jobs
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {applications.map(app => (
                      <div key={app._id} className="glass-card flex flex-col sm:flex-row gap-4 p-5 rounded-xl border items-start sm:items-center justify-between transition-shadow hover:shadow-sm">
                        <div className="space-y-1">
                          <h3 className="font-medium text-foreground text-lg">
                            {app.jobId?.title || 'Unknown Job'}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-medium text-primary/70">{app.jobId?.department || 'Unknown'}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />
                              Applied {new Date(app.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[app.status] || statusColors.applied}`}>
                            {app.status}
                          </span>
                        </div>
                      </div>
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
