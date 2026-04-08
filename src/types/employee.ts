import { UserRole } from './auth';

export interface EmployeeListQuery {
  search: string | null;
  departmentId: number | null;
  positionId: number | null;
  isActive: boolean | null;
  page: number;
  limit: number;
}

export interface EmployeeCreatePayload {
  employeeCode: string;
  fullName: string;
  email: string;
  password: string;
  phone: string | null;
  gender: string | null;
  address: string | null;
  hireDate: string | null;
  isActive: boolean;
  role: UserRole;
  departmentId: number;
  positionId: number;
}

export interface EmployeeUpdatePayload {
  employeeCode: string;
  fullName: string;
  email: string;
  password?: string;
  phone: string | null;
  gender: string | null;
  address: string | null;
  hireDate: string | null;
  isActive: boolean;
  role: UserRole;
  departmentId: number;
  positionId: number;
}

export interface EmployeeEntity {
  id: number;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string | null;
  gender: string | null;
  address: string | null;
  hireDate: string | null;
  isActive: boolean;
  role: UserRole;
  departmentId: number | null;
  departmentName: string | null;
  positionId: number | null;
  positionName: string | null;
  createdAt: string;
  updatedAt: string;
}
