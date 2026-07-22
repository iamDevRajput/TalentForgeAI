import { useState } from 'react';
import { X, Star } from 'lucide-react';

export default function SubmitFeedbackModal({ isOpen, interview, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !interview) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/interviews/${interview._id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, notes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to submit feedback');
      
      onSubmit(json.data.interview);
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
          <h2 className="text-xl font-bold text-foreground">Submit Feedback</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mb-6 rounded-lg bg-muted/30 p-3 text-sm">
          <p className="font-medium text-foreground">
            Candidate: {interview.applicationId?.candidateId?.name}
          </p>
          <p className="text-muted-foreground">
            Job: {interview.applicationId?.jobId?.title}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Overall Rating <span className="text-destructive">*</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={(e) => {
                    const stars = e.currentTarget.parentElement.children;
                    for (let i = 0; i < 5; i++) {
                      if (i < star) stars[i].classList.add('text-yellow-400', 'fill-yellow-400');
                      else stars[i].classList.remove('text-yellow-400', 'fill-yellow-400');
                    }
                  }}
                  onMouseLeave={(e) => {
                    const stars = e.currentTarget.parentElement.children;
                    for (let i = 0; i < 5; i++) {
                      if (i < rating) stars[i].classList.add('text-yellow-400', 'fill-yellow-400');
                      else stars[i].classList.remove('text-yellow-400', 'fill-yellow-400');
                    }
                  }}
                  className={`transition-colors ${
                    rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'
                  }`}
                >
                  <Star className="size-8" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Feedback Notes <span className="text-destructive">*</span>
            </label>
            <textarea
              required
              rows={4}
              minLength={10}
              placeholder="Provide detailed feedback on the candidate's performance..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full resize-none rounded-md border bg-background p-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
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
              {isLoading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
