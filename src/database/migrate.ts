import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { closeDatabaseConnection, db } from '../config/db';
import { migrations } from './migrations';

interface MigrationRow extends RowDataPacket {
  name: string;
}

const ensureMigrationsTable = async (): Promise<void> => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS migrations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_migrations_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

const getExecutedMigrationNames = async (): Promise<Set<string>> => {
  const [rows] = await db.execute<MigrationRow[]>('SELECT name FROM migrations ORDER BY id ASC');

  return new Set(rows.map((row) => row.name));
};

const runMigrations = async (): Promise<void> => {
  await ensureMigrationsTable();

  const executedMigrationNames = await getExecutedMigrationNames();

  for (const migration of migrations) {
    if (executedMigrationNames.has(migration.name)) {
      console.log(`Skipping migration ${migration.name}`);
      continue;
    }

    console.log(`Running migration ${migration.name}`);
    await migration.up(db);
    await db.execute<ResultSetHeader>('INSERT INTO migrations (name) VALUES (?)', [migration.name]);
    console.log(`Finished migration ${migration.name}`);
  }
};

runMigrations()
  .then(async () => {
    console.log('All migrations completed');
    await closeDatabaseConnection();
  })
  .catch(async (error: unknown) => {
    console.error('Migration failed', error);
    await closeDatabaseConnection();
    process.exitCode = 1;
  });
