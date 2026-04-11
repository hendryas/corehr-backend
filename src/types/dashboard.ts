import { AttendanceStatus, LeaveRequestStatus } from './auth';

export interface EmployeeDashboardAttendanceToday {
  attendanceDate: string;
  workflowStatus: 'not_checked_in' | 'checked_in' | 'checked_out';
  attendanceStatus: AttendanceStatus | null;
  checkIn: string | null;
  checkOut: string | null;
}

export interface EmployeeDashboardAttendanceMonthStats {
  month: string;
  total: number;
  present: number;
  sick: number;
  leave: number;
  absent: number;
}

export interface EmployeeDashboardLeaveSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface EmployeeDashboardAttendanceItem {
  id: number;
  attendanceDate: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
}

export interface EmployeeDashboardLeaveItem {
  id: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: LeaveRequestStatus;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export interface EmployeeDashboardStats {
  attendanceToday: EmployeeDashboardAttendanceToday;
  attendanceThisMonth: EmployeeDashboardAttendanceMonthStats;
  leaveSummary: EmployeeDashboardLeaveSummary;
  recentAttendances: EmployeeDashboardAttendanceItem[];
  recentLeaves: EmployeeDashboardLeaveItem[];
}
