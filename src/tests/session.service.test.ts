import assert from 'node:assert/strict';
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

const createRepository = (initialLastActivityAt: Date) => {
  const sessions = new Map([
    [
      'session-1',
      {
        id: 'session-1',
        userId: 1,
        lastActivityAt: initialLastActivityAt,
        invalidatedAt: null as Date | null,
        invalidationReason: null as string | null,
      },
    ],
  ]);

  const users = new Map([[1, createUser()]]);

  return {
    repository: {
      async createSession() {
        throw new Error('Not implemented in test');
      },
      async findSessionById(sessionId: string) {
        return sessions.get(sessionId) ?? null;
      },
      async findActiveById(id: number) {
        return users.get(id) ?? null;
      },
      async touchSession(sessionId: string, lastActivityAt: Date) {
        const session = sessions.get(sessionId);

        if (!session || session.invalidatedAt) {
          return false;
        }

        session.lastActivityAt = lastActivityAt;

        return true;
      },
      async invalidateSession(sessionId: string, invalidatedAt: Date, invalidationReason: string) {
        const session = sessions.get(sessionId);

        if (!session) {
          return false;
        }

        session.invalidatedAt ??= invalidatedAt;
        session.invalidationReason ??= invalidationReason;

        return true;
      },
    },
    sessions,
  };
};

test('session stays valid when there is authenticated activity before 15 minutes', async () => {
  const { createSessionService } = await import('../services/session.service.js');
  const now = new Date('2026-04-12T10:14:59.000Z');
  const { repository } = createRepository(new Date('2026-04-12T10:00:00.000Z'));
  const service = createSessionService({
    repository,
    now: () => now,
    createSessionId: () => 'new-session',
  });

  const result = await service.validateSession('session-1', 1);

  assert.equal(result.status, 'active');
});

test('session expires after more than 15 minutes of inactivity', async () => {
  const { createSessionService } = await import('../services/session.service.js');
  const now = new Date('2026-04-12T10:15:01.000Z');
  const { repository, sessions } = createRepository(new Date('2026-04-12T10:00:00.000Z'));
  const service = createSessionService({
    repository,
    now: () => now,
    createSessionId: () => 'new-session',
  });

  const result = await service.validateSession('session-1', 1);

  assert.equal(result.status, 'expired');
  assert.equal(sessions.get('session-1')?.invalidationReason, 'idle_timeout');
  assert.ok(sessions.get('session-1')?.invalidatedAt instanceof Date);
});

test('expired session remains rejected until the user logs in again', async () => {
  const { createSessionService } = await import('../services/session.service.js');
  const baseTime = new Date('2026-04-12T10:16:00.000Z');
  const { repository } = createRepository(new Date('2026-04-12T10:00:00.000Z'));
  const service = createSessionService({
    repository,
    now: () => baseTime,
    createSessionId: () => 'new-session',
  });

  const firstAttempt = await service.validateSession('session-1', 1);
  const secondAttempt = await service.validateSession('session-1', 1);

  assert.equal(firstAttempt.status, 'expired');
  assert.equal(secondAttempt.status, 'invalid');
});
