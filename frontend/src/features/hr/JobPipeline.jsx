import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import NavBar from '@/shared/components/NavBar';
import Sidebar from '@/shared/components/Sidebar';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const STAGES = ['applied', 'screening', 'interviewing', 'offered', 'hired', 'rejected'];

export default function JobPipeline() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/applications/job/${jobId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to fetch applications');
      setApplications(json.data.applications);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const newStatus = destination.droppableId;
    const appId = draggableId;
    
    // Optimistic UI update
    const previousApplications = [...applications];
    setApplications(prev => prev.map(app => 
      app._id === appId ? { ...app, status: newStatus } : app
    ));

    try {
      const res = await fetch(`/api/applications/${appId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to update stage');
      }
      
      // Update with server response (which includes updated timeline)
      setApplications(prev => prev.map(app => 
        app._id === appId ? json.data.application : app
      ));
    } catch (err) {
      alert(err.message);
      // Revert on failure
      setApplications(previousApplications);
    }
  };

  // Group applications by status
  const getGroupedApplications = () => {
    const grouped = STAGES.reduce((acc, stage) => {
      acc[stage] = [];
      return acc;
    }, {});

    applications.forEach(app => {
      if (grouped[app.status]) {
        grouped[app.status].push(app);
      }
    });
    return grouped;
  };

  const columns = getGroupedApplications();

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <NavBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-x-auto p-6 lg:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/hr/dashboard')}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                &larr; Back to Jobs
              </button>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Job Pipeline
              </h1>
            </div>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
              {error}
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex h-full gap-4 pb-4">
                {STAGES.map(stage => (
                  <div key={stage} className="flex h-full w-80 flex-shrink-0 flex-col rounded-xl border bg-muted/30">
                    <div className="border-b p-4">
                      <h3 className="font-semibold capitalize text-foreground">
                        {stage} <span className="ml-2 text-sm text-muted-foreground">{columns[stage].length}</span>
                      </h3>
                    </div>
                    
                    <Droppable droppableId={stage}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 overflow-y-auto p-4 transition-colors ${
                            snapshot.isDraggingOver ? 'bg-muted/50' : ''
                          }`}
                        >
                          <div className="flex flex-col gap-3">
                            {columns[stage].map((app, index) => (
                              <Draggable key={app._id} draggableId={app._id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`rounded-lg border bg-card p-4 shadow-sm transition-shadow ${
                                      snapshot.isDragging ? 'shadow-md ring-2 ring-primary/20' : ''
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <p className="font-medium text-card-foreground">
                                          {app.candidateId?.name || 'Unknown Candidate'}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                          Applied {new Date(app.createdAt).toLocaleDateString()}
                                        </p>
                                      </div>
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
                ))}
              </div>
            </DragDropContext>
          )}
        </main>
      </div>
    </div>
  );
}
