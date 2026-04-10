import { Response } from 'express';

interface SuccessResponseOptions<T> {
  statusCode?: number;
  message: string;
  data?: T;
}

interface ErrorResponseOptions {
  statusCode?: number;
  message: string;
  errors?: unknown;
  requestId?: string | null;
}

export const sendSuccess = <T>(
  res: Response,
  { statusCode = 200, message, data = null as T }: SuccessResponseOptions<T>,
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  { statusCode = 500, message, errors = null, requestId = null }: ErrorResponseOptions,
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    requestId,
  });
};
