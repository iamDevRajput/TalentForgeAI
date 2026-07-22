import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Job from '../src/models/Job.js';
import Application from '../src/models/Application.js';
import AuditLog from '../src/models/AuditLog.js';

// Mock the Cloudinary upload helper
jest.mock('../src/modules/uploads/upload.service.js', () => ({
  uploadResumeToCloudinary: jest.fn(),
}));
import { uploadResumeToCloudinary } from '../src/modules/uploads/upload.service.js';

let mongoServer;
let hrToken;
let hrUser;
let candidateTokenA;
let candidateUserA;
let candidateTokenB;
let candidateUserB;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Setup HR
  hrUser = await User.create({
    name: 'HR User',
    email: 'hr@example.com',
    passwordHash: 'hashedpassword',
    role: 'hr',
  });
  const hrRes = await request(app).post('/api/auth/login').send({
    email: 'hr@example.com',
    password: 'Password123!',
  });
  hrToken = hrRes.body.data.token;

  // Setup Candidate A
  candidateUserA = await User.create({
    name: 'Candidate A',
    email: 'candA@example.com',
    passwordHash: 'hashedpassword',
    role: 'candidate',
  });
  const candResA = await request(app).post('/api/auth/login').send({
    email: 'candA@example.com',
    password: 'Password123!',
  });
  candidateTokenA = candResA.body.data.token;

  // Setup Candidate B
  candidateUserB = await User.create({
    name: 'Candidate B',
    email: 'candB@example.com',
    passwordHash: 'hashedpassword',
    role: 'candidate',
  });
  const candResB = await request(app).post('/api/auth/login').send({
    email: 'candB@example.com',
    password: 'Password123!',
  });
  candidateTokenB = candResB.body.data.token;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

afterEach(async () => {
  await Application.deleteMany({});
  await AuditLog.deleteMany({});
  jest.clearAllMocks();
});

