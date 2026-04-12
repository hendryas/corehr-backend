import { Pool } from 'mysql2/promise';

import { Migration } from '../types';

export const createAuthSessionsTableMigration: Migration = {
  name: '004_create_auth_sessions_table',
  async up(pool: Pool) {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id CHAR(36) NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        last_activity_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        invalidated_at TIMESTAMP NULL DEFAULT NULL,
        invalidation_reason VARCHAR(50) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_auth_sessions_user_id (user_id),
        KEY idx_auth_sessions_last_activity_at (last_activity_at),
        KEY idx_auth_sessions_invalidated_at (invalidated_at),
        CONSTRAINT fk_auth_sessions_user
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON UPDATE CASCADE
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  },
};
