import { ErrorRequestHandler } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

import { env } from '../config/env';
import { sendError } from '../utils/response';
import { AppError } from '../utils/app-error';
import { isDuplicateEntryError, isForeignKeyConstraintError } from '../utils/mysql-error';

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof Error && error.message === 'Origin is not allowed by CORS') {
    return sendError(res, {
      statusCode: 403,
      message: 'Origin is not allowed by CORS',
      errors: null,
    });
  }

  if (error instanceof TokenExpiredError) {
    return sendError(res, {
      statusCode: 401,
      message: 'Access token has expired',
      errors: null,
    });
  }

  if (error instanceof JsonWebTokenError) {
    return sendError(res, {
      statusCode: 401,
      message: 'Invalid access token',
      errors: null,
    });
  }

  if (error instanceof AppError) {
    return sendError(res, {
      statusCode: error.statusCode,
      message: error.message,
      errors: error.errors ?? null,
    });
  }

  if (error instanceof SyntaxError && 'body' in error) {
    return sendError(res, {
      statusCode: 400,
      message: 'Invalid JSON payload',
      errors: null,
    });
  }

  if (isDuplicateEntryError(error)) {
    return sendError(res, {
      statusCode: 409,
      message: 'Duplicate data detected',
      errors: null,
    });
  }

  if (isForeignKeyConstraintError(error)) {
    return sendError(res, {
      statusCode: 409,
      message: 'Request failed because related data is invalid or still in use',
      errors: null,
    });
  }

  console.error(error);

  return sendError(res, {
    statusCode: 500,
    message: 'Internal server error',
    errors:
      env.nodeEnv === 'development' && error instanceof Error
        ? {
            stack: error.stack ?? null,
          }
        : null,
  });
};
