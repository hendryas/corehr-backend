import { AttendanceStatus, UserRole } from './auth';

export interface AttendanceListQuery {
  userId: number | null;
  attendanceDate: string | null;
  status: AttendanceStatus | null;
  page: number;
  limit: number;
}

export interface AttendanceCreatePayload {
  userId: number;
  attendanceDate: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  notes: string | null;
}

export interface AttendanceUpdatePayload extends AttendanceCreatePayload {}

export interface AttendanceEntity {
  id: number;
  userId: number;
  employeeCode: string;
  fullName: string;
  role: UserRole;
  attendanceDate: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
