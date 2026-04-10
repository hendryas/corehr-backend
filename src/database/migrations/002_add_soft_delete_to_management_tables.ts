import { Pool } from 'mysql2/promise';

import { Migration } from '../types';

export const addSoftDeleteToManagementTablesMigration: Migration = {
  name: '002_add_soft_delete_to_management_tables',
  async up(pool: Pool) {
    await pool.execute(`
      ALTER TABLE departments
      ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at
    `);

    await pool.execute(`
      ALTER TABLE departments
      ADD COLUMN active_record TINYINT
      GENERATED ALWAYS AS (IF(deleted_at IS NULL, 1, NULL)) STORED
      AFTER deleted_at
    `);

    await pool.execute('ALTER TABLE departments DROP INDEX uq_departments_name');
    await pool.execute(`
      ALTER TABLE departments
      ADD UNIQUE KEY uq_departments_name_active (name, active_record),
      ADD KEY idx_departments_deleted_at (deleted_at)
    `);

    await pool.execute(`
      ALTER TABLE positions
      ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at
    `);

    await pool.execute(`
      ALTER TABLE positions
      ADD COLUMN active_record TINYINT
      GENERATED ALWAYS AS (IF(deleted_at IS NULL, 1, NULL)) STORED
      AFTER deleted_at
    `);

    await pool.execute('ALTER TABLE positions DROP INDEX uq_positions_department_name');
    await pool.execute(`
      ALTER TABLE positions
      ADD UNIQUE KEY uq_positions_department_name_active (department_id, name, active_record),
      ADD KEY idx_positions_deleted_at (deleted_at)
    `);

    await pool.execute(`
      ALTER TABLE users
      ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at
    `);

    await pool.execute(`
      ALTER TABLE users
      ADD COLUMN active_record TINYINT
      GENERATED ALWAYS AS (IF(deleted_at IS NULL, 1, NULL)) STORED
      AFTER deleted_at
    `);

    await pool.execute('ALTER TABLE users DROP INDEX uq_users_employee_code');
    await pool.execute('ALTER TABLE users DROP INDEX uq_users_email');
    await pool.execute(`
      ALTER TABLE users
      ADD UNIQUE KEY uq_users_employee_code_active (employee_code, active_record),
      ADD UNIQUE KEY uq_users_email_active (email, active_record),
      ADD KEY idx_users_deleted_at (deleted_at)
    `);
  },
};