describe('Application Module', () => {
  let openJob;
  let draftJob;
  let closedJob;
  let pdfBuffer;

  beforeAll(async () => {
    openJob = await Job.create({
      title: 'Open Job',
      department: 'Eng',
      description: 'Desc',
      status: 'open',
      createdBy: hrUser._id,
    });
    draftJob = await Job.create({
      title: 'Draft Job',
      department: 'Eng',
      description: 'Desc',
      status: 'draft',
      createdBy: hrUser._id,
    });
    closedJob = await Job.create({
      title: 'Closed Job',
      department: 'Eng',
      description: 'Desc',
      status: 'closed',
      createdBy: hrUser._id,
    });
    pdfBuffer = Buffer.from('fake pdf content');
  });

  describe('POST /api/applications/:jobId', () => {
    it('1. Candidate applies to an open job → 201, resume metadata stored correctly', async () => {
      uploadResumeToCloudinary.mockResolvedValueOnce({ secure_url: 'https://cloudinary.com/resume.pdf' });

      const res = await request(app)
        .post(`/api/applications/${openJob._id}`)
        .set('Authorization', `Bearer ${candidateTokenA}`)
        .attach('resume', pdfBuffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(201);
      expect(res.body.data.application.resumeUrl).toBe('https://cloudinary.com/resume.pdf');
      
      const auditLog = await AuditLog.findOne({ action: 'SUBMIT_APPLICATION' });
      expect(auditLog).toBeTruthy();
    });

    it('2. Candidate applies to a draft job → 404', async () => {
      const res = await request(app)
        .post(`/api/applications/${draftJob._id}`)
        .set('Authorization', `Bearer ${candidateTokenA}`)
        .attach('resume', pdfBuffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(404);
    });

    it('3. Candidate applies to a closed job → 404', async () => {
      const res = await request(app)
        .post(`/api/applications/${closedJob._id}`)
        .set('Authorization', `Bearer ${candidateTokenA}`)
        .attach('resume', pdfBuffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(404);
    });

    it('4. Candidate applies twice to the same open job → 409 on the second attempt', async () => {
      uploadResumeToCloudinary.mockResolvedValue({ secure_url: 'https://url' });

      await request(app)
        .post(`/api/applications/${openJob._id}`)
        .set('Authorization', `Bearer ${candidateTokenA}`)
        .attach('resume', pdfBuffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

      const res = await request(app)
        .post(`/api/applications/${openJob._id}`)
        .set('Authorization', `Bearer ${candidateTokenA}`)
        .attach('resume', pdfBuffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/already applied/i);
    });

    it('5. HR attempts to apply to a job → 403', async () => {
      const res = await request(app)
        .post(`/api/applications/${openJob._id}`)
        .set('Authorization', `Bearer ${hrToken}`)
        .attach('resume', pdfBuffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(403);
    });

    it('6. Unauthenticated apply attempt → 401', async () => {
      const res = await request(app)
        .post(`/api/applications/${openJob._id}`)
        .attach('resume', pdfBuffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(401);
    });

    it('10. Reject a non-PDF/DOCX file upload → 422', async () => {
      const res = await request(app)
        .post(`/api/applications/${openJob._id}`)
        .set('Authorization', `Bearer ${candidateTokenA}`)
        .attach('resume', Buffer.from('fake exe'), { filename: 'virus.exe', contentType: 'application/x-msdownload' });

      expect(res.status).toBe(422);
      expect(res.body.error.message).toMatch(/Invalid file extension/);
    });

    it('11. Reject an oversized file upload → 422', async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
      const res = await request(app)
        .post(`/api/applications/${openJob._id}`)
        .set('Authorization', `Bearer ${candidateTokenA}`)
        .attach('resume', largeBuffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(422);
      expect(res.body.error.message).toMatch(/exceed 5MB/i);
    });

    it('12. Verify Cloudinary upload failure is handled gracefully', async () => {
      uploadResumeToCloudinary.mockRejectedValueOnce(new Error('Cloudinary timeout'));

      const res = await request(app)
        .post(`/api/applications/${openJob._id}`)
        .set('Authorization', `Bearer ${candidateTokenA}`)
        .attach('resume', pdfBuffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(500); // Because it is an unhandled Error but wrapped by errorHandler
      // Or 502 if mapped in the service. The service throws 502 in our implementation!
      expect(res.status).toBe(502);
      expect(res.body.error.message).toBe('Failed to upload file to storage service');
      expect(res.body.error).not.toHaveProperty('stack');
    });
  });

  describe('GET /api/applications/my', () => {
    it('7. Candidate A cannot see Candidate B\'s applications', async () => {
      uploadResumeToCloudinary.mockResolvedValue({ secure_url: 'https://url' });

      // A applies
      await request(app)
        .post(`/api/applications/${openJob._id}`)
        .set('Authorization', `Bearer ${candidateTokenA}`)
        .attach('resume', pdfBuffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

      // B applies
      await request(app)
        .post(`/api/applications/${openJob._id}`)
        .set('Authorization', `Bearer ${candidateTokenB}`)
        .attach('resume', pdfBuffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

      const res = await request(app)
        .get('/api/applications/my')
        .set('Authorization', `Bearer ${candidateTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.applications.length).toBe(1);
      expect(res.body.data.applications[0].candidateId.toString()).toBe(candidateUserA._id.toString());
    });
  });

  describe('GET /api/applications/job/:jobId', () => {
    it('8. HR can see all applications for a job', async () => {
      uploadResumeToCloudinary.mockResolvedValue({ secure_url: 'https://url' });

      await request(app)
        .post(`/api/applications/${openJob._id}`)
        .set('Authorization', `Bearer ${candidateTokenA}`)
        .attach('resume', pdfBuffer, { filename: 'resume.pdf', contentType: 'application/pdf' });
      
      const res = await request(app)
        .get(`/api/applications/job/${openJob._id}`)
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.applications.length).toBe(1);
    });

    it('9. Candidate attempts GET /job/:jobId (HR-only route) → 403', async () => {
      const res = await request(app)
        .get(`/api/applications/job/${openJob._id}`)
        .set('Authorization', `Bearer ${candidateTokenA}`);

      expect(res.status).toBe(403);
    });
  });
});
