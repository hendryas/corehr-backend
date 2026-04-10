import app from './app';
import { initializeDatabaseConnection } from './config/db';
import { env } from './config/env';
import { logger } from './utils/logger';

const startServer = async (): Promise<void> => {
  await initializeDatabaseConnection();

  app.listen(env.port, () => {
    logger.info(
      {
        logType: 'application',
        event: 'server.started',
        port: env.port,
      },
      `Server running on http://localhost:${env.port}`,
    );
  });
};

startServer().catch((error: unknown) => {
  logger.error(
    {
      logType: 'application',
      event: 'server.start_failed',
      error,
    },
    'Failed to start server',
  );
  process.exit(1);
});
