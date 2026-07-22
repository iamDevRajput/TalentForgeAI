import { jest } from '@jest/globals';
const { default: request } = await import('supertest');
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';

const { default: app } = await import('../src/app.js');
import User from '../src/models/User.js';
import Job from '../src/models/Job.js';
import Application from '../src/models/Application.js';
import { Interview } from '../src/models/Interview.js';

let mongoServer;

describe('Phase 5: Interview Module', () => {
  let hrUser, interviewerUser, candidateUser;
  let hrToken, interviewerToken, candidateToken;
  let testJob, testApp;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Job.deleteMany({});
    await Application.deleteMany({});
    await Interview.deleteMany({});

    // 1. Create HR User
    hrUser = await User.create({
      name: 'HR User',
      email: 'hr.interview@test.com',
      passwordHash: 'hashedpassword',
      role: 'hr'
    });
    hrToken = jwt.sign({ sub: hrUser._id, role: hrUser.role }, env.JWT_SECRET);

    // 2. Create Interviewer User
    interviewerUser = await User.create({
      name: 'Interviewer',
      email: 'interviewer@test.com',
      passwordHash: 'hashedpassword',
      role: 'interviewer'
    });
    interviewerToken = jwt.sign({ sub: interviewerUser._id, role: interviewerUser.role }, env.JWT_SECRET);

    // 3. Create Candidate User
    candidateUser = await User.create({
      name: 'Candidate',
      email: 'candidate.interview@test.com',
      passwordHash: 'hashedpassword',
      role: 'candidate'
    });
    candidateToken = jwt.sign({ sub: candidateUser._id, role: candidateUser.role }, env.JWT_SECRET);

    // 4. Create Job
    testJob = await Job.create({
      title: 'Backend Developer',
      department: 'Engineering',
      location: 'Remote',
      description: 'Test job',
      requirements: ['Node.js'],
      salaryMin: 100000,
      salaryMax: 150000,
      createdBy: hrUser._id,
      status: 'open'
    });

    // 5. Create Application
    testApp = await Application.create({
      jobId: testJob._id,
      candidateId: candidateUser._id,
      resumeUrl: 'https://cloudinary.com/test-resume.pdf',
      status: 'screening'
    });
  });

  describe('POST /api/interviews/schedule', () => {
    it('should successfully schedule an interview and update application stage', async () => {
      const scheduledAt = new Date();
      scheduledAt.setDate(scheduledAt.getDate() + 2); // 2 days in future

      const res = await request(app)
        .post('/api/interviews/schedule')
        .set('Authorization', `Bearer ${hrToken}`)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({
          applicationId: testApp._id.toString(),
          interviewerId: interviewerUser._id.toString(),
          scheduledAt: scheduledAt.toISOString(),
          durationMinutes: 45,
          meetingLink: 'https://zoom.us/j/123456789'
        }));

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.interview).toBeDefined();
      expect(res.body.data.interview.status).toBe('scheduled');

      // Verify application stage updated to interviewing
      const updatedApp = await Application.findById(testApp._id);
      expect(updatedApp.status).toBe('interviewing');
    });

    it('should reject non-HR users', async () => {
      const scheduledAt = new Date();
      scheduledAt.setDate(scheduledAt.getDate() + 2);

      const res = await request(app)
        .post('/api/interviews/schedule')
        .set('Authorization', `Bearer ${interviewerToken}`)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({
          applicationId: testApp._id.toString(),
          interviewerId: interviewerUser._id.toString(),
          scheduledAt: scheduledAt.toISOString(),
        }));

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/interviews/:id/feedback', () => {
    let testInterview;

    beforeEach(async () => {
      const scheduledAt = new Date();
      scheduledAt.setDate(scheduledAt.getDate() - 1); // past

      testInterview = await Interview.create({
        applicationId: testApp._id,
        interviewerId: interviewerUser._id,
        scheduledAt,
        durationMinutes: 60,
        status: 'scheduled'
      });
    });

    it('should successfully submit feedback and mark as completed', async () => {
      const res = await request(app)
        .post(`/api/interviews/${testInterview._id}/feedback`)
        .set('Authorization', `Bearer ${interviewerToken}`)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({
          rating: 4,
          notes: 'Strong candidate, solid Node.js knowledge'
        }));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.interview.status).toBe('completed');
      expect(res.body.data.interview.feedback.rating).toBe(4);
    });

    it('should reject feedback from a different user', async () => {
      // HR tries to submit feedback for Interviewer's interview
      const res = await request(app)
        .post(`/api/interviews/${testInterview._id}/feedback`)
        .set('Authorization', `Bearer ${hrToken}`)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({
          rating: 4,
          notes: 'Great'
        }));

      expect(res.status).toBe(403);
    });
  });
});
