import { RowDataPacket } from 'mysql2/promise';

import { db } from '../config/db';
import { AuthenticatedUser } from '../types/auth';

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

export interface AuthUserRecord extends AuthenticatedUser {
  password: string;
}

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
  LEFT JOIN departments d ON d.id = u.department_id
  LEFT JOIN positions p ON p.id = u.position_id
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
      `${authUserSelect} WHERE u.email = ? LIMIT 1`,
      [email],
    );

    const user = rows[0];

    return user ? mapAuthUser(user) : null;
  },

  async findActiveById(id: number): Promise<AuthenticatedUser | null> {
    const [rows] = await db.execute<AuthUserRow[]>(
      `${authUserSelect} WHERE u.id = ? AND u.is_active = 1 LIMIT 1`,
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
};
