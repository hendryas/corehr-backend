import { AuthenticatedUser } from '../types/auth';
import {
  LeaveCreatePayload,
  LeaveListQuery,
  LeaveRejectPayload,
  LeaveUpdatePayload,
} from '../types/leave';
import { AppError } from '../utils/app-error';
import { formatDateTimeForMysql } from '../utils/date';
import { isForeignKeyConstraintError } from '../utils/mysql-error';
import { leaveRepository } from '../repositories/leave.repository';
import { employeeRepository } from '../repositories/employee.repository';

const ensureUserExists = async (userId: number): Promise<void> => {
  const user = await employeeRepository.findById(userId);

  if (!user) {
    throw new AppError('Employee not found', 404);
  }
};

const ensureLeaveAccessible = (authUser: AuthenticatedUser, ownerUserId: number): void => {
  if (authUser.role === 'employee' && authUser.id !== ownerUserId) {
    throw new AppError('You do not have permission to access this leave request', 403);
  }
};

const ensurePendingStatus = (status: 'pending' | 'approved' | 'rejected'): void => {
  if (status !== 'pending') {
    throw new AppError('Only pending leave requests can be modified', 422);
  }
};

const resolveLeaveOwnerId = (authUser: AuthenticatedUser, requestedUserId?: number): number => {
  if (authUser.role === 'employee') {
    return authUser.id;
  }

  return requestedUserId ?? authUser.id;
};

export const leaveService = {
  async getLeaves(authUser: AuthenticatedUser, query: LeaveListQuery) {
    const scopedQuery: LeaveListQuery = {
      ...query,
      userId: authUser.role === 'employee' ? authUser.id : query.userId,
    };
    const result = await leaveRepository.findAll(scopedQuery);

    return {
      items: result.items,
      pagination: {
        page: scopedQuery.page,
        limit: scopedQuery.limit,
        total: result.total,
        totalPages: result.total === 0 ? 0 : Math.ceil(result.total / scopedQuery.limit),
      },
    };
  },

  async exportLeaves(query: LeaveListQuery) {
    return leaveRepository.findAllForExport(query);
  },

  async getLeaveById(authUser: AuthenticatedUser, id: number) {
    const leaveRequest = await leaveRepository.findById(id);

    if (!leaveRequest) {
      throw new AppError('Leave request not found', 404);
    }

    ensureLeaveAccessible(authUser, leaveRequest.userId);

    return leaveRequest;
  },

  async getMyLeaves(authUser: AuthenticatedUser, query: LeaveListQuery) {
    return this.getLeaves(authUser, {
      ...query,
      userId: authUser.id,
    });
  },

  async createLeave(authUser: AuthenticatedUser, payload: LeaveCreatePayload) {
    const userId = resolveLeaveOwnerId(authUser, payload.userId);
    await ensureUserExists(userId);

    try {
      const leaveId = await leaveRepository.create({
        userId,
        leaveType: payload.leaveType,
        startDate: payload.startDate,
        endDate: payload.endDate,
        reason: payload.reason,
      });

      return this.getLeaveById(
        {
          ...authUser,
          role: 'admin_hr',
        },
        leaveId,
      );
    } catch (error) {
      if (isForeignKeyConstraintError(error)) {
        throw new AppError('Employee not found', 404);
      }

      throw error;
    }
  },

  async updateLeave(authUser: AuthenticatedUser, id: number, payload: LeaveUpdatePayload) {
    const existingLeave = await this.getLeaveById(authUser, id);
    ensurePendingStatus(existingLeave.status);

    const userId = resolveLeaveOwnerId(authUser, payload.userId ?? existingLeave.userId);
    await ensureUserExists(userId);

    try {
      await leaveRepository.update(id, {
        userId,
        leaveType: payload.leaveType,
        startDate: payload.startDate,
        endDate: payload.endDate,
        reason: payload.reason,
      });
    } catch (error) {
      if (isForeignKeyConstraintError(error)) {
        throw new AppError('Employee not found', 404);
      }

      throw error;
    }

    return this.getLeaveById(
      {
        ...authUser,
        role: 'admin_hr',
      },
      id,
    );
  },

  async deleteLeave(authUser: AuthenticatedUser, id: number) {
    const existingLeave = await this.getLeaveById(authUser, id);
    ensurePendingStatus(existingLeave.status);

    await leaveRepository.softDelete(id);
  },

  async approveLeave(authUser: AuthenticatedUser, id: number) {
    const leaveRequest = await this.getLeaveById(
      {
        ...authUser,
        role: 'admin_hr',
      },
      id,
    );
    ensurePendingStatus(leaveRequest.status);

    await leaveRepository.approve(id, authUser.id, formatDateTimeForMysql(new Date()));

    return this.getLeaveById(
      {
        ...authUser,
        role: 'admin_hr',
      },
      id,
    );
  },

  async rejectLeave(authUser: AuthenticatedUser, id: number, payload: LeaveRejectPayload) {
    const leaveRequest = await this.getLeaveById(
      {
        ...authUser,
        role: 'admin_hr',
      },
      id,
    );
    ensurePendingStatus(leaveRequest.status);

    await leaveRepository.reject(id, authUser.id, formatDateTimeForMysql(new Date()), payload);

    return this.getLeaveById(
      {
        ...authUser,
        role: 'admin_hr',
      },
      id,
    );
  },
};
