import { useState } from 'react';
import { X, Calendar, Clock, Video, User } from 'lucide-react';

export default function ScheduleInterviewModal({ isOpen, onClose, application, onScheduled }) {
  const [interviewerId, setInterviewerId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [meetingLink, setMeetingLink] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !application) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      
      const res = await fetch('/api/interviews/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application._id,
          interviewerId,
          scheduledAt,
          durationMinutes: parseInt(durationMinutes, 10),
          meetingLink,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to schedule interview');
      
      onScheduled(json.data.interview);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Schedule Interview</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mb-6 rounded-lg bg-muted/30 p-3 text-sm">
          <p className="font-medium text-foreground">Candidate: {application.candidateId?.name}</p>
          <p className="text-muted-foreground">Job: {application.jobId?.title}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Interviewer ID <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <input
                required
                type="text"
                placeholder="Enter Interviewer User ID"
                value={interviewerId}
                onChange={(e) => setInterviewerId(e.target.value)}
                className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">In a real app, this would be a dropdown of users with role='interviewer'.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Date <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <input
                  required
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Time <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <input
                  required
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Duration (minutes) <span className="text-destructive">*</span>
            </label>
            <input
              required
              type="number"
              min="15"
              max="240"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Meeting Link (Optional)
            </label>
            <div className="relative">
              <Video className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <input
                type="url"
                placeholder="https://zoom.us/j/..."
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? 'Scheduling...' : 'Schedule Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
