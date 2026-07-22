import { useState, useEffect } from 'react';
import { Video, Calendar, Clock, MessageSquare, CheckCircle, ExternalLink } from 'lucide-react';
import NavBar from '@/shared/components/NavBar';
import Sidebar from '@/shared/components/Sidebar';
import LoadingSpinner from '@/shared/components/LoadingSpinner';
import SubmitFeedbackModal from './SubmitFeedbackModal';

export default function InterviewerDashboard() {
  const [interviews, setInterviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedInterview, setSelectedInterview] = useState(null);

  useEffect(() => {
    fetchInterviews();
  }, []);

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

  const handleFeedbackSubmitted = (updatedInterview) => {
    setInterviews(prev => prev.map(inv => inv._id === updatedInterview._id ? updatedInterview : inv));
    setSelectedInterview(null);
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <NavBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto max-w-5xl space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">My Interviews</h2>
              <p className="text-sm text-muted-foreground">Manage your upcoming interviews and submit feedback.</p>
            </div>

            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
                {error}
              </div>
            ) : interviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-2xl bg-muted/30">
                <Calendar className="size-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium">No interviews</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  You don't have any upcoming interviews scheduled.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {interviews.map(interview => (
                  <div key={interview._id} className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">
                            {interview.applicationId?.candidateId?.name || 'Unknown Candidate'}
                          </h3>
                          <p className="text-sm font-medium text-primary/80">
                            {interview.applicationId?.jobId?.title || 'Unknown Role'}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-4" />
                            {new Date(interview.scheduledAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-4" />
                            {new Date(interview.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({interview.durationMinutes} min)
                          </div>
                          {interview.meetingLink && (
                            <a
                              href={interview.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 text-primary hover:underline"
                            >
                              <Video className="size-4" />
                              Join Meeting
                              <ExternalLink className="size-3 ml-0.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-start sm:items-end gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                          interview.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                          interview.status === 'scheduled' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-slate-500/10 text-slate-500'
                        }`}>
                          {interview.status}
                        </span>

                        {interview.status === 'scheduled' ? (
                          <button
                            onClick={() => setSelectedInterview(interview)}
                            className="mt-2 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                          >
                            <MessageSquare className="size-4" />
                            Submit Feedback
                          </button>
                        ) : interview.status === 'completed' ? (
                          <div className="mt-2 flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle className="size-4" />
                            Feedback Submitted
                          </div>
                        ) : null}
                      </div>

                    </div>
                  </div>
                ))}
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
