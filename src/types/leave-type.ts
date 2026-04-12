export interface LeaveTypeEntity {
  id: number;
  code: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveTypePayload {
  code: string;
  name: string;
  description: string | null;
}
