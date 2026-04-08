import { RowDataPacket } from 'mysql2/promise';

import { db } from '../config/db';
import { formatDateForMysql } from '../utils/date';

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

export const dashboardRepository = {
  async getStats(): Promise<DashboardStats> {
    const today = formatDateForMysql(new Date());
    const [rows] = await db.execute<DashboardStatsRow[]>(
      `
        SELECT
          (SELECT COUNT(*) FROM users) AS total_employees,
          (SELECT COUNT(*) FROM users WHERE is_active = 1) AS active_employees,
          (SELECT COUNT(*) FROM departments) AS total_departments,
          (SELECT COUNT(*) FROM positions) AS total_positions,
          (SELECT COUNT(*) FROM attendances WHERE attendance_date = ?) AS total_attendances_today,
          (SELECT COUNT(*) FROM leave_requests WHERE status = 'pending') AS total_pending_leaves,
          (SELECT COUNT(*) FROM leave_requests WHERE status = 'approved') AS total_approved_leaves,
          (SELECT COUNT(*) FROM leave_requests WHERE status = 'rejected') AS total_rejected_leaves
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
};
