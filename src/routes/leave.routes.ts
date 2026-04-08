import { Router } from 'express';

import * as leaveController from '../controllers/leave.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { allowRoles } from '../middlewares/role.middleware';
import {
  validateCreateLeave,
  validateLeaveIdParam,
  validateLeaveListQuery,
  validateRejectLeave,
  validateUpdateLeave,
} from '../validators/leave.validator';

const router = Router();

router.use(authenticate);

router.get('/me', allowRoles('admin_hr', 'employee'), validateLeaveListQuery, leaveController.getMyLeaves);
router.get(
  '/export/csv',
  allowRoles('admin_hr'),
  validateLeaveListQuery,
  leaveController.exportLeavesCsv,
);
router.get('/', allowRoles('admin_hr', 'employee'), validateLeaveListQuery, leaveController.getLeaves);
router.get(
  '/:id',
  allowRoles('admin_hr', 'employee'),
  validateLeaveIdParam,
  leaveController.getLeaveById,
);
router.post('/', allowRoles('admin_hr', 'employee'), validateCreateLeave, leaveController.createLeave);
router.put(
  '/:id',
  allowRoles('admin_hr', 'employee'),
  validateLeaveIdParam,
  validateUpdateLeave,
  leaveController.updateLeave,
);
router.delete(
  '/:id',
  allowRoles('admin_hr', 'employee'),
  validateLeaveIdParam,
  leaveController.deleteLeave,
);
router.patch(
  '/:id/approve',
  allowRoles('admin_hr'),
  validateLeaveIdParam,
  leaveController.approveLeave,
);
router.patch(
  '/:id/reject',
  allowRoles('admin_hr'),
  validateLeaveIdParam,
  validateRejectLeave,
  leaveController.rejectLeave,
);

export default router;
