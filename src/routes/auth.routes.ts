import { Router } from 'express';

import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateLogin } from '../validators/auth.validator';

const router = Router();

router.post('/login', validateLogin, authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
