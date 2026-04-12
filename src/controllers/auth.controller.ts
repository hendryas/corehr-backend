import { RequestHandler } from 'express';

import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';

export const login: RequestHandler = async (req, res) => {
  const result = await authService.login(req.body, {
    logger: req.logger,
  });

  return sendSuccess(res, {
    message: 'Login successful',
    data: result,
  });
};

export const me: RequestHandler = async (req, res) => {
  return sendSuccess(res, {
    message: 'Authenticated user fetched successfully',
    data: req.user ?? null,
  });
};

export const logout: RequestHandler = async (req, res) => {
  await authService.logout(req.authSession!.id, req.user!.id, {
    logger: req.logger,
    actorUserId: req.user!.id,
    actorRole: req.user!.role,
  });

  return sendSuccess(res, {
    message: 'Logout successful',
  });
};
