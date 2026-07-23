import { cn } from "@/lib/utils";
import EmptyState from "@/shared/components/EmptyState";
import DashboardHero from "@/shared/components/DashboardHero";
import { useState, useEffect } from 'react';
import { Video, Calendar, Clock, MessageSquare, CheckCircle, ExternalLink } from 'lucide-react';
import NavBar from '@/shared/components/NavBar';
import Sidebar from '@/shared/components/Sidebar';
import SubmitFeedbackModal from './SubmitFeedbackModal';

const STATUS_CFG = {
  scheduled:  { cls: 'status-scheduled',  label: 'Scheduled' },
  completed:  { cls: 'status-completed',  label: 'Completed' },
  cancelled:  { cls: 'status-cancelled',  label: 'Cancelled' },
};

function InterviewCard({ interview, onFeedback }) {
  const cfg = STATUS_CFG[interview.status] || STATUS_CFG.scheduled;
  const scheduledDate = new Date(interview.scheduledAt);
  const isToday = new Date().toDateString() === scheduledDate.toDateString();

  return (
    <div className="premium-card rounded-xl p-5 flex flex-col sm:flex-row gap-5">
      {/* Date/Time column */}
      <div className="flex sm:flex-col items-center sm:items-center justify-start sm:justify-center gap-3 sm:gap-1 sm:w-20 sm:shrink-0 sm:border-r sm:border-border/30 sm:pr-5">
        <div className={`text-center ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
          <p className="text-[20px] font-bold leading-none">{scheduledDate.getDate()}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wider mt-0.5">
            {scheduledDate.toLocaleString('en', { month: 'short' })}
          </p>
        </div>
        <p className="text-[12px] font-medium text-muted-foreground sm:text-center">
          {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        {isToday && (
          <span className="badge bg-primary/10 text-primary border border-primary/20 sm:mt-1">Today</span>
        )}
      </div>

      {/* Main info */}
      <div className="flex flex-1 flex-col sm:flex-row gap-4 items-start sm:items-center justify-between min-w-0">
        <div className="space-y-2 min-w-0 flex-1">
          <div>
            <h3 className="text-[15px] font-bold text-foreground">
              {interview.applicationId?.candidateId?.name || 'Unknown Candidate'}
            </h3>
            <p className="text-[13px] font-medium text-primary/80 mt-0.5">
              {interview.applicationId?.jobId?.title || 'Unknown Role'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {interview.durationMinutes} min
            </span>
            {interview.meetingLink && (
              <a
                href={interview.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-2.5 py-1 text-blue-400 hover:bg-blue-500/20 transition-colors font-semibold border border-blue-500/20"
              >
                <Video className="size-3.5" />
                Join Meeting
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>

        {/* Status + action */}
        <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
          <span className={`badge ${cfg.cls}`}>{cfg.label}</span>

          {interview.status === 'scheduled' && (
            <button
              onClick={() => onFeedback(interview)}
              className="group flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-primary to-primary/90 px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition-all hover:scale-105 hover:shadow-[0_4px_12px_hsl(var(--primary)/0.3)] active:scale-95"
            >
              <MessageSquare className="size-3.5" />
              Submit Feedback
            </button>
          )}
          {interview.status === 'completed' && (
            <div className="flex items-center gap-1.5 text-[12px] text-emerald-400 font-semibold">
              <CheckCircle className="size-3.5" />
              Feedback submitted
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InterviewerDashboard() {
  const [interviews, setInterviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInterview, setSelectedInterview] = useState(null);

  useEffect(() => { fetchInterviews(); }, []);

  const fetchInterviews = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/interviews/my');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to fetch interviews');
      setInterviews(json.data.interviews);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedbackSubmitted = (updated) => {
    setInterviews(prev => prev.map(inv => inv._id === updated._id ? updated : inv));
    setSelectedInterview(null);
  };

  const upcoming = interviews.filter(i => i.status === 'scheduled');
  const completed = interviews.filter(i => i.status === 'completed');

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <NavBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto max-w-4xl space-y-8">

            {/* Header */}
            <DashboardHero 
              title="Interviewer Dashboard" 
              subtitle="Review your upcoming interviews and submit candidate feedback."
              actionLabel="View Calendar"
              action={() => {}} // Phase 2: Open calendar view
            />

            {/* Stats Overview with Ring */}
            <div className="premium-card rounded-[6px] p-6 flex flex-col md:flex-row items-center gap-8 border border-border">
              {/* Ring Chart */}
              <div className="relative size-24 shrink-0 flex items-center justify-center">
                <svg className="size-full -rotate-90 transform" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle cx="50" cy="50" r="40" className="fill-none stroke-muted/30" strokeWidth="8" />
                  {/* Progress Ring */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    className="fill-none stroke-primary transition-all duration-1000 ease-out" 
                    strokeWidth="8" 
                    strokeDasharray="251.2" 
                    strokeDashoffset={interviews.length > 0 ? 251.2 - (251.2 * (completed.length / interviews.length)) : 251.2}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[18px] font-bold text-foreground">
                    {interviews.length > 0 ? Math.round((completed.length / interviews.length) * 100) : 0}%
                  </span>
                </div>
              </div>
              
              {/* Stats Breakdown */}
              <div className="flex-1 grid grid-cols-3 gap-4 w-full">
                {[
                  { icon: Calendar, label: 'Total', value: interviews.length, color: 'text-primary' },
                  { icon: Clock, label: 'Upcoming', value: upcoming.length, color: 'text-muted-foreground' },
                  { icon: CheckCircle, label: 'Completed', value: completed.length, color: 'text-foreground' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="flex flex-col">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Icon className={cn("size-3.5", color)} />
                      <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-28 skeleton rounded-xl" />)}
              </div>
            ) : error ? (
              <div className="error-state">
                <p className="text-destructive font-semibold">{error}</p>
                <button onClick={fetchInterviews} className="mt-4 text-[13px] font-semibold text-primary hover:underline underline-offset-4">
                  Retry →
                </button>
              </div>
            ) : interviews.length === 0 ? (
              <EmptyState 
                icon={Calendar}
                title="No interviews yet"
                description="You don't have any interviews scheduled. An HR team member will assign interviews to you."
              />
            ) : (
              <div className="space-y-6">
                {/* Upcoming section */}
                {upcoming.length > 0 && (
                  <div>
                    <h2 className="text-[13px] font-bold text-foreground mb-3 flex items-center gap-2">
                      <span className="size-2 rounded-full bg-blue-500 inline-block" />
                      Upcoming ({upcoming.length})
                    </h2>
                    <div className="flex flex-col gap-3">
                      {upcoming.map(inv => (
                        <InterviewCard key={inv._id} interview={inv} onFeedback={setSelectedInterview} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed section */}
                {completed.length > 0 && (
                  <div>
                    <h2 className="text-[13px] font-bold text-foreground mb-3 flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                      Completed ({completed.length})
                    </h2>
                    <div className="flex flex-col gap-3">
                      {completed.map(inv => (
                        <InterviewCard key={inv._id} interview={inv} onFeedback={setSelectedInterview} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <SubmitFeedbackModal
        isOpen={!!selectedInterview}
        interview={selectedInterview}
        onClose={() => setSelectedInterview(null)}
        onSubmit={handleFeedbackSubmitted}
      />
    </div>
  );
}
