import app from './app';
import { initializeDatabaseConnection } from './config/db';
import { env } from './config/env';

const startServer = async (): Promise<void> => {
  await initializeDatabaseConnection();

  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });
};

startServer().catch((error: unknown) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
