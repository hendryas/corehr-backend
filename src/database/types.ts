import { Pool } from 'mysql2/promise';

export interface Migration {
  name: string;
  up: (pool: Pool) => Promise<void>;
  down?: (pool: Pool) => Promise<void>;
}

export interface Seed {
  name: string;
  run: (pool: Pool) => Promise<void>;
}
