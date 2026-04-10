import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { db } from '../config/db';
import {
  AttendanceCreatePayload,
  AttendanceEntity,
  AttendanceListQuery,
  AttendanceUpdatePayload,
} from '../types/attendance';

interface AttendanceRow extends RowDataPacket {
  id: number;
  user_id: number;
  employee_code: string;
  full_name: string;
  role: 'admin_hr' | 'employee';
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  status: 'present' | 'sick' | 'leave' | 'absent';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface CountRow extends RowDataPacket {
  total: number;
}

const attendanceSelect = `
  SELECT
    a.id,
    a.user_id,
    u.employee_code,
    u.full_name,
    u.role,
    DATE_FORMAT(a.attendance_date, '%Y-%m-%d') AS attendance_date,
    CASE
      WHEN a.check_in IS NULL THEN NULL
      ELSE DATE_FORMAT(a.check_in, '%Y-%m-%d %H:%i:%s')
    END AS check_in,
    CASE
      WHEN a.check_out IS NULL THEN NULL
      ELSE DATE_FORMAT(a.check_out, '%Y-%m-%d %H:%i:%s')
    END AS check_out,
    a.status,
    a.notes,
    DATE_FORMAT(a.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
    DATE_FORMAT(a.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
  FROM attendances a
  INNER JOIN users u ON u.id = a.user_id
`;

const mapAttendance = (row: AttendanceRow): AttendanceEntity => {
  return {
    id: row.id,
    userId: row.user_id,
    employeeCode: row.employee_code,
    fullName: row.full_name,
    role: row.role,
    attendanceDate: row.attendance_date,
    checkIn: row.check_in,
    checkOut: row.check_out,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const buildAttendanceFilters = (
  query: AttendanceListQuery,
): { whereSql: string; values: Array<number | string> } => {
  const conditions: string[] = ['a.deleted_at IS NULL'];
  const values: Array<number | string> = [];

  if (query.userId) {
    conditions.push('a.user_id = ?');
    values.push(query.userId);
  }

  if (query.attendanceDate) {
    conditions.push('a.attendance_date = ?');
    values.push(query.attendanceDate);
  }

  if (query.status) {
    conditions.push('a.status = ?');
    values.push(query.status);
  }

  return {
    whereSql: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
  };
};

export const attendanceRepository = {
  async findAll(query: AttendanceListQuery): Promise<{ items: AttendanceEntity[]; total: number }> {
    const { whereSql, values } = buildAttendanceFilters(query);
    const offset = (query.page - 1) * query.limit;

    // MySQL on this environment rejects prepared placeholders in LIMIT/OFFSET.
    const [rows] = await db.query<AttendanceRow[]>(
      `
        ${attendanceSelect}
        ${whereSql}
        ORDER BY a.attendance_date DESC, a.created_at DESC
        LIMIT ? OFFSET ?
      `,
      [...values, query.limit, offset],
    );

    const [countRows] = await db.execute<CountRow[]>(
      `
        SELECT COUNT(a.id) AS total
        FROM attendances a
        ${whereSql}
      `,
      values,
    );

    return {
      items: rows.map(mapAttendance),
      total: countRows[0]?.total ?? 0,
    };
  },

  async findAllForExport(query: AttendanceListQuery): Promise<AttendanceEntity[]> {
    const { whereSql, values } = buildAttendanceFilters(query);
    const [rows] = await db.execute<AttendanceRow[]>(
      `
        ${attendanceSelect}
        ${whereSql}
        ORDER BY a.attendance_date DESC, a.created_at DESC
      `,
      values,
    );

    return rows.map(mapAttendance);
  },

  async findById(id: number): Promise<AttendanceEntity | null> {
    const [rows] = await db.execute<AttendanceRow[]>(
      `${attendanceSelect} WHERE a.id = ? AND a.deleted_at IS NULL LIMIT 1`,
      [id],
    );

    const attendance = rows[0];

    return attendance ? mapAttendance(attendance) : null;
  },

  async findByUserIdAndDate(userId: number, attendanceDate: string): Promise<AttendanceEntity | null> {
    const [rows] = await db.execute<AttendanceRow[]>(
      `${attendanceSelect} WHERE a.user_id = ? AND a.attendance_date = ? AND a.deleted_at IS NULL LIMIT 1`,
      [userId, attendanceDate],
    );

    const attendance = rows[0];

    return attendance ? mapAttendance(attendance) : null;
  },

  async create(payload: AttendanceCreatePayload): Promise<number> {
    const [result] = await db.execute<ResultSetHeader>(
      `
        INSERT INTO attendances (
          user_id,
          attendance_date,
          check_in,
          check_out,
          status,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        payload.userId,
        payload.attendanceDate,
        payload.checkIn,
        payload.checkOut,
        payload.status,
        payload.notes,
      ],
    );

    return result.insertId;
  },

  async update(id: number, payload: AttendanceUpdatePayload): Promise<boolean> {
    const [result] = await db.execute<ResultSetHeader>(
      `
        UPDATE attendances
        SET user_id = ?, attendance_date = ?, check_in = ?, check_out = ?, status = ?, notes = ?
        WHERE id = ? AND deleted_at IS NULL
      `,
      [
        payload.userId,
        payload.attendanceDate,
        payload.checkIn,
        payload.checkOut,
        payload.status,
        payload.notes,
        id,
      ],
    );

    return result.affectedRows > 0;
  },

  async updateCheckOut(id: number, checkOut: string): Promise<boolean> {
    const [result] = await db.execute<ResultSetHeader>(
      `
        UPDATE attendances
        SET check_out = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND deleted_at IS NULL
      `,
      [checkOut, id],
    );

    return result.affectedRows > 0;
  },

  async softDelete(id: number): Promise<boolean> {
    const [result] = await db.execute<ResultSetHeader>(
      `
        UPDATE attendances
        SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND deleted_at IS NULL
      `,
      [id],
    );

    return result.affectedRows > 0;
  },
};
