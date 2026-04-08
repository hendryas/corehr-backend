import { closeDatabaseConnection, db } from '../config/db';
import { seeds } from './seeds';

const runSeeds = async (): Promise<void> => {
  for (const seed of seeds) {
    console.log(`Running seed ${seed.name}`);
    await seed.run(db);
    console.log(`Finished seed ${seed.name}`);
  }
};

runSeeds()
  .then(async () => {
    console.log('All seeds completed');
    await closeDatabaseConnection();
  })
  .catch(async (error: unknown) => {
    console.error('Seed failed', error);
    await closeDatabaseConnection();
    process.exitCode = 1;
  });
