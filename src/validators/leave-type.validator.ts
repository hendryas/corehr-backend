import { RequestHandler } from 'express';

import {
  addError,
  normalizeOptionalString,
  parsePositiveInteger,
  sendValidationError,
  ValidationErrors,
} from './helpers';

const leaveTypeCodePattern = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

const validateLeaveTypePayload = (reqBody: Record<string, unknown>): ValidationErrors => {
  const errors: ValidationErrors = {};
  const code = typeof reqBody.code === 'string' ? reqBody.code.trim() : '';
  const name = typeof reqBody.name === 'string' ? reqBody.name.trim() : '';

  if (!code) {
    addError(errors, 'code', 'Code is required');
  } else if (!leaveTypeCodePattern.test(code)) {
    addError(errors, 'code', 'Code must use lowercase letters, numbers, and underscores only');
  }

  if (!name) {
    addError(errors, 'name', 'Name is required');
  }

  return errors;
};

export const validateLeaveTypeIdParam: RequestHandler = (req, res, next) => {
  const leaveTypeId = parsePositiveInteger(req.params.id);

  if (!leaveTypeId) {
    return sendValidationError(res, {
      id: ['Leave type id must be a positive integer'],
    });
  }

  req.params.id = String(leaveTypeId);

  return next();
};

export const validateCreateLeaveType: RequestHandler = (req, res, next) => {
  const errors = validateLeaveTypePayload(req.body as Record<string, unknown>);

  if (Object.keys(errors).length > 0) {
    return sendValidationError(res, errors);
  }

  req.body = {
    code: (req.body.code as string).trim().toLowerCase(),
    name: (req.body.name as string).trim(),
    description: normalizeOptionalString(req.body.description),
  };

  return next();
};

export const validateUpdateLeaveType = validateCreateLeaveType;
