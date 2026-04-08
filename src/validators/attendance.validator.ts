import { RequestHandler } from 'express';

import { AttendanceStatus } from '../types/auth';
import { AttendanceListQuery } from '../types/attendance';
import { isValidDateTimeInput } from '../utils/date';
import {
  addError,
  isOneOf,
  isValidDateString,
  normalizeOptionalString,
  parsePositiveInteger,
  sendValidationError,
  ValidationErrors,
} from './helpers';

const attendanceStatuses: AttendanceStatus[] = ['present', 'sick', 'leave', 'absent'];

const buildAttendancePayload = (
  reqBody: Record<string, unknown>,
): {
  errors: ValidationErrors;
  payload?: {
    userId: number;
    attendanceDate: string;
    checkIn: string | null;
    checkOut: string | null;
    status: AttendanceStatus;
    notes: string | null;
  };
} => {
  const errors: ValidationErrors = {};
  const userId = parsePositiveInteger(reqBody.user_id);
  const attendanceDate =
    typeof reqBody.attendance_date === 'string' ? reqBody.attendance_date.trim() : '';
  const checkIn = normalizeOptionalString(reqBody.check_in);
  const checkOut = normalizeOptionalString(reqBody.check_out);
  const status = typeof reqBody.status === 'string' ? reqBody.status.trim() : '';

  if (!userId) {
    addError(errors, 'user_id', 'User id is required and must be a positive integer');
  }

  if (!attendanceDate) {
    addError(errors, 'attendance_date', 'Attendance date is required');
  } else if (!isValidDateString(attendanceDate)) {
    addError(errors, 'attendance_date', 'Attendance date must use YYYY-MM-DD format');
  }

  if (checkIn && !isValidDateTimeInput(checkIn)) {
    addError(errors, 'check_in', 'Check in must be a valid datetime');
  }

  if (checkOut && !isValidDateTimeInput(checkOut)) {
    addError(errors, 'check_out', 'Check out must be a valid datetime');
  }

  if (!status || !isOneOf(status, attendanceStatuses)) {
    addError(errors, 'status', 'Status must be one of present, sick, leave, or absent');
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const normalizedStatus = status as AttendanceStatus;

  return {
    errors,
    payload: {
      userId: Number(userId),
      attendanceDate,
      checkIn,
      checkOut,
      status: normalizedStatus,
      notes: normalizeOptionalString(reqBody.notes),
    },
  };
};

export const validateAttendanceIdParam: RequestHandler = (req, res, next) => {
  const attendanceId = parsePositiveInteger(req.params.id);

  if (!attendanceId) {
    return sendValidationError(res, {
      id: ['Attendance id must be a positive integer'],
    });
  }

  req.params.id = String(attendanceId);

  return next();
};

export const validateAttendanceListQuery: RequestHandler = (req, res, next) => {
  const errors: ValidationErrors = {};
  const userId = req.query.user_id ? parsePositiveInteger(req.query.user_id) : null;
  const attendanceDate =
    typeof req.query.attendance_date === 'string' ? req.query.attendance_date.trim() : null;
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : null;
  const page = req.query.page === undefined ? 1 : parsePositiveInteger(req.query.page);
  const limit = req.query.limit === undefined ? 10 : parsePositiveInteger(req.query.limit);

  if (req.query.user_id !== undefined && !userId) {
    addError(errors, 'user_id', 'User id must be a positive integer');
  }

  if (attendanceDate && !isValidDateString(attendanceDate)) {
    addError(errors, 'attendance_date', 'Attendance date must use YYYY-MM-DD format');
  }

  if (status && !isOneOf(status, attendanceStatuses)) {
    addError(errors, 'status', 'Status must be one of present, sick, leave, or absent');
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

  req.attendanceListQuery = {
    userId,
    attendanceDate,
    status: status as AttendanceStatus | null,
    page: Number(page),
    limit: Number(limit),
  } satisfies AttendanceListQuery;

  return next();
};

export const validateCreateAttendance: RequestHandler = (req, res, next) => {
  const { errors, payload } = buildAttendancePayload(req.body as Record<string, unknown>);

  if (Object.keys(errors).length > 0) {
    return sendValidationError(res, errors);
  }

  req.body = payload;

  return next();
};

export const validateUpdateAttendance = validateCreateAttendance;
