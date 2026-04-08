import { Router } from 'express';

import * as positionController from '../controllers/position.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { allowRoles } from '../middlewares/role.middleware';
import {
  validateCreatePosition,
  validatePositionIdParam,
  validateUpdatePosition,
} from '../validators/position.validator';

const router = Router();

router.use(authenticate);

router.get('/', allowRoles('admin_hr', 'employee'), positionController.getPositions);
router.get(
  '/:id',
  allowRoles('admin_hr', 'employee'),
  validatePositionIdParam,
  positionController.getPositionById,
);
router.post('/', allowRoles('admin_hr'), validateCreatePosition, positionController.createPosition);
router.put(
  '/:id',
  allowRoles('admin_hr'),
  validatePositionIdParam,
  validateUpdatePosition,
  positionController.updatePosition,
);
router.delete(
  '/:id',
  allowRoles('admin_hr'),
  validatePositionIdParam,
  positionController.deletePosition,
);

export default router;
