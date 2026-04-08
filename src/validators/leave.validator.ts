import { RequestHandler } from 'express';

import { LeaveRequestStatus } from '../types/auth';
import { LeaveListQuery } from '../types/leave';
import {
  addError,
  isOneOf,
  isValidDateString,
  normalizeOptionalString,
  parsePositiveInteger,
  sendValidationError,
  ValidationErrors,
} from './helpers';

const leaveStatuses: LeaveRequestStatus[] = ['pending', 'approved', 'rejected'];

const buildLeavePayload = (
  reqBody: Record<string, unknown>,
): {
  errors: ValidationErrors;
  payload?: {
    userId?: number;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
  };
} => {
  const errors: ValidationErrors = {};
  const userId = reqBody.user_id === undefined ? null : parsePositiveInteger(reqBody.user_id);
  const leaveType = typeof reqBody.leave_type === 'string' ? reqBody.leave_type.trim() : '';
  const startDate = typeof reqBody.start_date === 'string' ? reqBody.start_date.trim() : '';
  const endDate = typeof reqBody.end_date === 'string' ? reqBody.end_date.trim() : '';
  const reason = typeof reqBody.reason === 'string' ? reqBody.reason.trim() : '';

  if (reqBody.user_id !== undefined && !userId) {
    addError(errors, 'user_id', 'User id must be a positive integer');
  }

  if (!leaveType) {
    addError(errors, 'leave_type', 'Leave type is required');
  }

  if (!startDate) {
    addError(errors, 'start_date', 'Start date is required');
  } else if (!isValidDateString(startDate)) {
    addError(errors, 'start_date', 'Start date must use YYYY-MM-DD format');
  }

  if (!endDate) {
    addError(errors, 'end_date', 'End date is required');
  } else if (!isValidDateString(endDate)) {
    addError(errors, 'end_date', 'End date must use YYYY-MM-DD format');
  }

  if (startDate && endDate && isValidDateString(startDate) && isValidDateString(endDate) && startDate > endDate) {
    addError(errors, 'date_range', 'Start date must be earlier than or equal to end date');
  }

  if (!reason) {
    addError(errors, 'reason', 'Reason is required');
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    errors,
    payload: {
      ...(userId ? { userId } : {}),
      leaveType,
      startDate,
      endDate,
      reason,
    },
  };
};

export const validateLeaveIdParam: RequestHandler = (req, res, next) => {
  const leaveId = parsePositiveInteger(req.params.id);

  if (!leaveId) {
    return sendValidationError(res, {
      id: ['Leave request id must be a positive integer'],
    });
  }

  req.params.id = String(leaveId);

  return next();
};

export const validateLeaveListQuery: RequestHandler = (req, res, next) => {
  const errors: ValidationErrors = {};
  const userId = req.query.user_id ? parsePositiveInteger(req.query.user_id) : null;
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : null;
  const leaveType = normalizeOptionalString(req.query.leave_type);
  const startDate = typeof req.query.start_date === 'string' ? req.query.start_date.trim() : null;
  const endDate = typeof req.query.end_date === 'string' ? req.query.end_date.trim() : null;
  const page = req.query.page === undefined ? 1 : parsePositiveInteger(req.query.page);
  const limit = req.query.limit === undefined ? 10 : parsePositiveInteger(req.query.limit);

  if (req.query.user_id !== undefined && !userId) {
    addError(errors, 'user_id', 'User id must be a positive integer');
  }

  if (status && !isOneOf(status, leaveStatuses)) {
    addError(errors, 'status', 'Status must be one of pending, approved, or rejected');
  }

  if (startDate && !isValidDateString(startDate)) {
    addError(errors, 'start_date', 'Start date must use YYYY-MM-DD format');
  }

  if (endDate && !isValidDateString(endDate)) {
    addError(errors, 'end_date', 'End date must use YYYY-MM-DD format');
  }

  if (startDate && endDate && isValidDateString(startDate) && isValidDateString(endDate) && startDate > endDate) {
    addError(errors, 'date_range', 'Start date must be earlier than or equal to end date');
  }

  if (!page) {
    addError(errors, 'page', 'Page must be a positive integer');
  }

  if (!limit) {
    addError(errors, 'limit', 'Limit must be a positive integer');
  } else if (limit > 100) {
    addError(errors, 'limit', 'Limit must not exceed 100');
  }

  if (Object.keys(errors).length > 0) {
    return sendValidationError(res, errors);
  }

  req.leaveListQuery = {
    userId,
    status: status as LeaveRequestStatus | null,
    leaveType,
    startDate,
    endDate,
    page: Number(page),
    limit: Number(limit),
  } satisfies LeaveListQuery;

  return next();
};

export const validateCreateLeave: RequestHandler = (req, res, next) => {
  const { errors, payload } = buildLeavePayload(req.body as Record<string, unknown>);

  if (Object.keys(errors).length > 0) {
    return sendValidationError(res, errors);
  }

  req.body = payload;

  return next();
};

export const validateUpdateLeave = validateCreateLeave;

export const validateRejectLeave: RequestHandler = (req, res, next) => {
  const rejectionReason =
    typeof req.body.rejection_reason === 'string' ? req.body.rejection_reason.trim() : '';

  if (!rejectionReason) {
    return sendValidationError(res, {
      rejection_reason: ['Rejection reason is required'],
    });
  }

  req.body = {
    rejectionReason,
  };

  return next();
};
