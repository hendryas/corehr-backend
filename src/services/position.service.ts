import { departmentRepository } from '../repositories/department.repository';
import { positionRepository, PositionPayload } from '../repositories/position.repository';
import { AppError } from '../utils/app-error';
import { isDuplicateEntryError, isForeignKeyConstraintError } from '../utils/mysql-error';

const ensureDepartmentExists = async (departmentId: number): Promise<void> => {
  const department = await departmentRepository.findById(departmentId);

  if (!department) {
    throw new AppError('Department not found', 404);
  }
};

export const positionService = {
  async getPositions() {
    return positionRepository.findAll();
  },

  async getPositionById(id: number) {
    const position = await positionRepository.findById(id);

    if (!position) {
      throw new AppError('Position not found', 404);
    }

    return position;
  },

  async createPosition(payload: PositionPayload) {
    await ensureDepartmentExists(payload.departmentId);

    try {
      const positionId = await positionRepository.create(payload);

      return this.getPositionById(positionId);
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new AppError('Position name already exists in this department', 409);
      }

      if (isForeignKeyConstraintError(error)) {
        throw new AppError('Department not found', 404);
      }

      throw error;
    }
  },

  async updatePosition(id: number, payload: PositionPayload) {
    await this.getPositionById(id);
    await ensureDepartmentExists(payload.departmentId);

    try {
      await positionRepository.update(id, payload);
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new AppError('Position name already exists in this department', 409);
      }

      if (isForeignKeyConstraintError(error)) {
        throw new AppError('Department not found', 404);
      }

      throw error;
    }

    return this.getPositionById(id);
  },

  async deletePosition(id: number) {
    await this.getPositionById(id);

    try {
      await positionRepository.delete(id);
    } catch (error) {
      if (isForeignKeyConstraintError(error)) {
        throw new AppError(
          'Position cannot be deleted because it is still used by related data',
          409,
        );
      }

      throw error;
    }
  },
};
