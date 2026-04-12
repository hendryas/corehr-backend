import { ErrorRequestHandler } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

import { env } from '../config/env';
import { sendError } from '../utils/response';
import { AppError } from '../utils/app-error';
import { isDuplicateEntryError, isForeignKeyConstraintError } from '../utils/mysql-error';
import { serializeError } from '../utils/logger';

export const errorMiddleware: ErrorRequestHandler = (error, req, res, _next) => {
  let statusCode = 500;
  let code: string | null = null;
  let message = 'Internal server error';
  let errors: unknown = null;

  if (error instanceof Error && error.message === 'Origin is not allowed by CORS') {
    statusCode = 403;
    code = 'CORS_ORIGIN_NOT_ALLOWED';
    message = 'Origin is not allowed by CORS';
  } else if (error instanceof TokenExpiredError) {
    statusCode = 401;
    code = 'ACCESS_TOKEN_EXPIRED';
    message = 'Access token has expired';
  } else if (error instanceof JsonWebTokenError) {
    statusCode = 401;
    code = 'INVALID_ACCESS_TOKEN';
    message = 'Invalid access token';
  } else if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code ?? null;
    message = error.message;
    errors = error.errors ?? null;
  } else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    code = 'INVALID_JSON_PAYLOAD';
    message = 'Invalid JSON payload';
  } else if (isDuplicateEntryError(error)) {
    statusCode = 409;
    code = 'DUPLICATE_DATA';
    message = 'Duplicate data detected';
  } else if (isForeignKeyConstraintError(error)) {
    statusCode = 409;
    code = 'INVALID_RELATIONSHIP';
    message = 'Request failed because related data is invalid or still in use';
  } else if (env.nodeEnv === 'development' && error instanceof Error) {
    errors = {
      stack: error.stack ?? null,
    };
  }

  const logPayload = {
    logType: 'error',
    event: 'http.request.failed',
    statusCode,
    userId: req.user?.id ?? null,
    userRole: req.user?.role ?? null,
    error: serializeError(error),
  };

  if (statusCode >= 500) {
    req.logger?.error(logPayload, message);
  } else {
    req.logger?.warn(logPayload, message);
  }

  return sendError(res, {
    statusCode,
    code,
    message,
    errors,
    requestId: req.requestId ?? null,
  });
};
