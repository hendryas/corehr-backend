import { RequestHandler } from 'express';

import {
  addError,
  normalizeOptionalString,
  parsePositiveInteger,
  sendValidationError,
  ValidationErrors,
} from './helpers';

const validateDepartmentPayload = (reqBody: Record<string, unknown>): ValidationErrors => {
  const errors: ValidationErrors = {};
  const name = typeof reqBody.name === 'string' ? reqBody.name.trim() : '';

  if (!name) {
    addError(errors, 'name', 'Name is required');
  }

  return errors;
};

export const validateDepartmentIdParam: RequestHandler = (req, res, next) => {
  const departmentId = parsePositiveInteger(req.params.id);

  if (!departmentId) {
    return sendValidationError(res, {
      id: ['Department id must be a positive integer'],
    });
  }

  req.params.id = String(departmentId);

  return next();
};

export const validateCreateDepartment: RequestHandler = (req, res, next) => {
  const errors = validateDepartmentPayload(req.body as Record<string, unknown>);

  if (Object.keys(errors).length > 0) {
    return sendValidationError(res, errors);
  }

  req.body = {
    name: (req.body.name as string).trim(),
    description: normalizeOptionalString(req.body.description),
  };

  return next();
};

export const validateUpdateDepartment = validateCreateDepartment;
