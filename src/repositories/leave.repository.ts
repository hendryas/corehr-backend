import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { db } from '../config/db';
import {
  LeaveCreatePayload,
  LeaveEntity,
  LeaveListQuery,
  LeaveRejectPayload,
  LeaveUpdatePayload,
} from '../types/leave';

interface LeaveRow extends RowDataPacket {
  id: number;
  user_id: number;
  employee_code: string;
  full_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: number | null;
  approver_name: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface CountRow extends RowDataPacket {
  total: number;
}

const leaveSelect = `
  SELECT
    l.id,
    l.user_id,
    u.employee_code,
    u.full_name,
    l.leave_type,
    DATE_FORMAT(l.start_date, '%Y-%m-%d') AS start_date,
    DATE_FORMAT(l.end_date, '%Y-%m-%d') AS end_date,
    l.reason,
    l.status,
    l.approved_by,
    approver.full_name AS approver_name,
    CASE
      WHEN l.approved_at IS NULL THEN NULL
      ELSE DATE_FORMAT(l.approved_at, '%Y-%m-%d %H:%i:%s')
    END AS approved_at,
    l.rejection_reason,
    DATE_FORMAT(l.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
    DATE_FORMAT(l.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
  FROM leave_requests l
  INNER JOIN users u ON u.id = l.user_id
  LEFT JOIN users approver ON approver.id = l.approved_by
`;

const mapLeave = (row: LeaveRow): LeaveEntity => {
  return {
    id: row.id,
    userId: row.user_id,
    employeeCode: row.employee_code,
    fullName: row.full_name,
    leaveType: row.leave_type,
    startDate: row.start_date,
    endDate: row.end_date,
    reason: row.reason,
    status: row.status,
    approvedBy: row.approved_by,
    approverName: row.approver_name,
    approvedAt: row.approved_at,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const buildLeaveFilters = (
  query: LeaveListQuery,
): { whereSql: string; values: Array<number | string> } => {
  const conditions: string[] = [];
  const values: Array<number | string> = [];

  if (query.userId) {
    conditions.push('l.user_id = ?');
    values.push(query.userId);
  }

  if (query.status) {
    conditions.push('l.status = ?');
    values.push(query.status);
  }

  if (query.leaveType) {
    conditions.push('l.leave_type = ?');
    values.push(query.leaveType);
  }

  if (query.startDate) {
    conditions.push('l.start_date >= ?');
    values.push(query.startDate);
  }

  if (query.endDate) {
    conditions.push('l.end_date <= ?');
    values.push(query.endDate);
  }

  return {
    whereSql: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
  };
};

export const leaveRepository = {
  async findAll(query: LeaveListQuery): Promise<{ items: LeaveEntity[]; total: number }> {
    const { whereSql, values } = buildLeaveFilters(query);
    const offset = (query.page - 1) * query.limit;

    const [rows] = await db.execute<LeaveRow[]>(
      `
        ${leaveSelect}
        ${whereSql}
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?
      `,
      [...values, query.limit, offset],
    );

    const [countRows] = await db.execute<CountRow[]>(
      `
        SELECT COUNT(l.id) AS total
        FROM leave_requests l
        ${whereSql}
      `,
      values,
    );

    return {
      items: rows.map(mapLeave),
      total: countRows[0]?.total ?? 0,
    };
  },

  async findAllForExport(query: LeaveListQuery): Promise<LeaveEntity[]> {
    const { whereSql, values } = buildLeaveFilters(query);
    const [rows] = await db.execute<LeaveRow[]>(
      `
        ${leaveSelect}
        ${whereSql}
        ORDER BY l.created_at DESC
      `,
      values,
    );

    return rows.map(mapLeave);
  },

  async findById(id: number): Promise<LeaveEntity | null> {
    const [rows] = await db.execute<LeaveRow[]>(
      `${leaveSelect} WHERE l.id = ? LIMIT 1`,
      [id],
    );

    const leaveRequest = rows[0];

    return leaveRequest ? mapLeave(leaveRequest) : null;
  },

  async create(payload: Required<LeaveCreatePayload>): Promise<number> {
    const [result] = await db.execute<ResultSetHeader>(
      `
        INSERT INTO leave_requests (
          user_id,
          leave_type,
          start_date,
          end_date,
          reason,
          status
        ) VALUES (?, ?, ?, ?, ?, 'pending')
      `,
      [payload.userId, payload.leaveType, payload.startDate, payload.endDate, payload.reason],
    );

    return result.insertId;
  },

  async update(id: number, payload: Required<LeaveUpdatePayload>): Promise<boolean> {
    const [result] = await db.execute<ResultSetHeader>(
      `
        UPDATE leave_requests
        SET user_id = ?, leave_type = ?, start_date = ?, end_date = ?, reason = ?
        WHERE id = ?
      `,
      [payload.userId, payload.leaveType, payload.startDate, payload.endDate, payload.reason, id],
    );

    return result.affectedRows > 0;
  },

  async delete(id: number): Promise<boolean> {
    const [result] = await db.execute<ResultSetHeader>(
      'DELETE FROM leave_requests WHERE id = ?',
      [id],
    );

    return result.affectedRows > 0;
  },

  async approve(id: number, approvedBy: number, approvedAt: string): Promise<boolean> {
    const [result] = await db.execute<ResultSetHeader>(
      `
        UPDATE leave_requests
        SET status = 'approved', approved_by = ?, approved_at = ?, rejection_reason = NULL
        WHERE id = ?
      `,
      [approvedBy, approvedAt, id],
    );

    return result.affectedRows > 0;
  },

  async reject(
    id: number,
    approvedBy: number,
    approvedAt: string,
    payload: LeaveRejectPayload,
  ): Promise<boolean> {
    const [result] = await db.execute<ResultSetHeader>(
      `
        UPDATE leave_requests
        SET status = 'rejected', approved_by = ?, approved_at = ?, rejection_reason = ?
        WHERE id = ?
      `,
      [approvedBy, approvedAt, payload.rejectionReason, id],
    );

    return result.affectedRows > 0;
  },
};
