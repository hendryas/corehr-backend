export type NotificationType = 'leave_submitted' | 'leave_approved' | 'leave_rejected';

export interface NotificationEntity {
  id: number;
  userId: number;
  actorUserId: number | null;
  actorName: string | null;
  leaveRequestId: number | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListQuery {
  page: number;
  limit: number;
  unreadOnly: boolean;
}

export interface CreateNotificationPayload {
  userId: number;
  actorUserId: number | null;
  leaveRequestId: number | null;
  type: NotificationType;
  title: string;
  message: string;
}
