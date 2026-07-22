/**
 * HRDashboard.jsx — HR role dashboard shell
 *
 * Phase 1: Shows a proper empty state with upcoming phase roadmap.
 * Phase 2: Job management cards replace this shell.
 *
 * Layout: NavBar (top) + Sidebar (left) + main content area
 */

import NavBar from '@/shared/components/NavBar';
import Sidebar from '@/shared/components/Sidebar';
import JobsView from '../jobs/JobsView';

export default function HRDashboard() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <NavBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto max-w-5xl">
            <JobsView />
          </div>
        </main>
      </div>
    </div>
  );
}
