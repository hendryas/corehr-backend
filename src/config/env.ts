import dotenv from 'dotenv';

dotenv.config();

const requireEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;

  if (value === undefined || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const toNumber = (value: string, key: string): number => {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }

  return parsed;
};

const parseCorsOrigins = (value: string): string[] => {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  logLevel: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
  port: toNumber(process.env.PORT ?? '3000', 'PORT'),
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN ?? 'http://localhost:4200'),
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  db: {
    host: requireEnv('DB_HOST'),
    port: toNumber(process.env.DB_PORT ?? '3306', 'DB_PORT'),
    user: requireEnv('DB_USER'),
    password: process.env.DB_PASSWORD ?? '',
    name: requireEnv('DB_NAME'),
  },
} as const;
