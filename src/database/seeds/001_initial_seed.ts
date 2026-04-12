import bcrypt from 'bcryptjs';
import { Pool, RowDataPacket } from 'mysql2/promise';

import { Seed } from '../types';

interface IdRow extends RowDataPacket {
  id: number;
}

type QueryValue = string | number | null;

const getSingleId = async (pool: Pool, query: string, params: QueryValue[]): Promise<number> => {
  const [rows] = await pool.execute<IdRow[]>(query, params);

  if (!rows[0]) {
    throw new Error('Expected row not found while preparing seed data');
  }

  return rows[0].id;
};

const ensureLeaveRequest = async (
  pool: Pool,
  userId: number,
  leaveTypeId: number,
  startDate: string,
  endDate: string,
  reason: string,
  status: 'pending' | 'approved' | 'rejected',
  approvedBy: number | null,
  approvedAt: string | null,
  rejectionReason: string | null,
): Promise<void> => {
  const [existingRows] = await pool.execute<IdRow[]>(
    `
      SELECT id
      FROM leave_requests
      WHERE user_id = ? AND leave_type_id = ? AND start_date = ? AND end_date = ?
      LIMIT 1
    `,
    [userId, leaveTypeId, startDate, endDate],
  );

  if (existingRows[0]) {
    await pool.execute(
      `
        UPDATE leave_requests
        SET reason = ?, status = ?, approved_by = ?, approved_at = ?, rejection_reason = ?
        WHERE id = ?
      `,
      [reason, status, approvedBy, approvedAt, rejectionReason, existingRows[0].id],
    );

    return;
  }

  await pool.execute(
    `
      INSERT INTO leave_requests (
        user_id,
        leave_type_id,
        start_date,
        end_date,
        reason,
        status,
        approved_by,
        approved_at,
        rejection_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [userId, leaveTypeId, startDate, endDate, reason, status, approvedBy, approvedAt, rejectionReason],
  );
};

export const initialSeed: Seed = {
  name: '001_initial_seed',
  async run(pool: Pool) {
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    const employeePassword = await bcrypt.hash('Employee123!', 10);

    await pool.execute(
      `
        INSERT INTO departments (name, description)
        VALUES
          ('Human Resources', 'Handles employee lifecycle and HR administration'),
          ('Engineering', 'Builds and maintains internal products'),
          ('Finance', 'Handles budgeting, payroll, and reporting')
        ON DUPLICATE KEY UPDATE
          description = VALUES(description),
          updated_at = CURRENT_TIMESTAMP
      `,
    );

    const hrDepartmentId = await getSingleId(pool, 'SELECT id FROM departments WHERE name = ? LIMIT 1', [
      'Human Resources',
    ]);
    const engineeringDepartmentId = await getSingleId(
      pool,
      'SELECT id FROM departments WHERE name = ? LIMIT 1',
      ['Engineering'],
    );
    const financeDepartmentId = await getSingleId(pool, 'SELECT id FROM departments WHERE name = ? LIMIT 1', [
      'Finance',
    ]);

    await pool.execute(
      `
        INSERT INTO positions (department_id, name, description)
        VALUES
          (?, 'HR Manager', 'Leads recruitment and people operations'),
          (?, 'Backend Engineer', 'Maintains backend services and integrations'),
          (?, 'Finance Analyst', 'Supports reporting and financial operations')
        ON DUPLICATE KEY UPDATE
          description = VALUES(description),
          updated_at = CURRENT_TIMESTAMP
      `,
      [hrDepartmentId, engineeringDepartmentId, financeDepartmentId],
    );

    const hrManagerPositionId = await getSingleId(
      pool,
      'SELECT id FROM positions WHERE department_id = ? AND name = ? LIMIT 1',
      [hrDepartmentId, 'HR Manager'],
    );
    const backendEngineerPositionId = await getSingleId(
      pool,
      'SELECT id FROM positions WHERE department_id = ? AND name = ? LIMIT 1',
      [engineeringDepartmentId, 'Backend Engineer'],
    );
    const financeAnalystPositionId = await getSingleId(
      pool,
      'SELECT id FROM positions WHERE department_id = ? AND name = ? LIMIT 1',
      [financeDepartmentId, 'Finance Analyst'],
    );

    await pool.execute(
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
        ) VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          full_name = VALUES(full_name),
          email = VALUES(email),
          password = VALUES(password),
          phone = VALUES(phone),
          gender = VALUES(gender),
          address = VALUES(address),
          hire_date = VALUES(hire_date),
          is_active = VALUES(is_active),
          role = VALUES(role),
          department_id = VALUES(department_id),
          position_id = VALUES(position_id),
          updated_at = CURRENT_TIMESTAMP
      `,
      [
        'ADM001',
        'Aisyah Putri',
        'admin.hr@corehr.local',
        adminPassword,
        '081200000001',
        'female',
        'Jakarta',
        '2023-01-10',
        1,
        'admin_hr',
        hrDepartmentId,
        hrManagerPositionId,
        'EMP001',
        'Budi Santoso',
        'budi@corehr.local',
        employeePassword,
        '081200000002',
        'male',
        'Bandung',
        '2024-03-01',
        1,
        'employee',
        engineeringDepartmentId,
        backendEngineerPositionId,
        'EMP002',
        'Citra Lestari',
        'citra@corehr.local',
        employeePassword,
        '081200000003',
        'female',
        'Surabaya',
        '2024-05-20',
        1,
        'employee',
        financeDepartmentId,
        financeAnalystPositionId,
      ],
    );

    const adminUserId = await getSingleId(pool, 'SELECT id FROM users WHERE employee_code = ? LIMIT 1', [
      'ADM001',
    ]);
    const budiUserId = await getSingleId(pool, 'SELECT id FROM users WHERE employee_code = ? LIMIT 1', ['EMP001']);
    const citraUserId = await getSingleId(pool, 'SELECT id FROM users WHERE employee_code = ? LIMIT 1', [
      'EMP002',
    ]);
    const annualLeaveTypeId = await getSingleId(pool, 'SELECT id FROM leave_types WHERE code = ? LIMIT 1', [
      'annual_leave',
    ]);
    const sickLeaveTypeId = await getSingleId(pool, 'SELECT id FROM leave_types WHERE code = ? LIMIT 1', [
      'sick_leave',
    ]);

    await pool.execute(
      `
        INSERT INTO attendances (
          user_id,
          attendance_date,
          check_in,
          check_out,
          status,
          notes
        ) VALUES
          (?, ?, ?, ?, ?, ?),
          (?, ?, ?, ?, ?, ?),
          (?, ?, ?, ?, ?, ?),
          (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          check_in = VALUES(check_in),
          check_out = VALUES(check_out),
          status = VALUES(status),
          notes = VALUES(notes),
          updated_at = CURRENT_TIMESTAMP
      `,
      [
        budiUserId,
        '2026-04-05',
        '2026-04-05 08:03:00',
        '2026-04-05 17:10:00',
        'present',
        'On time',
        budiUserId,
        '2026-04-06',
        '2026-04-06 08:11:00',
        '2026-04-06 17:02:00',
        'present',
        'Worked from office',
        citraUserId,
        '2026-04-05',
        null,
        null,
        'leave',
        'Annual leave',
        citraUserId,
        '2026-04-06',
        null,
        null,
        'sick',
        'Medical rest',
      ],
    );

    await ensureLeaveRequest(
      pool,
      citraUserId,
      annualLeaveTypeId,
      '2026-04-05',
      '2026-04-05',
      'Family event',
      'approved',
      adminUserId,
      '2026-04-03 10:30:00',
      null,
    );
    await ensureLeaveRequest(
      pool,
      budiUserId,
      sickLeaveTypeId,
      '2026-04-10',
      '2026-04-10',
      'Medical check-up',
      'pending',
      null,
      null,
      null,
    );
    await ensureLeaveRequest(
      pool,
      budiUserId,
      annualLeaveTypeId,
      '2026-03-20',
      '2026-03-21',
      'Personal trip',
      'rejected',
      adminUserId,
      '2026-03-18 14:00:00',
      'Requested dates overlap with team release schedule',
    );
  },
};
