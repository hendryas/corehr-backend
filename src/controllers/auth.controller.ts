import { RequestHandler } from 'express';

import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';

export const login: RequestHandler = async (req, res) => {
  const result = await authService.login(req.body);

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
