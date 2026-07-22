import { jest } from '@jest/globals';

jest.unstable_mockModule('mime', () => ({
  default: {
    getType: () => 'application/json',
    getExtension: () => 'json'
  },
  getType: () => 'application/json',
  getExtension: () => 'json'
}));

const { default: request } = await import('supertest');
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Job from '../src/models/Job.js';
import AuditLog from '../src/models/AuditLog.js';

let mongoServer;
let hrToken;
let hrUser;
let candidateToken;
let candidateUser;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Setup HR user
  const hrPayload = {
    name: 'HR Manager',
    email: 'hr@test.com',
    password: 'Password123',
    role: 'hr'
  };
  hrUser = await User.create({
    ...hrPayload,
    passwordHash: hrPayload.password,
  });

  const resHr = await request(app)
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .send(JSON.stringify({ email: hrPayload.email, password: hrPayload.password }));
  hrToken = resHr.body.data.token;

  // Setup Candidate user
  const candPayload = {
    name: 'John Candidate',
    email: 'john@test.com',
    password: 'Password123',
    role: 'candidate'
  };
  candidateUser = await User.create({
    ...candPayload,
    passwordHash: candPayload.password,
  });

  const resCand = await request(app)
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .send(JSON.stringify({ email: candPayload.email, password: candPayload.password }));
  candidateToken = resCand.body.data.token;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

afterEach(async () => {
  await Job.deleteMany({});
  await AuditLog.deleteMany({});
});

describe('Job Management Module', () => {
  describe('POST /api/jobs', () => {
    it('should allow HR to create a job and default status to draft', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${hrToken}`)
        .set('Content-Type', 'application/json')
        .send(
          JSON.stringify({
            title: 'Senior Engineer',
            department: 'Engineering',
            description: 'We are looking for a senior engineer.',
            requirements: ['Node.js', 'React'],
          })
        );

      expect(res.status).toBe(201);
      expect(res.body.data.job.status).toBe('draft');
      expect(res.body.data.job.title).toBe('Senior Engineer');

      const logs = await AuditLog.find({ action: 'CREATE_JOB' });
      expect(logs.length).toBe(1);
    });

    it('should return 403 if a candidate attempts to create a job (RBAC boundary)', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${candidateToken}`)
        .set('Content-Type', 'application/json')
        .send(
          JSON.stringify({
            title: 'Hacked Job',
            department: 'Engineering',
            description: 'I should not be able to post this.',
          })
        );

      expect(res.status).toBe(403);
    });

    it('should return 401 for unauthenticated create attempt', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Content-Type', 'application/json')
        .send(
          JSON.stringify({
            title: 'Ghost Job',
            department: 'Engineering',
            description: 'No auth',
          })
        );

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/jobs', () => {
    beforeEach(async () => {
      await Job.create([
        {
          title: 'Draft Job',
          department: 'Eng',
          description: 'Draft desc',
          status: 'draft',
          createdBy: hrUser._id,
        },
        {
          title: 'Open Job',
          department: 'Eng',
          description: 'Open desc',
          status: 'open',
          createdBy: hrUser._id,
        },
        {
          title: 'Closed Job',
          department: 'Eng',
          description: 'Closed desc',
          status: 'closed',
          createdBy: hrUser._id,
        },
      ]);
    });

    it('should allow HR to see all jobs (draft, open, closed)', async () => {
      const res = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.jobs.length).toBe(3);
    });

    it('should restrict candidate visibility strictly to "open" jobs', async () => {
      const res = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.jobs.length).toBe(1);
      expect(res.body.data.jobs[0].title).toBe('Open Job');
      expect(res.body.data.jobs[0].createdBy).toBeUndefined();
    });
  });

  describe('GET /api/jobs/:id', () => {
    let draftJobId;

    beforeEach(async () => {
      const job = await Job.create({
        title: 'Secret Draft Job',
        department: 'Eng',
        description: 'Draft desc',
        status: 'draft',
        createdBy: hrUser._id,
      });
      draftJobId = job._id.toString();
    });

    it('should return 404 (not 403) when a candidate requests a draft job', async () => {
      const res = await request(app)
        .get(`/api/jobs/${draftJobId}`)
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/jobs/:id/status & PATCH /api/jobs/:id', () => {
    let jobId;

    beforeEach(async () => {
      const job = await Job.create({
        title: 'Initial Draft Job',
        department: 'Eng',
        description: 'Draft desc',
        status: 'draft',
        createdBy: hrUser._id,
      });
      jobId = job._id.toString();
    });

    it('should allow HR to transition a job from draft to open and create an audit log', async () => {
      const res = await request(app)
        .patch(`/api/jobs/${jobId}/status`)
        .set('Authorization', `Bearer ${hrToken}`)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ status: 'open' }));

      expect(res.status).toBe(200);
      expect(res.body.data.job.status).toBe('open');

      const logs = await AuditLog.find({ action: 'UPDATE_JOB_STATUS' });
      expect(logs.length).toBe(1);
      expect(logs[0].metadata.body.status).toBe('open');
    });

    it('should reject invalid transitions (open -> draft)', async () => {
      await Job.findByIdAndUpdate(jobId, { status: 'open' });

      const res = await request(app)
        .patch(`/api/jobs/${jobId}/status`)
        .set('Authorization', `Bearer ${hrToken}`)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ status: 'draft' }));

      expect(res.status).toBe(422);
    });

    it('should reject edits to a closed job', async () => {
      await Job.findByIdAndUpdate(jobId, { status: 'closed' });

      const res = await request(app)
        .patch(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${hrToken}`)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ title: 'New Title' }));

      expect(res.status).toBe(400);
    });

    it('should silently ignore attempts to overwrite status or createdBy via updateJob', async () => {
      // Create and open a job as HR
      await Job.findByIdAndUpdate(jobId, { status: 'open' });
      
      const newCreatorId = new mongoose.Types.ObjectId().toString();

      // PATCH it with a body that includes status and createdBy alongside a legitimate field
      const res = await request(app)
        .patch(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${hrToken}`)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ 
          title: 'Safe Title Update',
          status: 'closed', // Should be ignored
          createdBy: newCreatorId // Should be ignored
        }));

      expect(res.status).toBe(200);
      expect(res.body.data.job.title).toBe('Safe Title Update');

      // Assert that job.status and job.createdBy in the DB are unchanged
      const updatedJob = await Job.findById(jobId);
      expect(updatedJob.title).toBe('Safe Title Update');
      expect(updatedJob.status).toBe('open');
      expect(updatedJob.createdBy.toString()).toBe(hrUser._id.toString());
    });
  });
});
