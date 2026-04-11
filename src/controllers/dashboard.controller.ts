import { RequestHandler } from 'express';

import { dashboardService } from '../services/dashboard.service';
import { sendSuccess } from '../utils/response';

export const getStats: RequestHandler = async (_req, res) => {
  const stats = await dashboardService.getStats();

  return sendSuccess(res, {
    message: 'Dashboard stats fetched successfully',
    data: stats,
  });
};

export const getMyStats: RequestHandler = async (req, res) => {
  const stats = await dashboardService.getEmployeeStats(req.user!);

  return sendSuccess(res, {
    message: 'Employee dashboard stats fetched successfully',
    data: stats,
  });
};
