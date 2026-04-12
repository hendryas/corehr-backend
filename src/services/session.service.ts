import crypto from 'crypto';

import { authRepository } from '../repositories/auth.repository';
import { AuthenticatedSession, AuthenticatedUser } from '../types/auth';
import {
  INVALID_SESSION_MESSAGE,
  SESSION_IDLE_TIMEOUT_CODE,
  isSessionIdleExpired,
} from '../utils/session';

export type SessionInvalidationReason = 'idle_timeout' | 'logout' | 'user_inactive';

export type SessionValidationResult =
  | {
      status: 'active';
      user: AuthenticatedUser;
      session: AuthenticatedSession;
    }
  | {
      status: 'expired';
      session: AuthenticatedSession;
    }
  | {
      status: 'invalid';
    };

interface SessionRepository {
  createSession: (sessionId: string, userId: number, lastActivityAt: Date) => Promise<void>;
  findSessionById: (sessionId: string) => Promise<AuthenticatedSession | null>;
  findActiveById: (id: number) => Promise<AuthenticatedUser | null>;
  touchSession: (sessionId: string, lastActivityAt: Date) => Promise<boolean>;
  invalidateSession: (
    sessionId: string,
    invalidatedAt: Date,
    invalidationReason: string,
  ) => Promise<boolean>;
}

interface SessionServiceDependencies {
  repository: SessionRepository;
  now: () => Date;
  createSessionId: () => string;
}

export const createSessionService = ({
  repository,
  now,
  createSessionId,
}: SessionServiceDependencies) => {
  return {
    async createSession(userId: number): Promise<AuthenticatedSession> {
      const sessionId = createSessionId();
      const currentTime = now();

      await repository.createSession(sessionId, userId, currentTime);

      return {
        id: sessionId,
        userId,
        lastActivityAt: currentTime,
        invalidatedAt: null,
        invalidationReason: null,
      };
    },

    async validateSession(sessionId: string, userId: number): Promise<SessionValidationResult> {
      const session = await repository.findSessionById(sessionId);

      if (!session || session.userId !== userId || session.invalidatedAt) {
        return {
          status: 'invalid',
        };
      }

      const user = await repository.findActiveById(userId);

      if (!user) {
        await repository.invalidateSession(session.id, now(), 'user_inactive');

        return {
          status: 'invalid',
        };
      }

      if (isSessionIdleExpired(session.lastActivityAt, now())) {
        await repository.invalidateSession(session.id, now(), 'idle_timeout');

        return {
          status: 'expired',
          session,
        };
      }

      return {
        status: 'active',
        user,
        session,
      };
    },

    async touchSession(sessionId: string, lastActivityAt: Date): Promise<boolean> {
      return repository.touchSession(sessionId, lastActivityAt);
    },

    async logout(sessionId: string): Promise<boolean> {
      return repository.invalidateSession(sessionId, now(), 'logout');
    },
  };
};

export const sessionService = createSessionService({
  repository: authRepository,
  now: () => new Date(),
  createSessionId: () => crypto.randomUUID(),
});

export {
  INVALID_SESSION_MESSAGE,
  SESSION_IDLE_TIMEOUT_CODE,
};
