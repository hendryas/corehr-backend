import { Router } from 'express';

import authRoutes from './auth.routes';
import attendanceRoutes from './attendance.routes';
import dashboardRoutes from './dashboard.routes';
import departmentRoutes from './department.routes';
import employeeRoutes from './employee.routes';
import leaveRoutes from './leave.routes';
import positionRoutes from './position.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/attendances', attendanceRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/departments', departmentRoutes);
router.use('/positions', positionRoutes);
router.use('/employees', employeeRoutes);
router.use('/leaves', leaveRoutes);

export default router;
