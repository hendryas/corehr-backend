import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { db } from '../config/db';
import { LeaveTypeEntity, LeaveTypePayload } from '../types/leave-type';

interface LeaveTypeRow extends RowDataPacket {
  id: number;
  code: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const leaveTypeSelect = `
  SELECT
    lt.id,
    lt.code,
    lt.name,
    lt.description,
    DATE_FORMAT(lt.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
    DATE_FORMAT(lt.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
  FROM leave_types lt
`;

const mapLeaveType = (row: LeaveTypeRow): LeaveTypeEntity => {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const leaveTypeRepository = {
  async findAll(): Promise<LeaveTypeEntity[]> {
    const [rows] = await db.execute<LeaveTypeRow[]>(
      `${leaveTypeSelect} WHERE lt.deleted_at IS NULL ORDER BY lt.name ASC`,
    );

    return rows.map(mapLeaveType);
  },

  async findById(id: number): Promise<LeaveTypeEntity | null> {
    const [rows] = await db.execute<LeaveTypeRow[]>(
      `${leaveTypeSelect} WHERE lt.id = ? AND lt.deleted_at IS NULL LIMIT 1`,
      [id],
    );

    const leaveType = rows[0];

    return leaveType ? mapLeaveType(leaveType) : null;
  },

  async create(payload: LeaveTypePayload): Promise<number> {
    const [result] = await db.execute<ResultSetHeader>(
      `
        INSERT INTO leave_types (code, name, description)
        VALUES (?, ?, ?)
      `,
      [payload.code, payload.name, payload.description],
    );

    return result.insertId;
  },

  async update(id: number, payload: LeaveTypePayload): Promise<boolean> {
    const [result] = await db.execute<ResultSetHeader>(
      `
        UPDATE leave_types
        SET code = ?, name = ?, description = ?
        WHERE id = ? AND deleted_at IS NULL
      `,
      [payload.code, payload.name, payload.description, id],
    );

    return result.affectedRows > 0;
  },

  async softDelete(id: number): Promise<boolean> {
    const [result] = await db.execute<ResultSetHeader>(
      `
        UPDATE leave_types
        SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND deleted_at IS NULL
      `,
      [id],
    );

    return result.affectedRows > 0;
  },
};
