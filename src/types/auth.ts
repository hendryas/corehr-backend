export type UserRole = 'admin_hr' | 'employee';
export type AttendanceStatus = 'present' | 'sick' | 'leave' | 'absent';
export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected';

export interface JwtUserPayload {
  id: number;
  email: string;
  role: UserRole;
  sessionId: string;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: UserRole;
  employeeCode: string;
  fullName: string;
  phone: string | null;
  gender: string | null;
  address: string | null;
  hireDate: string | null;
  isActive: boolean;
  departmentId: number | null;
  departmentName: string | null;
  positionId: number | null;
  positionName: string | null;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface AuthenticatedSession {
  id: string;
  userId: number;
  lastActivityAt: Date;
  invalidatedAt: Date | null;
  invalidationReason: string | null;
}

export interface ActiveRequestSession {
  id: string;
  authenticatedAt: Date;
}
