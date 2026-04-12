import { Router } from 'express';

import * as leaveTypeController from '../controllers/leave-type.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { allowRoles } from '../middlewares/role.middleware';
import {
  validateCreateLeaveType,
  validateLeaveTypeIdParam,
  validateUpdateLeaveType,
} from '../validators/leave-type.validator';

const router = Router();

router.use(authenticate);

router.get('/', allowRoles('admin_hr', 'employee'), leaveTypeController.getLeaveTypes);
router.get(
  '/:id',
  allowRoles('admin_hr', 'employee'),
  validateLeaveTypeIdParam,
  leaveTypeController.getLeaveTypeById,
);
router.post('/', allowRoles('admin_hr'), validateCreateLeaveType, leaveTypeController.createLeaveType);
router.put(
  '/:id',
  allowRoles('admin_hr'),
  validateLeaveTypeIdParam,
  validateUpdateLeaveType,
  leaveTypeController.updateLeaveType,
);
router.delete(
  '/:id',
  allowRoles('admin_hr'),
  validateLeaveTypeIdParam,
  leaveTypeController.deleteLeaveType,
);

export default router;
