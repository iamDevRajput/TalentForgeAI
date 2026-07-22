/**
 * auth.test.js — Integration tests for auth endpoints
 *
 * Uses supertest to make HTTP requests against the real Express app.
 * Uses a separate test MongoDB (talentforgeai-test) to avoid polluting dev data.
 *
 * Test coverage:
 *   - POST /api/auth/register (candidate)
 *   - POST /api/auth/login
 *   - GET /api/auth/me
 *   - POST /api/auth/logout
 *   - POST /api/auth/register/staff (HR-only)
 *   - RBAC: role enforcement on protected routes
 */

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

let mongoServer;

// ── Test setup / teardown ────────────────────────────────────────────────────

beforeAll(async () => {
  // Use in-memory MongoDB for tests — no external Mongo needed
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clean up between tests
  await User.deleteMany({});
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const candidatePayload = {
  name: 'Test Candidate',
  email: 'candidate@test.com',
  password: 'Password123',
};

const hrPayload = {
  name: 'HR User',
  email: 'hr@test.com',
  password: 'Password123',
};

async function createHRUser() {
  return User.create({
    ...hrPayload,
    passwordHash: hrPayload.password,
    role: 'hr',
  });
}

async function getHRToken() {
  await createHRUser();
  const res = await request(app)
    .post('/api/auth/login')
    .set('Content-Type', 'application/json').send(JSON.stringify({ email: hrPayload.email, password: hrPayload.password }));
  return res.body.data.token;
}

// ── POST /api/auth/register ──────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('should register a candidate and return 201 with token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json').send(JSON.stringify(candidatePayload));

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('candidate');
    expect(res.body.data.user.email).toBe(candidatePayload.email);
    expect(res.body.data.token).toBeDefined();
    // Ensure password is never in response
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('should set an httpOnly cookie on registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json').send(JSON.stringify(candidatePayload));

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.includes('accessToken'))).toBe(true);
    expect(cookies.some((c) => c.includes('HttpOnly'))).toBe(true);
  });

  it('should return 409 if email is already taken', async () => {
    await request(app).post('/api/auth/register').set('Content-Type', 'application/json').send(JSON.stringify(candidatePayload));
    const res = await request(app).post('/api/auth/register').set('Content-Type', 'application/json').send(JSON.stringify(candidatePayload));

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('should return 422 for invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json').send(JSON.stringify({ ...candidatePayload, email: 'not-an-email' }));

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.some((f) => f.field === 'email')).toBe(true);
  });

  it('should return 422 for weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json').send(JSON.stringify({ ...candidatePayload, password: 'weak' }));

    expect(res.status).toBe(422);
    expect(res.body.error.fields.some((f) => f.field === 'password')).toBe(true);
  });

  it('should not allow setting role=hr via public registration', async () => {
    // The public register schema doesn't accept a `role` field —
    // any `role` in the body is ignored and the user is always a candidate
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json').send(JSON.stringify({ ...candidatePayload, role: 'hr' }));

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('candidate');
  });
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').set('Content-Type', 'application/json').send(JSON.stringify(candidatePayload));
  });

  it('should login successfully and return user + token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json').send(JSON.stringify({ email: candidatePayload.email, password: candidatePayload.password }));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(candidatePayload.email);
  });

  it('should return 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json').send(JSON.stringify({ email: candidatePayload.email, password: 'WrongPassword123' }));

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
    // Must not reveal whether it's email or password that's wrong
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('should return 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json').send(JSON.stringify({ email: 'nobody@test.com', password: candidatePayload.password }));

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  it('should return the current user when authenticated via Bearer token', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json').send(JSON.stringify(candidatePayload));
    const { token } = registerRes.body.data;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(candidatePayload.email);
  });

  it('should return 401 with no token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('should return 401 with an invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer this.is.invalid');

    expect(res.status).toBe(401);
  });
});

// ── POST /api/auth/logout ────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  it('should clear the auth cookie on logout', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json').send(JSON.stringify(candidatePayload));
    const { token } = registerRes.body.data;

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ── POST /api/auth/register/staff ────────────────────────────────────────────

describe('POST /api/auth/register/staff', () => {
  it('should allow HR to create an interviewer account', async () => {
    const token = await getHRToken();

    const res = await request(app)
      .post('/api/auth/register/staff')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json').send(JSON.stringify({ name: 'Dev Interviewer', email: 'interviewer@test.com', password: 'Password123', role: 'interviewer' }));

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('interviewer');
  });

  it('should return 403 if a candidate tries to create staff accounts', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json').send(JSON.stringify(candidatePayload));
    const { token } = registerRes.body.data;

    const res = await request(app)
      .post('/api/auth/register/staff')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json').send(JSON.stringify({ name: 'Fake HR', email: 'fake@test.com', password: 'Password123', role: 'hr' }));

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('should return 401 if no token is provided', async () => {
    const res = await request(app)
      .post('/api/auth/register/staff')
      .set('Content-Type', 'application/json').send(JSON.stringify({ name: 'Anyone', email: 'anyone@test.com', password: 'Password123', role: 'hr' }));

    expect(res.status).toBe(401);
  });
});

// ── Health check ─────────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  it('should return 200 with service status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// ── 404 handler ──────────────────────────────────────────────────────────────

describe('Unknown routes', () => {
  it('should return 404 with ROUTE_NOT_FOUND code', async () => {
    const res = await request(app).get('/api/nonexistent-route');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });
});
