import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { db } from '../config/db';

interface PositionRow extends RowDataPacket {
  id: number;
  department_id: number;
  department_name: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface PositionEntity {
  id: number;
  departmentId: number;
  departmentName: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PositionPayload {
  departmentId: number;
  name: string;
  description: string | null;
}

const positionSelect = `
  SELECT
    p.id,
    p.department_id,
    d.name AS department_name,
    p.name,
    p.description,
    DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
    DATE_FORMAT(p.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
  FROM positions p
  INNER JOIN departments d ON d.id = p.department_id
`;

const mapPosition = (row: PositionRow): PositionEntity => {
  return {
    id: row.id,
    departmentId: row.department_id,
    departmentName: row.department_name,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const positionRepository = {
  async findAll(): Promise<PositionEntity[]> {
    const [rows] = await db.execute<PositionRow[]>(
      `${positionSelect} ORDER BY d.name ASC, p.name ASC`,
    );

    return rows.map(mapPosition);
  },

  async findById(id: number): Promise<PositionEntity | null> {
    const [rows] = await db.execute<PositionRow[]>(
      `${positionSelect} WHERE p.id = ? LIMIT 1`,
      [id],
    );

    const position = rows[0];

    return position ? mapPosition(position) : null;
  },

  async create(payload: PositionPayload): Promise<number> {
    const [result] = await db.execute<ResultSetHeader>(
      `
        INSERT INTO positions (department_id, name, description)
        VALUES (?, ?, ?)
      `,
      [payload.departmentId, payload.name, payload.description],
    );

    return result.insertId;
  },

  async update(id: number, payload: PositionPayload): Promise<boolean> {
    const [result] = await db.execute<ResultSetHeader>(
      `
        UPDATE positions
        SET department_id = ?, name = ?, description = ?
        WHERE id = ?
      `,
      [payload.departmentId, payload.name, payload.description, id],
    );

    return result.affectedRows > 0;
  },

  async delete(id: number): Promise<boolean> {
    const [result] = await db.execute<ResultSetHeader>(
      'DELETE FROM positions WHERE id = ?',
      [id],
    );

    return result.affectedRows > 0;
  },
};
