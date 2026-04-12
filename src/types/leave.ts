import { LeaveRequestStatus } from './auth';

export interface LeaveListQuery {
  userId: number | null;
  status: LeaveRequestStatus | null;
  leaveTypeId: number | null;
  startDate: string | null;
  endDate: string | null;
  page: number;
  limit: number;
}

export interface LeaveCreatePayload {
  userId?: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface LeaveUpdatePayload extends LeaveCreatePayload {}

export interface LeaveRejectPayload {
  rejectionReason: string;
}

export interface LeaveEntity {
  id: number;
  userId: number;
  employeeCode: string;
  fullName: string;
  leaveTypeId: number;
  leaveTypeCode: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveRequestStatus;
  approvedBy: number | null;
  approverName: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}
