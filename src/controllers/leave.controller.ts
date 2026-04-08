import { RequestHandler } from 'express';

import { leaveService } from '../services/leave.service';
import { sendSuccess } from '../utils/response';

export const getLeaves: RequestHandler = async (req, res) => {
  const leaves = await leaveService.getLeaves(req.user!, req.leaveListQuery!);

  return sendSuccess(res, {
    message: 'Leave requests fetched successfully',
    data: leaves,
  });
};

export const getLeaveById: RequestHandler = async (req, res) => {
  const leaveRequest = await leaveService.getLeaveById(req.user!, Number(req.params.id));

  return sendSuccess(res, {
    message: 'Leave request fetched successfully',
    data: leaveRequest,
  });
};

export const getMyLeaves: RequestHandler = async (req, res) => {
  const leaves = await leaveService.getMyLeaves(req.user!, req.leaveListQuery!);

  return sendSuccess(res, {
    message: 'My leave requests fetched successfully',
    data: leaves,
  });
};

export const createLeave: RequestHandler = async (req, res) => {
  const leaveRequest = await leaveService.createLeave(req.user!, req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Leave request created successfully',
    data: leaveRequest,
  });
};

export const updateLeave: RequestHandler = async (req, res) => {
  const leaveRequest = await leaveService.updateLeave(req.user!, Number(req.params.id), req.body);

  return sendSuccess(res, {
    message: 'Leave request updated successfully',
    data: leaveRequest,
  });
};

export const deleteLeave: RequestHandler = async (req, res) => {
  await leaveService.deleteLeave(req.user!, Number(req.params.id));

  return sendSuccess(res, {
    message: 'Leave request deleted successfully',
    data: null,
  });
};

export const approveLeave: RequestHandler = async (req, res) => {
  const leaveRequest = await leaveService.approveLeave(req.user!, Number(req.params.id));

  return sendSuccess(res, {
    message: 'Leave request approved successfully',
    data: leaveRequest,
  });
};

export const rejectLeave: RequestHandler = async (req, res) => {
  const leaveRequest = await leaveService.rejectLeave(req.user!, Number(req.params.id), req.body);

  return sendSuccess(res, {
    message: 'Leave request rejected successfully',
    data: leaveRequest,
  });
};
