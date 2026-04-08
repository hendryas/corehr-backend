import { Router } from 'express';

import * as attendanceController from '../controllers/attendance.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { allowRoles } from '../middlewares/role.middleware';
import {
  validateAttendanceIdParam,
  validateAttendanceListQuery,
  validateCreateAttendance,
  validateUpdateAttendance,
} from '../validators/attendance.validator';

const router = Router();

router.use(authenticate);

router.get(
  '/me',
  allowRoles('admin_hr', 'employee'),
  validateAttendanceListQuery,
  attendanceController.getMyAttendances,
);
router.post('/check-in', allowRoles('admin_hr', 'employee'), attendanceController.checkIn);
router.post('/check-out', allowRoles('admin_hr', 'employee'), attendanceController.checkOut);
router.get(
  '/',
  allowRoles('admin_hr', 'employee'),
  validateAttendanceListQuery,
  attendanceController.getAttendances,
);
router.get(
  '/:id',
  allowRoles('admin_hr', 'employee'),
  validateAttendanceIdParam,
  attendanceController.getAttendanceById,
);
router.post(
  '/',
  allowRoles('admin_hr'),
  validateCreateAttendance,
  attendanceController.createAttendance,
);
router.put(
  '/:id',
  allowRoles('admin_hr'),
  validateAttendanceIdParam,
  validateUpdateAttendance,
  attendanceController.updateAttendance,
);
router.delete(
  '/:id',
  allowRoles('admin_hr'),
  validateAttendanceIdParam,
  attendanceController.deleteAttendance,
);

export default router;
