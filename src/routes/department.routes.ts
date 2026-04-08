import { Router } from 'express';

import * as departmentController from '../controllers/department.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { allowRoles } from '../middlewares/role.middleware';
import {
  validateCreateDepartment,
  validateDepartmentIdParam,
  validateUpdateDepartment,
} from '../validators/department.validator';

const router = Router();

router.use(authenticate);

router.get('/', allowRoles('admin_hr', 'employee'), departmentController.getDepartments);
router.get(
  '/:id',
  allowRoles('admin_hr', 'employee'),
  validateDepartmentIdParam,
  departmentController.getDepartmentById,
);
router.post(
  '/',
  allowRoles('admin_hr'),
  validateCreateDepartment,
  departmentController.createDepartment,
);
router.put(
  '/:id',
  allowRoles('admin_hr'),
  validateDepartmentIdParam,
  validateUpdateDepartment,
  departmentController.updateDepartment,
);
router.delete(
  '/:id',
  allowRoles('admin_hr'),
  validateDepartmentIdParam,
  departmentController.deleteDepartment,
);

export default router;
