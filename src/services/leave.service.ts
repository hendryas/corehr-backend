import { employeeRepository } from '../repositories/employee.repository';
import { leaveRepository } from '../repositories/leave.repository';
import { leaveTypeRepository } from '../repositories/leave-type.repository';
import { notificationService } from './notification.service';
import { AuthenticatedUser } from '../types/auth';
import {
  LeaveCreatePayload,
  LeaveEntity,
  LeaveListQuery,
  LeaveRejectPayload,
  LeaveUpdatePayload,
} from '../types/leave';
import { AppError } from '../utils/app-error';
import { formatDateTimeForMysql } from '../utils/date';
import { isForeignKeyConstraintError } from '../utils/mysql-error';

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

interface LeaveRepository {
  findAll: typeof leaveRepository.findAll;
  findAllForExport: typeof leaveRepository.findAllForExport;
  findById: typeof leaveRepository.findById;
  create: typeof leaveRepository.create;
  update: typeof leaveRepository.update;
  softDelete: typeof leaveRepository.softDelete;
  approve: typeof leaveRepository.approve;
  reject: typeof leaveRepository.reject;
}

interface EmployeeRepository {
  findById: typeof employeeRepository.findById;
}

interface LeaveTypeRepository {
  findById: typeof leaveTypeRepository.findById;
}

interface NotificationService {
  notifyLeaveSubmitted: typeof notificationService.notifyLeaveSubmitted;
  notifyLeaveApproved: typeof notificationService.notifyLeaveApproved;
  notifyLeaveRejected: typeof notificationService.notifyLeaveRejected;
}

interface LeaveServiceDependencies {
  leaveRepository: LeaveRepository;
  employeeRepository: EmployeeRepository;
  leaveTypeRepository: LeaveTypeRepository;
  notificationService: NotificationService;
  now: () => Date;
}

const toAdminScopedUser = (authUser: AuthenticatedUser): AuthenticatedUser => {
  return {
    ...authUser,
    role: 'admin_hr',
  };
};

export const createLeaveService = ({
  leaveRepository: leaveRepo,
  employeeRepository: employeeRepo,
  leaveTypeRepository: leaveTypeRepo,
  notificationService: notifications,
  now,
}: LeaveServiceDependencies) => {
  const ensureUserExists = async (userId: number): Promise<void> => {
    const user = await employeeRepo.findById(userId);

    if (!user) {
      throw new AppError('Employee not found', 404);
    }
  };

  const ensureLeaveTypeExists = async (leaveTypeId: number): Promise<void> => {
    const leaveType = await leaveTypeRepo.findById(leaveTypeId);

    if (!leaveType) {
      throw new AppError('Leave type not found', 404);
    }
  };

  const getLeaveById = async (authUser: AuthenticatedUser, id: number): Promise<LeaveEntity> => {
    const leaveRequest = await leaveRepo.findById(id);

    if (!leaveRequest) {
      throw new AppError('Leave request not found', 404);
    }

    ensureLeaveAccessible(authUser, leaveRequest.userId);

    return leaveRequest;
  };

  return {
    async getLeaves(authUser: AuthenticatedUser, query: LeaveListQuery) {
      const scopedQuery: LeaveListQuery = {
        ...query,
        userId: authUser.role === 'employee' ? authUser.id : query.userId,
      };
      const result = await leaveRepo.findAll(scopedQuery);

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
      return leaveRepo.findAllForExport(query);
    },

    async getLeaveById(authUser: AuthenticatedUser, id: number) {
      return getLeaveById(authUser, id);
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
      await ensureLeaveTypeExists(payload.leaveTypeId);

      try {
        const leaveId = await leaveRepo.create({
          userId,
          leaveTypeId: payload.leaveTypeId,
          startDate: payload.startDate,
          endDate: payload.endDate,
          reason: payload.reason,
        });

        const createdLeave = await getLeaveById(toAdminScopedUser(authUser), leaveId);

        await notifications.notifyLeaveSubmitted(authUser, createdLeave);

        return createdLeave;
      } catch (error) {
        if (isForeignKeyConstraintError(error)) {
          throw new AppError('Employee not found', 404);
        }

        throw error;
      }
    },

    async updateLeave(authUser: AuthenticatedUser, id: number, payload: LeaveUpdatePayload) {
      const existingLeave = await getLeaveById(authUser, id);
      ensurePendingStatus(existingLeave.status);

      const userId = resolveLeaveOwnerId(authUser, payload.userId ?? existingLeave.userId);
      await ensureUserExists(userId);
      await ensureLeaveTypeExists(payload.leaveTypeId);

      try {
        await leaveRepo.update(id, {
          userId,
          leaveTypeId: payload.leaveTypeId,
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

      return getLeaveById(toAdminScopedUser(authUser), id);
    },

    async deleteLeave(authUser: AuthenticatedUser, id: number) {
      const existingLeave = await getLeaveById(authUser, id);
      ensurePendingStatus(existingLeave.status);

      await leaveRepo.softDelete(id);
    },

    async approveLeave(authUser: AuthenticatedUser, id: number) {
      const leaveRequest = await getLeaveById(toAdminScopedUser(authUser), id);
      ensurePendingStatus(leaveRequest.status);

      await leaveRepo.approve(id, authUser.id, formatDateTimeForMysql(now()));

      const approvedLeave = await getLeaveById(toAdminScopedUser(authUser), id);

      await notifications.notifyLeaveApproved(authUser, approvedLeave);

      return approvedLeave;
    },

    async rejectLeave(authUser: AuthenticatedUser, id: number, payload: LeaveRejectPayload) {
      const leaveRequest = await getLeaveById(toAdminScopedUser(authUser), id);
      ensurePendingStatus(leaveRequest.status);

      await leaveRepo.reject(id, authUser.id, formatDateTimeForMysql(now()), payload);

      const rejectedLeave = await getLeaveById(toAdminScopedUser(authUser), id);

      await notifications.notifyLeaveRejected(authUser, rejectedLeave);

      return rejectedLeave;
    },
  };
};

export const leaveService = createLeaveService({
  leaveRepository,
  employeeRepository,
  leaveTypeRepository,
  notificationService,
  now: () => new Date(),
});
