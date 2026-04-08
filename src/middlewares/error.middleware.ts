import { ErrorRequestHandler } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

import { sendError } from '../utils/response';
import { AppError } from '../utils/app-error';

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
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

  console.error(error);

  return sendError(res, {
    statusCode: 500,
    message: 'Internal server error',
    errors: null,
  });
};
