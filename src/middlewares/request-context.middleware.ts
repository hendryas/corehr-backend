import { randomUUID } from 'crypto';
import { RequestHandler } from 'express';

import { logger } from '../utils/logger';

const resolveIncomingRequestId = (value: string | string[] | undefined): string | null => {
  if (typeof value === 'string' && value.trim() !== '') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const [firstValue] = value;

    if (typeof firstValue === 'string' && firstValue.trim() !== '') {
      return firstValue.trim();
    }
  }

  return null;
};

export const requestContextMiddleware: RequestHandler = (req, res, next) => {
  const requestId = resolveIncomingRequestId(req.headers['x-request-id']) ?? randomUUID();

  req.requestId = requestId;
  req.logger = logger.child({
    requestId,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent') ?? null,
  });

  res.setHeader('X-Request-Id', requestId);

  return next();
};
