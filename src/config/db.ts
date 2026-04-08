import mysql from 'mysql2/promise';

import { env } from './env';

export const db = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z',
});

export const initializeDatabaseConnection = async (): Promise<void> => {
  const connection = await db.getConnection();

  try {
    await connection.ping();
  } finally {
    connection.release();
  }
};

export const closeDatabaseConnection = async (): Promise<void> => {
  await db.end();
};
