import pino, { Logger } from 'pino';

import { env } from '../config/env';
import { UserRole } from '../types/auth';

export interface AuditLogContext {
  logger?: Logger;
  actorUserId?: number | null;
  actorRole?: UserRole | null;
}

export const logger = pino({
  level: env.logLevel,
  base: {
    service: 'corehr-backend',
    environment: env.nodeEnv,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export const serializeError = (error: unknown): Record<string, unknown> => {
  if (error instanceof Error) {
    const typedError = error as Error & {
      code?: string;
      errno?: number;
      sqlState?: string;
      sqlMessage?: string;
    };

    return {
      name: typedError.name,
      message: typedError.message,
      code: typedError.code ?? null,
      errno: typedError.errno ?? null,
      sqlState: typedError.sqlState ?? null,
      sqlMessage: typedError.sqlMessage ?? null,
      stack: typedError.stack ?? null,
    };
  }

  return {
    value: error,
  };
};

export const logAuditEvent = (
  context: AuditLogContext | undefined,
  event: string,
  details: Record<string, unknown>,
  message: string,
): void => {
  context?.logger?.info(
    {
      logType: 'audit',
      event,
      actorUserId: context.actorUserId ?? null,
      actorRole: context.actorRole ?? null,
      ...details,
    },
    message,
  );
};
