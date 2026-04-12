import { employeeRepository } from '../repositories/employee.repository';
import { notificationRepository } from '../repositories/notification.repository';
import { AuthenticatedUser } from '../types/auth';
import { LeaveEntity } from '../types/leave';
import {
  CreateNotificationPayload,
  NotificationEntity,
  NotificationListQuery,
} from '../types/notification';
import { AppError } from '../utils/app-error';

interface NotificationRepository {
  createMany: (payloads: CreateNotificationPayload[]) => Promise<void>;
  findAllByUserId: (
    userId: number,
    query: NotificationListQuery,
  ) => Promise<{ items: NotificationEntity[]; total: number; unreadCount: number }>;
  findByIdForUser: (id: number, userId: number) => Promise<NotificationEntity | null>;
  markAsRead: (id: number, userId: number, readAt: Date) => Promise<boolean>;
  markAllAsRead: (userId: number, readAt: Date) => Promise<number>;
}

interface EmployeeRepository {
  findActiveByRole: typeof employeeRepository.findActiveByRole;
}

interface NotificationServiceDependencies {
  notificationRepository: NotificationRepository;
  employeeRepository: EmployeeRepository;
  now: () => Date;
}

const createLeaveSubmissionMessage = (leave: LeaveEntity): string => {
  return `${leave.fullName} mengajukan cuti ${leave.leaveTypeName} untuk ${leave.startDate} sampai ${leave.endDate}.`;
};

const createLeaveApprovedMessage = (leave: LeaveEntity, actorName: string): string => {
  return `Pengajuan cuti ${leave.leaveTypeName} untuk ${leave.startDate} sampai ${leave.endDate} telah disetujui oleh ${actorName}.`;
};

const createLeaveRejectedMessage = (leave: LeaveEntity, actorName: string): string => {
  const rejectionReasonSuffix = leave.rejectionReason ? ` Alasan: ${leave.rejectionReason}.` : '';

  return `Pengajuan cuti ${leave.leaveTypeName} untuk ${leave.startDate} sampai ${leave.endDate} telah ditolak oleh ${actorName}.${rejectionReasonSuffix}`;
};

export const createNotificationService = ({
  notificationRepository: notificationRepo,
  employeeRepository: employeeRepo,
  now,
}: NotificationServiceDependencies) => {
  return {
    async getNotifications(authUser: AuthenticatedUser, query: NotificationListQuery) {
      const result = await notificationRepo.findAllByUserId(authUser.id, query);

      return {
        items: result.items,
        unreadCount: result.unreadCount,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: result.total,
          totalPages: result.total === 0 ? 0 : Math.ceil(result.total / query.limit),
        },
      };
    },

    async markNotificationAsRead(authUser: AuthenticatedUser, id: number) {
      const exists = await notificationRepo.findByIdForUser(id, authUser.id);

      if (!exists) {
        throw new AppError('Notification not found', 404);
      }

      await notificationRepo.markAsRead(id, authUser.id, now());

      return notificationRepo.findByIdForUser(id, authUser.id);
    },

    async markAllNotificationsAsRead(authUser: AuthenticatedUser) {
      const updatedCount = await notificationRepo.markAllAsRead(authUser.id, now());

      return {
        updatedCount,
      };
    },

    async notifyLeaveSubmitted(actor: AuthenticatedUser, leave: LeaveEntity): Promise<void> {
      const hrAdmins = await employeeRepo.findActiveByRole('admin_hr');
      const recipients = hrAdmins
        .filter((admin) => admin.id !== actor.id)
        .map((admin) => admin.id);

      if (recipients.length === 0) {
        return;
      }

      await notificationRepo.createMany(
        recipients.map((userId) => ({
          userId,
          actorUserId: actor.id,
          leaveRequestId: leave.id,
          type: 'leave_submitted',
          title: 'Pengajuan cuti baru',
          message: createLeaveSubmissionMessage(leave),
        })),
      );
    },

    async notifyLeaveApproved(actor: AuthenticatedUser, leave: LeaveEntity): Promise<void> {
      if (leave.userId === actor.id) {
        return;
      }

      await notificationRepo.createMany([
        {
          userId: leave.userId,
          actorUserId: actor.id,
          leaveRequestId: leave.id,
          type: 'leave_approved',
          title: 'Pengajuan cuti disetujui',
          message: createLeaveApprovedMessage(leave, actor.fullName),
        },
      ]);
    },

    async notifyLeaveRejected(actor: AuthenticatedUser, leave: LeaveEntity): Promise<void> {
      if (leave.userId === actor.id) {
        return;
      }

      await notificationRepo.createMany([
        {
          userId: leave.userId,
          actorUserId: actor.id,
          leaveRequestId: leave.id,
          type: 'leave_rejected',
          title: 'Pengajuan cuti ditolak',
          message: createLeaveRejectedMessage(leave, actor.fullName),
        },
      ]);
    },
  };
};

export const notificationService = createNotificationService({
  notificationRepository,
  employeeRepository,
  now: () => new Date(),
});
