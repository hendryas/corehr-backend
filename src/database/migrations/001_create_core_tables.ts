import { Pool } from 'mysql2/promise';

import { Migration } from '../types';

export const createCoreTablesMigration: Migration = {
  name: '001_create_core_tables',
  async up(pool: Pool) {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS departments (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_departments_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS positions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        department_id BIGINT UNSIGNED NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_positions_department_name (department_id, name),
        KEY idx_positions_department_id (department_id),
        CONSTRAINT fk_positions_department
          FOREIGN KEY (department_id) REFERENCES departments(id)
          ON UPDATE CASCADE
          ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        employee_code VARCHAR(50) NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(30) NULL,
        gender VARCHAR(20) NULL,
        address TEXT NULL,
        hire_date DATE NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        role ENUM('admin_hr', 'employee') NOT NULL,
        department_id BIGINT UNSIGNED NULL,
        position_id BIGINT UNSIGNED NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_users_employee_code (employee_code),
        UNIQUE KEY uq_users_email (email),
        KEY idx_users_department_id (department_id),
        KEY idx_users_position_id (position_id),
        KEY idx_users_role (role),
        CONSTRAINT fk_users_department
          FOREIGN KEY (department_id) REFERENCES departments(id)
          ON UPDATE CASCADE
          ON DELETE SET NULL,
        CONSTRAINT fk_users_position
          FOREIGN KEY (position_id) REFERENCES positions(id)
          ON UPDATE CASCADE
          ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS attendances (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        attendance_date DATE NOT NULL,
        check_in DATETIME NULL,
        check_out DATETIME NULL,
        status ENUM('present', 'sick', 'leave', 'absent') NOT NULL DEFAULT 'present',
        notes TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_attendances_user_date (user_id, attendance_date),
        KEY idx_attendances_user_id (user_id),
        KEY idx_attendances_status (status),
        CONSTRAINT fk_attendances_user
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON UPDATE CASCADE
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        leave_type VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason TEXT NOT NULL,
        status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
        approved_by BIGINT UNSIGNED NULL,
        approved_at DATETIME NULL,
        rejection_reason TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_leave_requests_user_id (user_id),
        KEY idx_leave_requests_approved_by (approved_by),
        KEY idx_leave_requests_status (status),
        CONSTRAINT fk_leave_requests_user
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON UPDATE CASCADE
          ON DELETE CASCADE,
        CONSTRAINT fk_leave_requests_approved_by
          FOREIGN KEY (approved_by) REFERENCES users(id)
          ON UPDATE CASCADE
          ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  },
};
