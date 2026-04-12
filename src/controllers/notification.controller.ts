import { RequestHandler } from 'express';

import { notificationService } from '../services/notification.service';
import { sendSuccess } from '../utils/response';

export const getNotifications: RequestHandler = async (req, res) => {
  const notifications = await notificationService.getNotifications(req.user!, req.notificationListQuery!);

  return sendSuccess(res, {
    message: 'Notifications fetched successfully',
    data: notifications,
  });
};

export const markNotificationAsRead: RequestHandler = async (req, res) => {
  const notification = await notificationService.markNotificationAsRead(req.user!, Number(req.params.id));

  return sendSuccess(res, {
    message: 'Notification marked as read',
    data: notification,
  });
};

export const markAllNotificationsAsRead: RequestHandler = async (req, res) => {
  const result = await notificationService.markAllNotificationsAsRead(req.user!);

  return sendSuccess(res, {
    message: 'All notifications marked as read',
    data: result,
  });
};
