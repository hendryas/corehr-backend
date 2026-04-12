import { leaveRepository } from '../repositories/leave.repository';
import { leaveTypeRepository } from '../repositories/leave-type.repository';
import { LeaveTypePayload } from '../types/leave-type';
import { AppError } from '../utils/app-error';
import { isDuplicateEntryError } from '../utils/mysql-error';

interface LeaveTypeRepository {
  findAll: typeof leaveTypeRepository.findAll;
  findById: typeof leaveTypeRepository.findById;
  create: typeof leaveTypeRepository.create;
  update: typeof leaveTypeRepository.update;
  softDelete: typeof leaveTypeRepository.softDelete;
}

interface LeaveRepository {
  countActiveByLeaveTypeId: typeof leaveRepository.countActiveByLeaveTypeId;
}

export const createLeaveTypeService = (
  leaveTypeRepo: LeaveTypeRepository,
  leaveRepo: LeaveRepository,
) => ({
  async getLeaveTypes() {
    return leaveTypeRepo.findAll();
  },

  async getLeaveTypeById(id: number) {
    const leaveType = await leaveTypeRepo.findById(id);

    if (!leaveType) {
      throw new AppError('Leave type not found', 404);
    }

    return leaveType;
  },

  async createLeaveType(payload: LeaveTypePayload) {
    try {
      const leaveTypeId = await leaveTypeRepo.create(payload);

      return this.getLeaveTypeById(leaveTypeId);
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new AppError('Leave type code or name already exists', 409);
      }

      throw error;
    }
  },

  async updateLeaveType(id: number, payload: LeaveTypePayload) {
    await this.getLeaveTypeById(id);

    try {
      await leaveTypeRepo.update(id, payload);
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new AppError('Leave type code or name already exists', 409);
      }

      throw error;
    }

    return this.getLeaveTypeById(id);
  },

  async deleteLeaveType(id: number) {
    await this.getLeaveTypeById(id);
    const activeLeaves = await leaveRepo.countActiveByLeaveTypeId(id);

    if (activeLeaves > 0) {
      throw new AppError(
        'Leave type cannot be deleted because it is still used by active leave requests',
        409,
      );
    }

    await leaveTypeRepo.softDelete(id);
  },
});

export const leaveTypeService = createLeaveTypeService(leaveTypeRepository, leaveRepository);
