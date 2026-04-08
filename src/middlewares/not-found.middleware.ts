import { RequestHandler } from 'express';

import { sendError } from '../utils/response';

export const notFoundMiddleware: RequestHandler = (req, res) => {
  return sendError(res, {
    statusCode: 404,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    errors: null,
  });
};
