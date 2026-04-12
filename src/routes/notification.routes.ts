import { Router } from 'express';

import * as notificationController from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth.middleware';
import {
  validateNotificationIdParam,
  validateNotificationListQuery,
} from '../validators/notification.validator';

const router = Router();

router.use(authenticate);

router.get('/', validateNotificationListQuery, notificationController.getNotifications);
router.patch('/read-all', notificationController.markAllNotificationsAsRead);
router.patch('/:id/read', validateNotificationIdParam, notificationController.markNotificationAsRead);

export default router;
