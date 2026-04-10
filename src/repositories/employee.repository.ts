import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { db } from '../config/db';
import {
  EmployeeCreatePayload,
  EmployeeEntity,
  EmployeeListQuery,
  EmployeeUpdatePayload,
} from '../types/employee';

interface EmployeeRow extends RowDataPacket {
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
  created_at: string;
  updated_at: string;
}

interface CountRow extends RowDataPacket {
  total: number;
}

export interface EmployeeRecord extends EmployeeEntity {
  password: string;
}

const employeeSelect = `
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
    p.name AS position_name,
    DATE_FORMAT(u.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
    DATE_FORMAT(u.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
  FROM users u
  LEFT JOIN departments d ON d.id = u.department_id AND d.deleted_at IS NULL
  LEFT JOIN positions p ON p.id = u.position_id AND p.deleted_at IS NULL
`;

const mapEmployee = (row: EmployeeRow): EmployeeRecord => {
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const buildEmployeeFilters = (query: EmployeeListQuery): { whereSql: string; values: Array<string | number> } => {
  const conditions: string[] = ['u.deleted_at IS NULL'];
  const values: Array<string | number> = [];

  if (query.search) {
    conditions.push('(u.full_name LIKE ? OR u.email LIKE ? OR u.employee_code LIKE ?)');
    const keyword = `%${query.search}%`;
    values.push(keyword, keyword, keyword);
  }

  if (query.departmentId) {
    conditions.push('u.department_id = ?');
    values.push(query.departmentId);
  }

  if (query.positionId) {
    conditions.push('u.position_id = ?');
    values.push(query.positionId);
  }

  if (query.isActive !== null) {
    conditions.push('u.is_active = ?');
    values.push(query.isActive ? 1 : 0);
  }

  return {
    whereSql: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
  };
};

const toSafeEmployee = (employee: EmployeeRecord): EmployeeEntity => {
  const { password: _password, ...safeEmployee } = employee;

  return safeEmployee;
};

export const employeeRepository = {
  async findAll(query: EmployeeListQuery): Promise<{ items: EmployeeEntity[]; total: number }> {
    const { whereSql, values } = buildEmployeeFilters(query);
    const offset = (query.page - 1) * query.limit;

    // MySQL on this environment rejects prepared placeholders in LIMIT/OFFSET.
    const [rows] = await db.query<EmployeeRow[]>(
      `
        ${employeeSelect}
        ${whereSql}
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?
      `,
      [...values, query.limit, offset],
    );

    const [countRows] = await db.execute<CountRow[]>(
      `
        SELECT COUNT(u.id) AS total
        FROM users u
        ${whereSql}
      `,
      values,
    );

    return {
      items: rows.map(mapEmployee).map(toSafeEmployee),
      total: countRows[0]?.total ?? 0,
    };
  },

  async findAllForExport(query: EmployeeListQuery): Promise<EmployeeEntity[]> {
    const { whereSql, values } = buildEmployeeFilters(query);
    const [rows] = await db.execute<EmployeeRow[]>(
      `
        ${employeeSelect}
        ${whereSql}
        ORDER BY u.created_at DESC
      `,
      values,
    );

    return rows.map(mapEmployee).map(toSafeEmployee);
  },

  async findById(id: number): Promise<EmployeeEntity | null> {
    const employee = await this.findRecordById(id);

    return employee ? toSafeEmployee(employee) : null;
  },

  async findRecordById(id: number): Promise<EmployeeRecord | null> {
    const [rows] = await db.execute<EmployeeRow[]>(
      `${employeeSelect} WHERE u.id = ? AND u.deleted_at IS NULL LIMIT 1`,
      [id],
    );

    const employee = rows[0];

    return employee ? mapEmployee(employee) : null;
  },

  async create(payload: EmployeeCreatePayload): Promise<number> {
    const [result] = await db.execute<ResultSetHeader>(
      `
        INSERT INTO users (
          employee_code,
          full_name,
          email,
          password,
          phone,
          gender,
          address,
          hire_date,
          is_active,
          role,
          department_id,
          position_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        payload.employeeCode,
        payload.fullName,
        payload.email,
        payload.password,
        payload.phone,
        payload.gender,
        payload.address,
        payload.hireDate,
        payload.isActive ? 1 : 0,
        payload.role,
        payload.departmentId,
        payload.positionId,
      ],
    );

    return result.insertId;
  },

  async update(id: number, payload: EmployeeUpdatePayload): Promise<boolean> {
    const fields = [
      'employee_code = ?',
      'full_name = ?',
      'email = ?',
      'phone = ?',
      'gender = ?',
      'address = ?',
      'hire_date = ?',
      'is_active = ?',
      'role = ?',
      'department_id = ?',
      'position_id = ?',
    ];
    const values: Array<string | number | null> = [
      payload.employeeCode,
      payload.fullName,
      payload.email,
      payload.phone,
      payload.gender,
      payload.address,
      payload.hireDate,
      payload.isActive ? 1 : 0,
      payload.role,
      payload.departmentId,
      payload.positionId,
    ];

    if (payload.password !== undefined) {
      fields.push('password = ?');
      values.push(payload.password);
    }

    values.push(id);

    const [result] = await db.execute<ResultSetHeader>(
      `
        UPDATE users
        SET ${fields.join(', ')}
        WHERE id = ? AND deleted_at IS NULL
      `,
      values,
    );

    return result.affectedRows > 0;
  },

  async softDelete(id: number): Promise<boolean> {
    const [result] = await db.execute<ResultSetHeader>(
      `
        UPDATE users
        SET is_active = 0, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND deleted_at IS NULL
      `,
      [id],
    );

    return result.affectedRows > 0;
  },
};
