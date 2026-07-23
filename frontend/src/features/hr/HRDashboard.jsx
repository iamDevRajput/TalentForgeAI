import EmptyState from "@/shared/components/EmptyState";
/**
 * HRDashboard.jsx — Full ATS home page for HR role
 *
 * Sections:
 *   1. KPI Cards (total jobs, open, applications, this-week hires)
 *   2. Hiring Funnel
 *   3. Quick Actions
 *   4. Jobs view (below the fold)
 */

import { useState, useEffect } from 'react';
import NavBar from '@/shared/components/NavBar';
import Sidebar from '@/shared/components/Sidebar';
import JobsView from '../jobs/JobsView';
import { useAuthStore } from '@/features/auth/authStore';
import {
  Briefcase, Users, TrendingUp, Calendar, Plus,
  ArrowRight, Activity, Clock, CheckCircle2
} from 'lucide-react';
import DashboardHero from '@/shared/components/DashboardHero';

const FUNNEL_STAGES = [
  { key: 'applied',      label: 'Applied' },
  { key: 'screening',    label: 'Screening' },
  { key: 'interviewing', label: 'Interviewing' },
  { key: 'offered',      label: 'Offered' },
  { key: 'hired',        label: 'Hired' },
];

const STAGE_BADGE = {
  applied:      'stage-applied',
  screening:    'stage-screening',
  interviewing: 'stage-interview',
  offered:      'stage-offer',
  hired:        'stage-hired',
  rejected:     'stage-rejected',
};

