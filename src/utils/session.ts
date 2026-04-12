import { env } from '../config/env';

export const SESSION_IDLE_TIMEOUT_CODE = 'SESSION_IDLE_TIMEOUT';
export const SESSION_IDLE_TIMEOUT_MESSAGE = `Session expired due to ${env.sessionIdleTimeoutMinutes} minutes of inactivity. Please login again.`;
export const INVALID_SESSION_CODE = 'INVALID_SESSION';
export const INVALID_SESSION_MESSAGE = 'User session is no longer valid';

export const SESSION_IDLE_TIMEOUT_MS = env.sessionIdleTimeoutMinutes * 60 * 1000;

export const isSessionIdleExpired = (lastActivityAt: Date, now: Date): boolean => {
  return now.getTime() - lastActivityAt.getTime() > SESSION_IDLE_TIMEOUT_MS;
};
