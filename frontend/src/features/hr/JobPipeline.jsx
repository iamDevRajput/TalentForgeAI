import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Calendar, ArrowLeft, Users, GripVertical } from 'lucide-react';
import NavBar from '@/shared/components/NavBar';
import Sidebar from '@/shared/components/Sidebar';
import LoadingSpinner from '@/shared/components/LoadingSpinner';
import ScheduleInterviewModal from './ScheduleInterviewModal';

const STAGES = ['applied', 'screening', 'interviewing', 'offered', 'hired', 'rejected'];

const STAGE_CONFIG = {
  applied:      { label: 'Applied',      accent: 'kanban-applied',      dot: 'bg-blue-500',    count: 'bg-blue-500/10 text-blue-400' },
  screening:    { label: 'Screening',    accent: 'kanban-screening',    dot: 'bg-amber-500',   count: 'bg-amber-500/10 text-amber-400' },
  interviewing: { label: 'Interviewing', accent: 'kanban-interviewing', dot: 'bg-violet-500',  count: 'bg-violet-500/10 text-violet-400' },
  offered:      { label: 'Offered',      accent: 'kanban-offered',      dot: 'bg-orange-500',  count: 'bg-orange-500/10 text-orange-400' },
  hired:        { label: 'Hired',        accent: 'kanban-hired',        dot: 'bg-emerald-500', count: 'bg-emerald-500/10 text-emerald-400' },
  rejected:     { label: 'Rejected',     accent: 'kanban-rejected',     dot: 'bg-red-500',     count: 'bg-red-500/10 text-red-400' },
};

export default function JobPipeline() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [jobTitle, setJobTitle] = useState('Job Pipeline');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schedulingApp, setSchedulingApp] = useState(null);

  const fetchApplications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/applications/job/${jobId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to fetch applications');
      setApplications(json.data.applications);
      // Extract job title from first application if available
      if (json.data.applications?.[0]?.jobId?.title) {
        setJobTitle(json.data.applications[0].jobId.title);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    const appId = draggableId;
    const previousApplications = [...applications];

    setApplications(prev => prev.map(app =>
      app._id === appId ? { ...app, status: newStatus } : app
    ));

    try {
      const res = await fetch(`/api/applications/${appId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to update stage');
      setApplications(prev => prev.map(app =>
        app._id === appId ? json.data.application : app
      ));
    } catch (err) {
      alert(err.message);
      setApplications(previousApplications);
    }
  };

  const grouped = STAGES.reduce((acc, stage) => {
    acc[stage] = applications.filter(app => app.status === stage);
    return acc;
  }, {});

  const totalApps = applications.length;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <NavBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Pipeline Header */}
          <div className="flex items-center justify-between border-b border-border/40 bg-background/80 px-6 py-4 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/hr/dashboard')}
                className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors group"
              >
                <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
                Back to Jobs
              </button>
              <div className="h-4 w-px bg-border" />
              <div>
                <h1 className="text-[16px] font-bold tracking-tight text-foreground">{jobTitle}</h1>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Users className="size-3" />
                  {totalApps} candidate{totalApps !== 1 ? 's' : ''} in pipeline
                </p>
              </div>
            </div>
          </div>

          {/* Kanban content */}
          <div className="flex-1 overflow-x-auto p-6">
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <div className="error-state max-w-md mx-auto">
                <p className="text-destructive font-semibold">{error}</p>
                <button onClick={fetchApplications} className="mt-4 text-[13px] font-semibold text-primary hover:underline underline-offset-4">
                  Retry →
                </button>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex gap-4 h-full min-h-[500px]">
                  {STAGES.map(stage => {
                    const cfg = STAGE_CONFIG[stage];
                    const cards = grouped[stage];
                    return (
                      <div
                        key={stage}
                        className={`flex w-72 flex-shrink-0 flex-col rounded-xl border border-border/40 bg-muted/20 ${cfg.accent}`}
                      >
                        {/* Column Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                          <div className="flex items-center gap-2">
                            <div className={`size-2 rounded-full ${cfg.dot}`} />
                            <h3 className="text-[13px] font-bold text-foreground">{cfg.label}</h3>
                          </div>
                          <span className={`inline-flex items-center justify-center min-w-[22px] h-5 rounded-full text-[11px] font-bold px-1.5 ${cfg.count}`}>
                            {cards.length}
                          </span>
                        </div>

                        {/* Droppable */}
                        <Droppable droppableId={stage}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`flex-1 overflow-y-auto p-3 transition-colors duration-150 ${
                                snapshot.isDraggingOver ? 'bg-muted/40' : ''
                              }`}
                            >
                              <div className="flex flex-col gap-2.5">
                                {cards.length === 0 && !snapshot.isDraggingOver && (
                                  <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <p className="text-[12px] text-muted-foreground/50">Drop candidates here</p>
                                  </div>
                                )}
                                {cards.map((app, index) => (
                                  <Draggable key={app._id} draggableId={app._id} index={index}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={`kanban-card ${snapshot.isDragging ? 'kanban-card-dragging' : ''}`}
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                            {/* Drag handle */}
                                            <div {...provided.dragHandleProps} className="mt-0.5 shrink-0 text-muted-foreground/30 hover:text-muted-foreground cursor-grab">
                                              <GripVertical className="size-3.5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              {/* Avatar + name */}
                                              <div className="flex items-center gap-2 mb-1.5">
                                                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                                                  {(app.candidateId?.name || '?')[0].toUpperCase()}
                                                </div>
                                                <p className="text-[13px] font-semibold text-foreground truncate">
                                                  {app.candidateId?.name || 'Unknown Candidate'}
                                                </p>
                                              </div>
                                              <p className="text-[11px] text-muted-foreground">
                                                Applied {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                              </p>
                                            </div>
                                          </div>

                                          {/* Schedule button */}
                                          {(stage === 'screening' || stage === 'interviewing') && (
                                            <button
                                              onClick={() => setSchedulingApp(app)}
                                              className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                                              title="Schedule Interview"
                                            >
                                              <Calendar className="size-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            </div>
                          )}
                        </Droppable>
                      </div>
                    );
                  })}
                </div>
              </DragDropContext>
            )}
          </div>
        </main>
      </div>

      <ScheduleInterviewModal
        isOpen={!!schedulingApp}
        application={schedulingApp}
        onClose={() => setSchedulingApp(null)}
        onScheduled={() => fetchApplications()}
      />
    </div>
  );
}
