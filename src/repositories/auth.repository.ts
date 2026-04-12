import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { db } from '../config/db';
import { AuthenticatedSession, AuthenticatedUser } from '../types/auth';

interface AuthUserRow extends RowDataPacket {
  id: number;
  employee_code: string;
  full_name: string;
  email: string;
  password: string;
  phone: string | null;
  gender: string | null;
  address: string | null;
  hire_date: string | null;
  is_active: number;
  role: 'admin_hr' | 'employee';
  department_id: number | null;
  department_name: string | null;
  position_id: number | null;
  position_name: string | null;
}

interface AuthSessionRow extends RowDataPacket {
  id: string;
  user_id: number;
  last_activity_at: Date | string;
  invalidated_at: Date | string | null;
  invalidation_reason: string | null;
}

export interface AuthUserRecord extends AuthenticatedUser {
  password: string;
}

const toDate = (value: Date | string): Date => {
  return value instanceof Date ? value : new Date(value);
};

const mapAuthSession = (row: AuthSessionRow): AuthenticatedSession => {
  return {
    id: row.id,
    userId: row.user_id,
    lastActivityAt: toDate(row.last_activity_at),
    invalidatedAt: row.invalidated_at ? toDate(row.invalidated_at) : null,
    invalidationReason: row.invalidation_reason,
  };
};

const authUserSelect = `
  SELECT
    u.id,
    u.employee_code,
    u.full_name,
    u.email,
    u.password,
    u.phone,
    u.gender,
    u.address,
    DATE_FORMAT(u.hire_date, '%Y-%m-%d') AS hire_date,
    u.is_active,
    u.role,
    d.id AS department_id,
    d.name AS department_name,
    p.id AS position_id,
    p.name AS position_name
  FROM users u
  LEFT JOIN departments d ON d.id = u.department_id AND d.deleted_at IS NULL
  LEFT JOIN positions p ON p.id = u.position_id AND p.deleted_at IS NULL
`;

const mapAuthUser = (row: AuthUserRow): AuthUserRecord => {
  return {
    id: row.id,
    employeeCode: row.employee_code,
    fullName: row.full_name,
    email: row.email,
    password: row.password,
    phone: row.phone,
    gender: row.gender,
    address: row.address,
    hireDate: row.hire_date,
    isActive: Boolean(row.is_active),
    role: row.role,
    departmentId: row.department_id,
    departmentName: row.department_name,
    positionId: row.position_id,
    positionName: row.position_name,
  };
};

export const authRepository = {
  async findByEmail(email: string): Promise<AuthUserRecord | null> {
    const [rows] = await db.execute<AuthUserRow[]>(
      `${authUserSelect} WHERE u.email = ? AND u.deleted_at IS NULL LIMIT 1`,
      [email],
    );

    const user = rows[0];

    return user ? mapAuthUser(user) : null;
  },

  async findActiveById(id: number): Promise<AuthenticatedUser | null> {
    const [rows] = await db.execute<AuthUserRow[]>(
      `${authUserSelect} WHERE u.id = ? AND u.is_active = 1 AND u.deleted_at IS NULL LIMIT 1`,
      [id],
    );

    const user = rows[0];

    if (!user) {
      return null;
    }

    const mappedUser = mapAuthUser(user);
    const { password: _password, ...safeUser } = mappedUser;

    return safeUser;
  },

  async createSession(sessionId: string, userId: number, lastActivityAt: Date): Promise<void> {
    await db.execute<ResultSetHeader>(
      `
        INSERT INTO auth_sessions (id, user_id, last_activity_at)
        VALUES (?, ?, ?)
      `,
      [sessionId, userId, lastActivityAt],
    );
  },

  async findSessionById(sessionId: string): Promise<AuthenticatedSession | null> {
    const [rows] = await db.execute<AuthSessionRow[]>(
      `
        SELECT
          id,
          user_id,
          last_activity_at,
          invalidated_at,
          invalidation_reason
        FROM auth_sessions
        WHERE id = ?
        LIMIT 1
      `,
      [sessionId],
    );

    const session = rows[0];

    return session ? mapAuthSession(session) : null;
  },

  async touchSession(sessionId: string, lastActivityAt: Date): Promise<boolean> {
    const [result] = await db.execute<ResultSetHeader>(
      `
        UPDATE auth_sessions
        SET last_activity_at = ?
        WHERE id = ? AND invalidated_at IS NULL
      `,
      [lastActivityAt, sessionId],
    );

    return result.affectedRows > 0;
  },

  async invalidateSession(
    sessionId: string,
    invalidatedAt: Date,
    invalidationReason: string,
  ): Promise<boolean> {
    const [result] = await db.execute<ResultSetHeader>(
      `
        UPDATE auth_sessions
        SET
          invalidated_at = COALESCE(invalidated_at, ?),
          invalidation_reason = COALESCE(invalidation_reason, ?)
        WHERE id = ?
      `,
      [invalidatedAt, invalidationReason, sessionId],
    );

    return result.affectedRows > 0;
  },
};
