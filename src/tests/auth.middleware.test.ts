import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';

process.env.JWT_SECRET ??= 'test-secret';
process.env.DB_HOST ??= '127.0.0.1';
process.env.DB_USER ??= 'tester';
process.env.DB_NAME ??= 'corehr_test';

const createUser = () => ({
  id: 1,
  email: 'budi@corehr.local',
  role: 'employee' as const,
  sessionId: 'session-1',
  employeeCode: 'EMP-001',
  fullName: 'Budi',
  phone: null,
  gender: null,
  address: null,
  hireDate: '2025-01-01',
  isActive: true,
  departmentId: null,
  departmentName: null,
  positionId: null,
  positionName: null,
});

class MockResponse extends EventEmitter {
  statusCode = 200;
}

test('middleware updates last activity only after a successful protected request', async () => {
  const { createAuthenticate } = await import('../middlewares/auth.middleware.js');
  const touchedSessions: Array<{ sessionId: string; lastActivityAt: Date }> = [];
  const now = new Date('2026-04-12T10:00:00.000Z');
  const handler = createAuthenticate({
    verifyToken: () => ({
      id: 1,
      email: 'budi@corehr.local',
      role: 'employee',
      sessionId: 'session-1',
    }),
    validateSession: async () => ({
      status: 'active',
      user: createUser(),
      session: {
        id: 'session-1',
        userId: 1,
        lastActivityAt: new Date('2026-04-12T09:55:00.000Z'),
        invalidatedAt: null,
        invalidationReason: null,
      },
    }),
    touchSession: async (sessionId: string, lastActivityAt: Date) => {
      touchedSessions.push({ sessionId, lastActivityAt });
      return true;
    },
    now: () => now,
  });

  const req = {
    headers: {
      authorization: 'Bearer test-token',
    },
    logger: {
      error() {},
      warn() {},
    },
  };
  const res = new MockResponse();
  let nextError: unknown = null;

  await handler(req as never, res as never, (error?: unknown) => {
    nextError = error ?? null;
  });

  assert.equal(nextError, null);
  assert.equal(touchedSessions.length, 0);

  res.emit('finish');
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(touchedSessions.length, 1);
  assert.equal(touchedSessions[0]?.sessionId, 'session-1');
  assert.equal(touchedSessions[0]?.lastActivityAt.toISOString(), now.toISOString());
});

test('middleware does not update last activity when protected request ends with client error', async () => {
  const { createAuthenticate } = await import('../middlewares/auth.middleware.js');
  const touchedSessions: string[] = [];
  const handler = createAuthenticate({
    verifyToken: () => ({
      id: 1,
      email: 'budi@corehr.local',
      role: 'employee',
      sessionId: 'session-1',
    }),
    validateSession: async () => ({
      status: 'active',
      user: createUser(),
      session: {
        id: 'session-1',
        userId: 1,
        lastActivityAt: new Date('2026-04-12T09:55:00.000Z'),
        invalidatedAt: null,
        invalidationReason: null,
      },
    }),
    touchSession: async (sessionId: string) => {
      touchedSessions.push(sessionId);
      return true;
    },
    now: () => new Date('2026-04-12T10:00:00.000Z'),
  });

  const req = {
    headers: {
      authorization: 'Bearer test-token',
    },
    logger: {
      error() {},
      warn() {},
    },
  };
  const res = new MockResponse();
  res.statusCode = 400;

  await handler(req as never, res as never, () => undefined);
  res.emit('finish');
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(touchedSessions.length, 0);
});

test('middleware returns unauthorized error with SESSION_IDLE_TIMEOUT code when session is idle too long', async () => {
  const { createAuthenticate } = await import('../middlewares/auth.middleware.js');
  const handler = createAuthenticate({
    verifyToken: () => ({
      id: 1,
      email: 'budi@corehr.local',
      role: 'employee',
      sessionId: 'session-1',
    }),
    validateSession: async () => ({
      status: 'expired',
      session: {
        id: 'session-1',
        userId: 1,
        lastActivityAt: new Date('2026-04-12T09:40:00.000Z'),
        invalidatedAt: null,
        invalidationReason: null,
      },
    }),
    touchSession: async () => true,
    now: () => new Date('2026-04-12T10:00:00.000Z'),
  });

  const req = {
    headers: {
      authorization: 'Bearer test-token',
    },
    logger: {
      error() {},
      warn() {},
    },
  };
  const res = new MockResponse();
  let nextError: unknown = null;

  await handler(req as never, res as never, (error?: unknown) => {
    nextError = error ?? null;
  });

  assert.ok(nextError);
  assert.equal((nextError as { statusCode?: number }).statusCode, 401);
  assert.equal((nextError as { code?: string }).code, 'SESSION_IDLE_TIMEOUT');
});
