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
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';

const { default: app } = await import('../src/app.js');
const { default: User } = await import('../src/models/User.js');
const { default: Job } = await import('../src/models/Job.js');
const { default: Application } = await import('../src/models/Application.js');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
  await Job.deleteMany({});
  await Application.deleteMany({});
});

describe('Phase 4: Application Pipeline & State Machine', () => {
  let hrToken, candidateToken;
  let hrUser, candidateUser;
  let testJob;
  let testApp;

  beforeEach(async () => {
    // 1. Create HR User
    hrUser = await User.create({
      name: 'HR User',
      email: 'hr.pipeline@test.com',
      passwordHash: 'hashedpassword',
      role: 'hr'
    });
    hrToken = jwt.sign({ sub: hrUser._id, role: hrUser.role }, env.JWT_SECRET);

    // 2. Create Candidate User
    candidateUser = await User.create({
      name: 'Candidate User',
      email: 'candidate.pipeline@test.com',
      passwordHash: 'hashedpassword',
      role: 'candidate'
    });
    candidateToken = jwt.sign({ sub: candidateUser._id, role: candidateUser.role }, env.JWT_SECRET);

    // 3. Create a Job
    testJob = await Job.create({
      title: 'Pipeline Job',
      department: 'Engineering',
      description: 'Job for testing the pipeline',
      requirements: ['Node.js'],
      status: 'open',
      createdBy: hrUser._id
    });

    // 4. Create an Application directly in DB for testing transitions
    testApp = await Application.create({
      jobId: testJob._id,
      candidateId: candidateUser._id,
      resumeUrl: 'https://cloudinary.com/dummy.pdf',
      status: 'applied',
      timeline: [{
        status: 'applied',
        changedBy: candidateUser._id,
        notes: 'Application submitted',
      }]
    });
  });

  describe('PATCH /api/applications/:id/stage', () => {

    it('should successfully transition applied -> screening and append to timeline', async () => {
      const res = await request(app)
        .patch(`/api/applications/${testApp._id}/stage`)
        .set('Authorization', `Bearer ${hrToken}`)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ status: 'screening', notes: 'Looks good' }));

      expect(res.status).toBe(200);
      expect(res.body.data.application.status).toBe('screening');
      
      const timeline = res.body.data.application.timeline;
      expect(timeline.length).toBe(2);
      expect(timeline[1].status).toBe('screening');
      expect(timeline[1].notes).toBe('Looks good');
      expect(timeline[1].changedBy).toBe(hrUser._id.toString());
    });

    it('should reject unauthorized stage movement (candidate token)', async () => {
      const res = await request(app)
        .patch(`/api/applications/${testApp._id}/stage`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ status: 'screening' }));

      expect(res.status).toBe(403);
    });

    it('should reject invalid stage transitions (applied -> offered)', async () => {
      const res = await request(app)
        .patch(`/api/applications/${testApp._id}/stage`)
        .set('Authorization', `Bearer ${hrToken}`)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ status: 'offered' }));

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/Invalid transition/i);
    });

    it('should enforce hired as a terminal state (cannot transition after hired)', async () => {
      // Manually set to hired
      testApp.status = 'hired';
      await testApp.save();

      const res = await request(app)
        .patch(`/api/applications/${testApp._id}/stage`)
        .set('Authorization', `Bearer ${hrToken}`)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ status: 'rejected' }));

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/Cannot transition from terminal state/i);
    });

    it('should enforce rejected as a terminal state (cannot transition after rejected)', async () => {
      // Manually set to rejected
      testApp.status = 'rejected';
      await testApp.save();

      const res = await request(app)
        .patch(`/api/applications/${testApp._id}/stage`)
        .set('Authorization', `Bearer ${hrToken}`)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ status: 'screening' }));

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/Cannot transition from terminal state/i);
    });

    it('should allow transitioning to rejected from any non-terminal state', async () => {
      // Set to interviewing
      testApp.status = 'interviewing';
      await testApp.save();

      const res = await request(app)
        .patch(`/api/applications/${testApp._id}/stage`)
        .set('Authorization', `Bearer ${hrToken}`)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ status: 'rejected' }));

      expect(res.status).toBe(200);
      expect(res.body.data.application.status).toBe('rejected');
    });
  });
});
