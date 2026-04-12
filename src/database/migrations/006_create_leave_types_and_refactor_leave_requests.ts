import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { Migration } from '../types';

interface LeaveTypeCodeRow extends RowDataPacket {
  leave_type: string;
}

interface LeaveTypeIdRow extends RowDataPacket {
  id: number;
}

interface CountRow extends RowDataPacket {
  total: number;
}

interface InformationSchemaCountRow extends RowDataPacket {
  total: number;
}

const normalizeLeaveTypeCode = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
};

const toDisplayName = (value: string): string => {
  return normalizeLeaveTypeCode(value)
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const hasTable = async (pool: Pool, tableName: string): Promise<boolean> => {
  const [rows] = await pool.execute<InformationSchemaCountRow[]>(
    `
      SELECT COUNT(*) AS total
      FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = ?
    `,
    [tableName],
  );

  return (rows[0]?.total ?? 0) > 0;
};

const hasColumn = async (pool: Pool, tableName: string, columnName: string): Promise<boolean> => {
  const [rows] = await pool.execute<InformationSchemaCountRow[]>(
    `
      SELECT COUNT(*) AS total
      FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?
    `,
    [tableName, columnName],
  );

  return (rows[0]?.total ?? 0) > 0;
};

const hasIndex = async (pool: Pool, tableName: string, indexName: string): Promise<boolean> => {
  const [rows] = await pool.execute<InformationSchemaCountRow[]>(
    `
      SELECT COUNT(*) AS total
      FROM information_schema.statistics
      WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?
    `,
    [tableName, indexName],
  );

  return (rows[0]?.total ?? 0) > 0;
};

const hasForeignKey = async (pool: Pool, tableName: string, constraintName: string): Promise<boolean> => {
  const [rows] = await pool.execute<InformationSchemaCountRow[]>(
    `
      SELECT COUNT(*) AS total
      FROM information_schema.referential_constraints
      WHERE constraint_schema = DATABASE() AND table_name = ? AND constraint_name = ?
    `,
    [tableName, constraintName],
  );

  return (rows[0]?.total ?? 0) > 0;
};

const ensureLeaveType = async (pool: Pool, rawValue: string): Promise<number> => {
  const code = normalizeLeaveTypeCode(rawValue);
  const name = toDisplayName(rawValue);

  if (!code) {
    throw new Error(`Failed to normalize leave type value: ${rawValue}`);
  }

  await pool.execute<ResultSetHeader>(
    `
      INSERT INTO leave_types (code, name, description)
      VALUES (?, ?, NULL)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        updated_at = CURRENT_TIMESTAMP
    `,
    [code, name],
  );

  const [rows] = await pool.execute<LeaveTypeIdRow[]>(
    `
      SELECT id
      FROM leave_types
      WHERE code = ? AND deleted_at IS NULL
      LIMIT 1
    `,
    [code],
  );

  if (!rows[0]) {
    throw new Error(`Failed to resolve leave type id for value ${rawValue}`);
  }

  return rows[0].id;
};

export const createLeaveTypesAndRefactorLeaveRequestsMigration: Migration = {
  name: '006_create_leave_types_and_refactor_leave_requests',
  async up(pool: Pool) {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS leave_types (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        code VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL DEFAULT NULL,
        active_record TINYINT
        GENERATED ALWAYS AS (IF(deleted_at IS NULL, 1, NULL)) STORED,
        PRIMARY KEY (id),
        UNIQUE KEY uq_leave_types_code_active (code, active_record),
        UNIQUE KEY uq_leave_types_name_active (name, active_record),
        KEY idx_leave_types_deleted_at (deleted_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    for (const value of ['annual_leave', 'sick_leave', 'unpaid_leave']) {
      await ensureLeaveType(pool, value);
    }

    if (!(await hasColumn(pool, 'leave_requests', 'leave_type_id'))) {
      await pool.execute(`
        ALTER TABLE leave_requests
        ADD COLUMN leave_type_id BIGINT UNSIGNED NULL AFTER user_id
      `);
    }

    if (await hasColumn(pool, 'leave_requests', 'leave_type')) {
      const [existingCodes] = await pool.execute<LeaveTypeCodeRow[]>(
        `
          SELECT DISTINCT leave_type
          FROM leave_requests
          WHERE leave_type IS NOT NULL AND TRIM(leave_type) <> ''
        `,
      );

      for (const row of existingCodes) {
        const leaveTypeId = await ensureLeaveType(pool, row.leave_type);

        await pool.execute<ResultSetHeader>(
          `
            UPDATE leave_requests
            SET leave_type_id = ?
            WHERE leave_type = ? AND leave_type_id IS NULL
          `,
          [leaveTypeId, row.leave_type],
        );
      }
    }

    const [unmappedRows] = await pool.execute<CountRow[]>(
      `
        SELECT COUNT(*) AS total
        FROM leave_requests
        WHERE leave_type_id IS NULL
      `,
    );

    if ((unmappedRows[0]?.total ?? 0) > 0) {
      throw new Error('Failed to map existing leave requests to leave_types');
    }

    await pool.execute(`
      ALTER TABLE leave_requests
      MODIFY COLUMN leave_type_id BIGINT UNSIGNED NOT NULL
    `);

    if (!(await hasIndex(pool, 'leave_requests', 'idx_leave_requests_leave_type_id'))) {
      await pool.execute(`
        ALTER TABLE leave_requests
        ADD KEY idx_leave_requests_leave_type_id (leave_type_id)
      `);
    }

    if (!(await hasForeignKey(pool, 'leave_requests', 'fk_leave_requests_leave_type'))) {
      await pool.execute(`
        ALTER TABLE leave_requests
        ADD CONSTRAINT fk_leave_requests_leave_type
          FOREIGN KEY (leave_type_id) REFERENCES leave_types(id)
          ON UPDATE CASCADE
          ON DELETE RESTRICT
      `);
    }

    if (await hasColumn(pool, 'leave_requests', 'leave_type')) {
      await pool.execute(`
        ALTER TABLE leave_requests
        DROP COLUMN leave_type
      `);
    }

    if (!(await hasTable(pool, 'leave_types'))) {
      throw new Error('leave_types table was not created successfully');
    }
  },
};