function KpiCard({ icon: Icon, label, value, sub, accent, loading }) {
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
          {loading ? (
            <div className="mt-2 h-7 w-12 skeleton rounded" />
          ) : (
            <p className="mt-1.5 text-2xl font-bold text-foreground">{value}</p>
          )}
          {sub && <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>}
        </div>
        <div className={`flex size-9 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  );
}

export default function HRDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoadingStats(true);
      // Fetch jobs and all applications in parallel
      const [jobsRes, appsRes, interviewsRes] = await Promise.allSettled([
        fetch('/api/jobs?limit=100').then(r => r.json()),
        fetch('/api/applications?limit=50').then(r => r.json()),
        fetch('/api/interviews?limit=10').then(r => r.json()),
      ]);

      const jobs = jobsRes.status === 'fulfilled' ? (jobsRes.value?.data?.jobs || []) : [];
      const apps = appsRes.status === 'fulfilled' ? (appsRes.value?.data?.applications || []) : [];
      const interviews = interviewsRes.status === 'fulfilled' ? (interviewsRes.value?.data?.interviews || []) : [];

      // Funnel counts
      const funnelCounts = {};
      FUNNEL_STAGES.forEach(s => {
        funnelCounts[s.key] = apps.filter(a => a.status === s.key).length;
      });
      funnelCounts.rejected = apps.filter(a => a.status === 'rejected').length;

      // This week
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const thisWeekApps = apps.filter(a => new Date(a.createdAt) > weekAgo).length;
      const thisWeekHires = apps.filter(a => a.status === 'hired' && new Date(a.updatedAt) > weekAgo).length;

      setStats({
        totalJobs: jobs.length,
        openJobs: jobs.filter(j => j.status === 'open').length,
        totalApps: apps.length,
        thisWeekApps,
        thisWeekHires,
        funnelCounts,
      });

      setRecentApps(apps.slice(0, 5));
      setUpcomingInterviews(interviews.filter(i => i.status === 'scheduled').slice(0, 5));
    } catch (err) {
      console.error('Dashboard stats error:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const maxFunnel = stats ? Math.max(...FUNNEL_STAGES.map(s => stats.funnelCounts[s.key] || 0), 1) : 1;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <NavBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl p-6 lg:p-8 space-y-8">

            {/* Header */}
            <DashboardHero 
              title="HR Command Center" 
              subtitle="Manage your hiring pipeline and review active candidates across all open roles."
              actionLabel="Post New Role"
              action={() => {}} // Phase 2: Post role modal
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard icon={Briefcase} label="Open Roles" value={stats?.openJobs ?? '—'} sub={`of ${stats?.totalJobs ?? 0} total`} accent="bg-primary/10 text-primary" loading={loadingStats} />
              <KpiCard icon={Users} label="Total Applications" value={stats?.totalApps ?? '—'} sub={`+${stats?.thisWeekApps ?? 0} this week`} accent="bg-blue-500/10 text-blue-400" loading={loadingStats} />
              <KpiCard icon={TrendingUp} label="In Pipeline" value={stats ? (stats.funnelCounts.interviewing + stats.funnelCounts.screening) : '—'} sub="screening + interview" accent="bg-violet-500/10 text-violet-400" loading={loadingStats} />
              <KpiCard icon={CheckCircle2} label="Hired This Week" value={stats?.thisWeekHires ?? '—'} sub="last 7 days" accent="bg-emerald-500/10 text-emerald-400" loading={loadingStats} />
            </div>

            {/* Funnel + Quick Actions row */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Hiring Funnel */}
              <div className="lg:col-span-2 premium-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-[14px] font-bold text-foreground">Hiring Funnel</h2>
                    <p className="text-[12px] text-muted-foreground mt-0.5">Candidate distribution by stage</p>
                  </div>
                  <Activity className="size-4 text-muted-foreground" />
                </div>
                {loadingStats ? (
                  <div className="space-y-3">
                    {[1,2,3,4,5].map(i => <div key={i} className="h-8 skeleton rounded-[4px]" />)}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {FUNNEL_STAGES.map((stage, i) => {
                      const count = stats?.funnelCounts[stage.key] || 0;
                      const pct = Math.round((count / maxFunnel) * 100) || 0;
                      return (
                        <div key={stage.key} className="flex items-center gap-3 group">
                          <span className="w-24 shrink-0 text-[12px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">{stage.label}</span>
                          <div className="flex-1 h-6 bg-muted/30 rounded-[4px] overflow-hidden flex items-center">
                            <div
                              className={`h-full bg-primary rounded-[4px] transition-all duration-700 ease-out`}
                              style={{ width: `${pct}%`, opacity: Math.max(1 - i * 0.15, 0.3) }}
                            />
                          </div>
                          <span className="w-10 text-right text-[12px] font-bold text-foreground">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="premium-card rounded-xl p-6 flex flex-col gap-3">
                <h2 className="text-[14px] font-bold text-foreground mb-2">Quick Actions</h2>
                {[
                  { label: 'Create Job Posting', icon: Plus, href: '#', onClick: null, accent: 'text-primary bg-primary/10 hover:bg-primary/20' },
                  { label: 'View All Applications', icon: Users, href: '#', accent: 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/15' },
                  { label: 'Schedule Interview', icon: Calendar, href: '#', accent: 'text-violet-400 bg-violet-500/10 hover:bg-violet-500/15' },
                  { label: 'Analytics Overview', icon: TrendingUp, href: '#', accent: 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15' },
                ].map(action => (
                  <button
                    key={action.label}
                    className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-[13px] font-semibold transition-colors ${action.accent}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <action.icon className="size-4" />
                      {action.label}
                    </span>
                    <ArrowRight className="size-3.5 opacity-60" />
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Applications + Upcoming Interviews row */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Applications */}
              <div className="premium-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-[14px] font-bold text-foreground">Recent Applications</h2>
                  <span className="text-[11px] text-muted-foreground">Last 5</span>
                </div>
                {loadingStats ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <div key={i} className="h-14 skeleton rounded-lg" />)}
                  </div>
                ) : recentApps.length === 0 ? (
                  <EmptyState 
                    icon={Users}
                    title="No recent applications"
                    description="When candidates apply for your open roles, they will appear here."
                    className="border-none bg-transparent p-6"
                  />
                ) : (
                  <div className="space-y-2">
                    {recentApps.map(app => (
                      <div key={app._id} className="flex items-center justify-between gap-3 rounded-lg hover:bg-muted/30 px-3 py-2.5 transition-colors -mx-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted/60 text-[10px] font-bold text-muted-foreground">
                            {(app.candidateId?.name || '?')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-foreground truncate">{app.candidateId?.name || 'Unknown'}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{app.jobId?.title || 'Unknown Role'}</p>
                          </div>
                        </div>
                        <span className={`badge ${STAGE_BADGE[app.status] || 'stage-applied'} shrink-0`}>{app.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Interviews */}
              <div className="premium-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-[14px] font-bold text-foreground">Upcoming Interviews</h2>
                  <span className="text-[11px] text-muted-foreground">Scheduled</span>
                </div>
                {loadingStats ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <div key={i} className="h-14 skeleton rounded-lg" />)}
                  </div>
                ) : upcomingInterviews.length === 0 ? (
                  <EmptyState 
                    icon={Calendar}
                    title="No upcoming interviews"
                    description="You don't have any interviews scheduled for the near future."
                    className="border-none bg-transparent p-6"
                  />
                ) : (
                  <div className="space-y-2">
                    {upcomingInterviews.map(inv => (
                      <div key={inv._id} className="flex items-center justify-between gap-3 rounded-lg hover:bg-muted/30 px-3 py-2.5 transition-colors -mx-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                            <Calendar className="size-3.5 text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-foreground truncate">
                              {inv.applicationId?.candidateId?.name || 'Candidate'}
                            </p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Clock className="size-3" />
                              {new Date(inv.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              {' · '}
                              {new Date(inv.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <span className="badge status-scheduled shrink-0">Scheduled</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Full Jobs View */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">All Job Postings</h2>
              </div>
              <JobsView />
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
