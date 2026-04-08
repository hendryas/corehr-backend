import { departmentRepository } from '../repositories/department.repository';
import { AppError } from '../utils/app-error';
import { isDuplicateEntryError, isForeignKeyConstraintError } from '../utils/mysql-error';

interface DepartmentPayload {
  name: string;
  description: string | null;
}

export const departmentService = {
  async getDepartments() {
    return departmentRepository.findAll();
  },

  async getDepartmentById(id: number) {
    const department = await departmentRepository.findById(id);

    if (!department) {
      throw new AppError('Department not found', 404);
    }

    return department;
  },

  async createDepartment(payload: DepartmentPayload) {
    try {
      const departmentId = await departmentRepository.create(payload);

      return this.getDepartmentById(departmentId);
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new AppError('Department name already exists', 409);
      }

      throw error;
    }
  },

  async updateDepartment(id: number, payload: DepartmentPayload) {
    await this.getDepartmentById(id);

    try {
      await departmentRepository.update(id, payload);
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new AppError('Department name already exists', 409);
      }

      throw error;
    }

    return this.getDepartmentById(id);
  },

  async deleteDepartment(id: number) {
    await this.getDepartmentById(id);

    try {
      await departmentRepository.delete(id);
    } catch (error) {
      if (isForeignKeyConstraintError(error)) {
        throw new AppError(
          'Department cannot be deleted because it is still used by related data',
          409,
        );
      }

      throw error;
    }
  },
};
