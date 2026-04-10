import { Pool } from 'mysql2/promise';

import { Migration } from '../types';

export const addSoftDeleteToOperationalTablesMigration: Migration = {
  name: '003_add_soft_delete_to_operational_tables',
  async up(pool: Pool) {
    await pool.execute(`
      ALTER TABLE attendances
      ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at
    `);

    await pool.execute(`
      ALTER TABLE attendances
      ADD COLUMN active_record TINYINT
      GENERATED ALWAYS AS (IF(deleted_at IS NULL, 1, NULL)) STORED
      AFTER deleted_at
    `);

    await pool.execute('ALTER TABLE attendances DROP INDEX uq_attendances_user_date');
    await pool.execute(`
      ALTER TABLE attendances
      ADD UNIQUE KEY uq_attendances_user_date_active (user_id, attendance_date, active_record),
      ADD KEY idx_attendances_deleted_at (deleted_at)
    `);

    await pool.execute(`
      ALTER TABLE leave_requests
      ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at
    `);

    await pool.execute(`
      ALTER TABLE leave_requests
      ADD KEY idx_leave_requests_deleted_at (deleted_at)
    `);
  },
};
