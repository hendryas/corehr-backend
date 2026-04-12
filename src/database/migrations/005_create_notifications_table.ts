import { Pool } from 'mysql2/promise';

import { Migration } from '../types';

export const createNotificationsTableMigration: Migration = {
  name: '005_create_notifications_table',
  async up(pool: Pool) {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        actor_user_id BIGINT UNSIGNED NULL,
        leave_request_id BIGINT UNSIGNED NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        read_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_notifications_user_id (user_id),
        KEY idx_notifications_actor_user_id (actor_user_id),
        KEY idx_notifications_leave_request_id (leave_request_id),
        KEY idx_notifications_type (type),
        KEY idx_notifications_read_at (read_at),
        KEY idx_notifications_created_at (created_at),
        CONSTRAINT fk_notifications_user
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON UPDATE CASCADE
          ON DELETE CASCADE,
        CONSTRAINT fk_notifications_actor_user
          FOREIGN KEY (actor_user_id) REFERENCES users(id)
          ON UPDATE CASCADE
          ON DELETE SET NULL,
        CONSTRAINT fk_notifications_leave_request
          FOREIGN KEY (leave_request_id) REFERENCES leave_requests(id)
          ON UPDATE CASCADE
          ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  },
};
