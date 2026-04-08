import { RequestHandler } from 'express';

import {
  addError,
  normalizeOptionalString,
  parsePositiveInteger,
  sendValidationError,
  ValidationErrors,
} from './helpers';

const validatePositionPayload = (reqBody: Record<string, unknown>): ValidationErrors => {
  const errors: ValidationErrors = {};
  const name = typeof reqBody.name === 'string' ? reqBody.name.trim() : '';
  const departmentId = parsePositiveInteger(reqBody.department_id);

  if (!name) {
    addError(errors, 'name', 'Name is required');
  }

  if (!departmentId) {
    addError(errors, 'department_id', 'Department id is required and must be a positive integer');
  }

  return errors;
};

export const validatePositionIdParam: RequestHandler = (req, res, next) => {
  const positionId = parsePositiveInteger(req.params.id);

  if (!positionId) {
    return sendValidationError(res, {
      id: ['Position id must be a positive integer'],
    });
  }

  req.params.id = String(positionId);

  return next();
};

export const validateCreatePosition: RequestHandler = (req, res, next) => {
  const errors = validatePositionPayload(req.body as Record<string, unknown>);

  if (Object.keys(errors).length > 0) {
    return sendValidationError(res, errors);
  }

  req.body = {
    departmentId: Number(req.body.department_id),
    name: (req.body.name as string).trim(),
    description: normalizeOptionalString(req.body.description),
  };

  return next();
};

export const validateUpdatePosition = validateCreatePosition;
