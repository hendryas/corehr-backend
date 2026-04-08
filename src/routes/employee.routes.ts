import { Router } from 'express';

import * as employeeController from '../controllers/employee.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { allowRoles } from '../middlewares/role.middleware';
import {
  validateCreateEmployee,
  validateEmployeeIdParam,
  validateEmployeeListQuery,
  validateUpdateEmployee,
} from '../validators/employee.validator';

const router = Router();

router.use(authenticate);

router.get(
  '/me/profile',
  allowRoles('employee'),
  employeeController.getMyProfile,
);
router.get(
  '/export/csv',
  allowRoles('admin_hr'),
  validateEmployeeListQuery,
  employeeController.exportEmployeesCsv,
);
router.get(
  '/',
  allowRoles('admin_hr'),
  validateEmployeeListQuery,
  employeeController.getEmployees,
);
router.get(
  '/:id',
  allowRoles('admin_hr'),
  validateEmployeeIdParam,
  employeeController.getEmployeeById,
);
router.post(
  '/',
  allowRoles('admin_hr'),
  validateCreateEmployee,
  employeeController.createEmployee,
);
router.put(
  '/:id',
  allowRoles('admin_hr'),
  validateEmployeeIdParam,
  validateUpdateEmployee,
  employeeController.updateEmployee,
);
router.delete(
  '/:id',
  allowRoles('admin_hr'),
  validateEmployeeIdParam,
  employeeController.deleteEmployee,
);

export default router;
