import bcrypt from 'bcryptjs';

import { departmentRepository } from '../repositories/department.repository';
import { employeeRepository } from '../repositories/employee.repository';
import { positionRepository } from '../repositories/position.repository';
import { EmployeeCreatePayload, EmployeeListQuery, EmployeeUpdatePayload } from '../types/employee';
import { AppError } from '../utils/app-error';
import { isDuplicateEntryError, isForeignKeyConstraintError } from '../utils/mysql-error';

const ensureDepartmentExists = async (departmentId: number): Promise<void> => {
  const department = await departmentRepository.findById(departmentId);

  if (!department) {
    throw new AppError('Department not found', 404);
  }
};

const ensurePositionExists = async (positionId: number) => {
  const position = await positionRepository.findById(positionId);

  if (!position) {
    throw new AppError('Position not found', 404);
  }

  return position;
};

const ensurePositionBelongsToDepartment = async (
  positionId: number,
  departmentId: number,
): Promise<void> => {
  const position = await ensurePositionExists(positionId);

  if (position.departmentId !== departmentId) {
    throw new AppError('Selected position does not belong to the selected department', 422);
  }
};

const mapDuplicateEntryToMessage = (payload: { email: string; employeeCode: string }, error: unknown): never => {
  const message = String((error as { sqlMessage?: string }).sqlMessage ?? '').toLowerCase();

  if (message.includes('uq_users_email')) {
    throw new AppError('Email already exists', 409);
  }

  if (message.includes('uq_users_employee_code')) {
    throw new AppError('Employee code already exists', 409);
  }

  throw new AppError(
    `Employee with email ${payload.email} or employee code ${payload.employeeCode} already exists`,
    409,
  );
};

export const employeeService = {
  async getEmployees(query: EmployeeListQuery) {
    const result = await employeeRepository.findAll(query);

    return {
      items: result.items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: result.total === 0 ? 0 : Math.ceil(result.total / query.limit),
      },
    };
  },

  async getEmployeeById(id: number) {
    const employee = await employeeRepository.findById(id);

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    return employee;
  },

  async getMyProfile(id: number) {
    return this.getEmployeeById(id);
  },

  async createEmployee(payload: EmployeeCreatePayload) {
    await ensureDepartmentExists(payload.departmentId);
    await ensurePositionBelongsToDepartment(payload.positionId, payload.departmentId);

    const hashedPassword = await bcrypt.hash(payload.password, 10);

    try {
      const employeeId = await employeeRepository.create({
        ...payload,
        password: hashedPassword,
      });

      return this.getEmployeeById(employeeId);
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        mapDuplicateEntryToMessage(payload, error);
      }

      if (isForeignKeyConstraintError(error)) {
        throw new AppError('Department or position not found', 404);
      }

      throw error;
    }
  },

  async updateEmployee(id: number, payload: EmployeeUpdatePayload) {
    await this.getEmployeeById(id);
    await ensureDepartmentExists(payload.departmentId);
    await ensurePositionBelongsToDepartment(payload.positionId, payload.departmentId);

    const updatePayload: EmployeeUpdatePayload = { ...payload };

    if (payload.password) {
      updatePayload.password = await bcrypt.hash(payload.password, 10);
    } else {
      delete updatePayload.password;
    }

    try {
      await employeeRepository.update(id, updatePayload);
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        mapDuplicateEntryToMessage(payload, error);
      }

      if (isForeignKeyConstraintError(error)) {
        throw new AppError('Department or position not found', 404);
      }

      throw error;
    }

    return this.getEmployeeById(id);
  },

  async deleteEmployee(id: number) {
    const employee = await this.getEmployeeById(id);

    if (employee.role === 'admin_hr') {
      throw new AppError('Admin HR account cannot be deleted through this endpoint', 422);
    }

    await employeeRepository.delete(id);
  },
};
