import { RequestHandler } from 'express';

export const requestLoggerMiddleware: RequestHandler = (req, res, next) => {
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;
    const logPayload = {
      logType: 'request',
      event: 'http.request.completed',
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(3)),
      userId: req.user?.id ?? null,
      userRole: req.user?.role ?? null,
      contentLength: res.getHeader('content-length') ?? null,
    };

    if (res.statusCode >= 500) {
      req.logger?.error(logPayload, 'Request completed with server error');
      return;
    }

    if (res.statusCode >= 400) {
      req.logger?.warn(logPayload, 'Request completed with client error');
      return;
    }

    req.logger?.info(logPayload, 'Request completed');
  });

  return next();
};
