import { Router } from 'express';

import authRoutes from './auth.routes';
import departmentRoutes from './department.routes';
import employeeRoutes from './employee.routes';
import positionRoutes from './position.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/departments', departmentRoutes);
router.use('/positions', positionRoutes);
router.use('/employees', employeeRoutes);

export default router;
