import { RowDataPacket } from 'mysql2/promise';

import { db } from '../config/db';
import { formatDateForMysql } from '../utils/date';
import { EmployeeDashboardStats } from '../types/dashboard';

interface DashboardStatsRow extends RowDataPacket {
  total_employees: number;
  active_employees: number;
  total_departments: number;
  total_positions: number;
  total_attendances_today: number;
  total_pending_leaves: number;
  total_approved_leaves: number;
  total_rejected_leaves: number;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalDepartments: number;
  totalPositions: number;
  totalAttendancesToday: number;
  totalPendingLeaves: number;
  totalApprovedLeaves: number;
  totalRejectedLeaves: number;
}

interface EmployeeAttendanceTodayRow extends RowDataPacket {
  id: number;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  status: 'present' | 'sick' | 'leave' | 'absent';
}

interface EmployeeAttendanceMonthRow extends RowDataPacket {
  total: number;
  present: number;
  sick: number;
  leave_count: number;
  absent: number;
}

interface EmployeeLeaveSummaryRow extends RowDataPacket {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface EmployeeRecentAttendanceRow extends RowDataPacket {
  id: number;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  status: 'present' | 'sick' | 'leave' | 'absent';
}

interface EmployeeRecentLeaveRow extends RowDataPacket {
  id: number;
  leave_type_id: number;
  leave_type_code: string;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export const dashboardRepository = {
  async getStats(): Promise<DashboardStats> {
    const today = formatDateForMysql(new Date());
    const [rows] = await db.execute<DashboardStatsRow[]>(
      `
        SELECT
          (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) AS total_employees,
          (SELECT COUNT(*) FROM users WHERE is_active = 1 AND deleted_at IS NULL) AS active_employees,
          (SELECT COUNT(*) FROM departments WHERE deleted_at IS NULL) AS total_departments,
          (SELECT COUNT(*) FROM positions WHERE deleted_at IS NULL) AS total_positions,
          (SELECT COUNT(*) FROM attendances WHERE attendance_date = ? AND deleted_at IS NULL) AS total_attendances_today,
          (SELECT COUNT(*) FROM leave_requests WHERE status = 'pending' AND deleted_at IS NULL) AS total_pending_leaves,
          (SELECT COUNT(*) FROM leave_requests WHERE status = 'approved' AND deleted_at IS NULL) AS total_approved_leaves,
          (SELECT COUNT(*) FROM leave_requests WHERE status = 'rejected' AND deleted_at IS NULL) AS total_rejected_leaves
      `,
      [today],
    );

    const row = rows[0];

    return {
      totalEmployees: row.total_employees,
      activeEmployees: row.active_employees,
      totalDepartments: row.total_departments,
      totalPositions: row.total_positions,
      totalAttendancesToday: row.total_attendances_today,
      totalPendingLeaves: row.total_pending_leaves,
      totalApprovedLeaves: row.total_approved_leaves,
      totalRejectedLeaves: row.total_rejected_leaves,
    };
  },

  async getEmployeeStats(userId: number): Promise<EmployeeDashboardStats> {
    const todayDate = new Date();
    const today = formatDateForMysql(todayDate);
    const monthStart = formatDateForMysql(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
    const nextMonthStart = formatDateForMysql(new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 1));

    const [todayRows] = await db.execute<EmployeeAttendanceTodayRow[]>(
      `
        SELECT
          id,
          DATE_FORMAT(attendance_date, '%Y-%m-%d') AS attendance_date,
          CASE
            WHEN check_in IS NULL THEN NULL
            ELSE DATE_FORMAT(check_in, '%Y-%m-%d %H:%i:%s')
          END AS check_in,
          CASE
            WHEN check_out IS NULL THEN NULL
            ELSE DATE_FORMAT(check_out, '%Y-%m-%d %H:%i:%s')
          END AS check_out,
          status
        FROM attendances
        WHERE user_id = ? AND attendance_date = ? AND deleted_at IS NULL
        LIMIT 1
      `,
      [userId, today],
    );

    const [monthRows] = await db.execute<EmployeeAttendanceMonthRow[]>(
      `
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present,
          SUM(CASE WHEN status = 'sick' THEN 1 ELSE 0 END) AS sick,
          SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) AS leave_count,
          SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS absent
        FROM attendances
        WHERE user_id = ? AND attendance_date >= ? AND attendance_date < ? AND deleted_at IS NULL
      `,
      [userId, monthStart, nextMonthStart],
    );

    const [leaveSummaryRows] = await db.execute<EmployeeLeaveSummaryRow[]>(
      `
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected
        FROM leave_requests
        WHERE user_id = ? AND deleted_at IS NULL
      `,
      [userId],
    );

    const [recentAttendanceRows] = await db.query<EmployeeRecentAttendanceRow[]>(
      `
        SELECT
          id,
          DATE_FORMAT(attendance_date, '%Y-%m-%d') AS attendance_date,
          CASE
            WHEN check_in IS NULL THEN NULL
            ELSE DATE_FORMAT(check_in, '%Y-%m-%d %H:%i:%s')
          END AS check_in,
          CASE
            WHEN check_out IS NULL THEN NULL
            ELSE DATE_FORMAT(check_out, '%Y-%m-%d %H:%i:%s')
          END AS check_out,
          status
        FROM attendances
        WHERE user_id = ? AND deleted_at IS NULL
        ORDER BY attendance_date DESC, created_at DESC
        LIMIT 5
      `,
      [userId],
    );

    const [recentLeaveRows] = await db.query<EmployeeRecentLeaveRow[]>(
      `
        SELECT
          id,
          leave_type_id,
          lt.code AS leave_type_code,
          lt.name AS leave_type_name,
          DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
          DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
          status,
          CASE
            WHEN approved_at IS NULL THEN NULL
            ELSE DATE_FORMAT(approved_at, '%Y-%m-%d %H:%i:%s')
          END AS approved_at,
          rejection_reason,
          DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
        FROM leave_requests l
        INNER JOIN leave_types lt ON lt.id = l.leave_type_id
        WHERE user_id = ? AND l.deleted_at IS NULL
        ORDER BY l.created_at DESC
        LIMIT 5
      `,
      [userId],
    );

    const todayAttendance = todayRows[0];
    const monthStats = monthRows[0];
    const leaveSummary = leaveSummaryRows[0];
    const monthLabel = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}`;

    return {
      attendanceToday: {
        attendanceDate: today,
        workflowStatus: !todayAttendance
          ? 'not_checked_in'
          : todayAttendance.check_out
            ? 'checked_out'
            : 'checked_in',
        attendanceStatus: todayAttendance?.status ?? null,
        checkIn: todayAttendance?.check_in ?? null,
        checkOut: todayAttendance?.check_out ?? null,
      },
      attendanceThisMonth: {
        month: monthLabel,
        total: monthStats?.total ?? 0,
        present: monthStats?.present ?? 0,
        sick: monthStats?.sick ?? 0,
        leave: monthStats?.leave_count ?? 0,
        absent: monthStats?.absent ?? 0,
      },
      leaveSummary: {
        total: leaveSummary?.total ?? 0,
        pending: leaveSummary?.pending ?? 0,
        approved: leaveSummary?.approved ?? 0,
        rejected: leaveSummary?.rejected ?? 0,
      },
      recentAttendances: recentAttendanceRows.map((row) => ({
        id: row.id,
        attendanceDate: row.attendance_date,
        checkIn: row.check_in,
        checkOut: row.check_out,
        status: row.status,
      })),
      recentLeaves: recentLeaveRows.map((row) => ({
        id: row.id,
        leaveTypeId: row.leave_type_id,
        leaveTypeCode: row.leave_type_code,
        leaveTypeName: row.leave_type_name,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status,
        approvedAt: row.approved_at,
        rejectionReason: row.rejection_reason,
        createdAt: row.created_at,
      })),
    };
  },
};
