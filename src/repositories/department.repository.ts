import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { db } from '../config/db';

interface DepartmentRow extends RowDataPacket {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface CountRow extends RowDataPacket {
  total: number;
}

export interface DepartmentEntity {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DepartmentPayload {
  name: string;
  description: string | null;
}

const departmentSelect = `
  SELECT
    d.id,
    d.name,
    d.description,
    DATE_FORMAT(d.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
    DATE_FORMAT(d.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
  FROM departments d
`;

const activeDepartmentCondition = 'd.deleted_at IS NULL';

const mapDepartment = (row: DepartmentRow): DepartmentEntity => {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const departmentRepository = {
  async findAll(): Promise<DepartmentEntity[]> {
    const [rows] = await db.execute<DepartmentRow[]>(
      `${departmentSelect} WHERE ${activeDepartmentCondition} ORDER BY d.name ASC`,
    );

    return rows.map(mapDepartment);
  },

  async findById(id: number): Promise<DepartmentEntity | null> {
    const [rows] = await db.execute<DepartmentRow[]>(
      `${departmentSelect} WHERE d.id = ? AND ${activeDepartmentCondition} LIMIT 1`,
      [id],
    );

    const department = rows[0];

    return department ? mapDepartment(department) : null;
  },

  async create(payload: DepartmentPayload): Promise<number> {
    const [result] = await db.execute<ResultSetHeader>(
      `
        INSERT INTO departments (name, description)
        VALUES (?, ?)
      `,
      [payload.name, payload.description],
    );

    return result.insertId;
  },

  async update(id: number, payload: DepartmentPayload): Promise<boolean> {
    const [result] = await db.execute<ResultSetHeader>(
      `
        UPDATE departments
        SET name = ?, description = ?
        WHERE id = ? AND deleted_at IS NULL
      `,
      [payload.name, payload.description, id],
    );

    return result.affectedRows > 0;
  },

  async countActivePositions(id: number): Promise<number> {
    const [rows] = await db.execute<CountRow[]>(
      `
        SELECT COUNT(*) AS total
        FROM positions p
        WHERE p.department_id = ? AND p.deleted_at IS NULL
      `,
      [id],
    );

    return rows[0]?.total ?? 0;
  },

  async countActiveEmployees(id: number): Promise<number> {
    const [rows] = await db.execute<CountRow[]>(
      `
        SELECT COUNT(*) AS total
        FROM users u
        WHERE u.department_id = ? AND u.deleted_at IS NULL
      `,
      [id],
    );

    return rows[0]?.total ?? 0;
  },

  async softDelete(id: number): Promise<boolean> {
    const [result] = await db.execute<ResultSetHeader>(
      `
        UPDATE departments
        SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND deleted_at IS NULL
      `,
      [id],
    );

    return result.affectedRows > 0;
  },
};
