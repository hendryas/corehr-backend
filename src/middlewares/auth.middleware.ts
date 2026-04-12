import { RequestHandler } from 'express';

import { sessionService } from '../services/session.service';
import { JwtUserPayload } from '../types/auth';
import { AppError } from '../utils/app-error';
import { verifyAccessToken } from '../utils/jwt';
import { serializeError } from '../utils/logger';
import {
  INVALID_SESSION_CODE,
  INVALID_SESSION_MESSAGE,
  SESSION_IDLE_TIMEOUT_CODE,
  SESSION_IDLE_TIMEOUT_MESSAGE,
} from '../utils/session';

const getBearerToken = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

interface AuthenticateDependencies {
  verifyToken: (token: string) => JwtUserPayload;
  validateSession: typeof sessionService.validateSession;
  touchSession: typeof sessionService.touchSession;
  now: () => Date;
}

export const createAuthenticate = ({
  verifyToken,
  validateSession,
  touchSession,
  now,
}: AuthenticateDependencies): RequestHandler => {
  return async (req, res, next) => {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
      return next(new AppError('Missing or invalid Authorization header', 401));
    }

    const payload = verifyToken(token);

    if (!payload.sessionId) {
      return next(new AppError(INVALID_SESSION_MESSAGE, 401, null, INVALID_SESSION_CODE));
    }

    const validationResult = await validateSession(payload.sessionId, payload.id);

    if (validationResult.status === 'expired') {
      req.logger?.warn(
        {
          logType: 'audit',
          event: 'auth.session_idle_timeout',
          userId: payload.id,
          sessionId: payload.sessionId,
        },
        SESSION_IDLE_TIMEOUT_MESSAGE,
      );

      return next(new AppError(SESSION_IDLE_TIMEOUT_MESSAGE, 401, null, SESSION_IDLE_TIMEOUT_CODE));
    }

    if (validationResult.status === 'invalid') {
      return next(new AppError(INVALID_SESSION_MESSAGE, 401, null, INVALID_SESSION_CODE));
    }

    const authenticatedAt = now();

    req.user = validationResult.user;
    req.authSession = {
      id: validationResult.session.id,
      authenticatedAt,
    };

    res.on('finish', () => {
      if (res.statusCode >= 400 || !req.authSession) {
        return;
      }

      void touchSession(req.authSession.id, authenticatedAt).catch((error) => {
        req.logger?.error(
          {
            logType: 'error',
            event: 'auth.session_touch_failed',
            userId: req.user?.id ?? payload.id,
            userRole: req.user?.role ?? null,
            sessionId: req.authSession?.id ?? payload.sessionId,
            error: serializeError(error),
          },
          'Failed to update authenticated session activity',
        );
      });
    });

    return next();
  };
};

export const authenticate: RequestHandler = createAuthenticate({
  verifyToken: verifyAccessToken,
  validateSession: sessionService.validateSession,
  touchSession: sessionService.touchSession,
  now: () => new Date(),
});
