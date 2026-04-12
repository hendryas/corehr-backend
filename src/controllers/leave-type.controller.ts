import { RequestHandler } from 'express';

import { leaveTypeService } from '../services/leave-type.service';
import { sendSuccess } from '../utils/response';

export const getLeaveTypes: RequestHandler = async (_req, res) => {
  const leaveTypes = await leaveTypeService.getLeaveTypes();

  return sendSuccess(res, {
    message: 'Leave types fetched successfully',
    data: leaveTypes,
  });
};

export const getLeaveTypeById: RequestHandler = async (req, res) => {
  const leaveType = await leaveTypeService.getLeaveTypeById(Number(req.params.id));

  return sendSuccess(res, {
    message: 'Leave type fetched successfully',
    data: leaveType,
  });
};

export const createLeaveType: RequestHandler = async (req, res) => {
  const leaveType = await leaveTypeService.createLeaveType(req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Leave type created successfully',
    data: leaveType,
  });
};

export const updateLeaveType: RequestHandler = async (req, res) => {
  const leaveType = await leaveTypeService.updateLeaveType(Number(req.params.id), req.body);

  return sendSuccess(res, {
    message: 'Leave type updated successfully',
    data: leaveType,
  });
};

export const deleteLeaveType: RequestHandler = async (req, res) => {
  await leaveTypeService.deleteLeaveType(Number(req.params.id));

  return sendSuccess(res, {
    message: 'Leave type deleted successfully',
    data: null,
  });
};
