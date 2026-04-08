import { Router } from 'express';

import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { allowRoles } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);
router.get('/stats', allowRoles('admin_hr'), dashboardController.getStats);

export default router;
