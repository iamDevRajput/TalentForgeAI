# TalentForgeAI

TalentForgeAI is a streamlined ATS platform for modern hiring teams, unifying job posting, applicant tracking, and AI-assisted candidate evaluation into a single ecosystem. 

## Architecture
This is an NPM workspaces monorepo:
- `frontend/` - React 19 + Vite + Tailwind CSS v4 + Zustand + TanStack Query
- `backend/` - Node.js + Express 4 + MongoDB + Redis + Jest

## Prerequisites
- Node.js (v20+ recommended)
- MongoDB (running locally or a cloud URI)
- Redis (running locally or a cloud URI)

## Setup Instructions

1. **Install Dependencies**
   From the repository root, install all dependencies for both the frontend and backend workspaces:
   ```bash
   npm run install:all
   ```

2. **Configure Environment Variables**
   In the `backend/` directory, copy the example environment file:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Open `backend/.env` and configure your `MONGODB_URI`, `REDIS_URI`, and a secure `JWT_SECRET`.

   In the `frontend/` directory, copy the example environment file (if available):
   ```bash
   cp frontend/.env.example frontend/.env
   ```
   By default, the frontend points to `http://localhost:5000/api` for backend requests.

3. **Running the Development Server**
   Start both the frontend and backend servers concurrently from the root directory:
   ```bash
   npm run dev
   ```
   - Frontend will be available at: http://localhost:5173
   - Backend will be available at: http://localhost:5000

## Scripts
From the root directory, you can run:
- `npm run dev` - Starts both frontend and backend development servers.
- `npm run dev:backend` - Starts only the backend dev server.
- `npm run dev:frontend` - Starts only the frontend dev server.
- `npm test` - Runs the backend integration tests.
- `npm run lint` - Runs ESLint on the backend and Oxlint on the frontend.

## Testing
To run the backend integration test suite (requires an active environment, though MongoDB in-memory server is used for testing):
```bash
npm run test
```

## Phase 2: Job Management Module
Phase 2 introduces the core Job management lifecycle, with robust RBAC built into the service layer and React Hook Form powered UI on the frontend.

### Added Folders
- `backend/src/modules/jobs/` - Contains the Job domain logic (controller, service, routes, validator).
- `frontend/src/features/jobs/` - Contains the HR Dashboard job view and creation modal components.
- `frontend/src/shared/api/` - Extracted the shared Axios instance here.

### New APIs
- `POST /api/jobs` - Create a new job (HR only).
- `GET /api/jobs` - List all jobs (Paginated). HR sees all; Candidates see only `open`.
- `GET /api/jobs/:id` - Get specific job details.
- `PATCH /api/jobs/:id` - Edit job details (HR only).
- `PATCH /api/jobs/:id/status` - Change job status (HR only).

### Job Lifecycle & State Transitions
Jobs enforce a strict state machine implemented in the backend service:
1. **draft** - The initial state when a job is created. Only visible to HR.
2. **open** - Actively accepting candidates. Visible to everyone.
3. **closed** - The position is filled or paused. Visible only to HR.

Valid State Transitions:
- `draft` → `open`
- `open` → `closed`
*(Note: Closed jobs are permanently locked and cannot be edited or reverted).*

### Test Summary
- **Backend Tests:** Extensive integration testing covers RBAC boundaries, query-level visibility filters, and state machine validation.
- **Coverage:** Total 27 robust backend tests currently pass out of 27 across Auth and Job modules.
- **Audit Logging:** Verified AuditLogs are correctly created during `CREATE_JOB` and `UPDATE_JOB_STATUS` operations.
