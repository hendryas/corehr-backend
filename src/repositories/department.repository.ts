import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { db } from '../config/db';

interface DepartmentRow extends RowDataPacket {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
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
    const [rows] = await db.execute<DepartmentRow[]>(`${departmentSelect} ORDER BY d.name ASC`);

    return rows.map(mapDepartment);
  },

  async findById(id: number): Promise<DepartmentEntity | null> {
    const [rows] = await db.execute<DepartmentRow[]>(
      `${departmentSelect} WHERE d.id = ? LIMIT 1`,
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
        WHERE id = ?
      `,
      [payload.name, payload.description, id],
    );

    return result.affectedRows > 0;
  },

  async delete(id: number): Promise<boolean> {
    const [result] = await db.execute<ResultSetHeader>(
      'DELETE FROM departments WHERE id = ?',
      [id],
    );

    return result.affectedRows > 0;
  },
};
