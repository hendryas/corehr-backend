import { RequestHandler } from 'express';

import { UserRole } from '../types/auth';
import { EmployeeCreatePayload, EmployeeListQuery, EmployeeUpdatePayload } from '../types/employee';
import {
  addError,
  isValidDateString,
  normalizeOptionalString,
  parseBooleanInput,
  parsePositiveInteger,
  sendValidationError,
  ValidationErrors,
} from './helpers';

const validRoles: UserRole[] = ['admin_hr', 'employee'];

const normalizeEmail = (value: unknown): string => {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
};

const validateEmail = (email: string): boolean => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailPattern.test(email);
};

const buildEmployeePayload = (
  reqBody: Record<string, unknown>,
  isCreate: boolean,
): { errors: ValidationErrors; payload?: EmployeeCreatePayload | EmployeeUpdatePayload } => {
  const errors: ValidationErrors = {};
  const employeeCode = typeof reqBody.employee_code === 'string' ? reqBody.employee_code.trim() : '';
  const fullName = typeof reqBody.full_name === 'string' ? reqBody.full_name.trim() : '';
  const email = normalizeEmail(reqBody.email);
  const password =
    typeof reqBody.password === 'string'
      ? reqBody.password.trim()
      : reqBody.password === undefined || reqBody.password === null
        ? ''
        : String(reqBody.password);
  const role = typeof reqBody.role === 'string' ? (reqBody.role.trim() as UserRole) : '';
  const departmentId = parsePositiveInteger(reqBody.department_id);
  const positionId = parsePositiveInteger(reqBody.position_id);
  const hireDate = normalizeOptionalString(reqBody.hire_date);
  const isActiveRaw = reqBody.is_active ?? true;
  const isActive = parseBooleanInput(isActiveRaw);

  if (!employeeCode) {
    addError(errors, 'employee_code', 'Employee code is required');
  }

  if (!fullName) {
    addError(errors, 'full_name', 'Full name is required');
  }

  if (!email) {
    addError(errors, 'email', 'Email is required');
  } else if (!validateEmail(email)) {
    addError(errors, 'email', 'Email must be a valid email address');
  }

  if (isCreate && !password) {
    addError(errors, 'password', 'Password is required');
  }

  if (!role || !validRoles.includes(role)) {
    addError(errors, 'role', 'Role must be either admin_hr or employee');
  }

  if (!departmentId) {
    addError(errors, 'department_id', 'Department id is required and must be a positive integer');
  }

  if (!positionId) {
    addError(errors, 'position_id', 'Position id is required and must be a positive integer');
  }

  if (hireDate && !isValidDateString(hireDate)) {
    addError(errors, 'hire_date', 'Hire date must use YYYY-MM-DD format');
  }

  if (isActive === null) {
    addError(errors, 'is_active', 'Is active must be a boolean, 1, or 0');
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const normalizedRole = role as UserRole;

  const payload: EmployeeCreatePayload | EmployeeUpdatePayload = {
    employeeCode,
    fullName,
    email,
    phone: normalizeOptionalString(reqBody.phone),
    gender: normalizeOptionalString(reqBody.gender),
    address: normalizeOptionalString(reqBody.address),
    hireDate,
    isActive: Boolean(isActive),
    role: normalizedRole,
    departmentId: Number(departmentId),
    positionId: Number(positionId),
  };

  if (isCreate) {
    return {
      errors,
      payload: {
        ...payload,
        password,
      } as EmployeeCreatePayload,
    };
  }

  return {
    errors,
    payload: {
      ...payload,
      ...(password ? { password } : {}),
    } as EmployeeUpdatePayload,
  };
};

export const validateEmployeeIdParam: RequestHandler = (req, res, next) => {
  const employeeId = parsePositiveInteger(req.params.id);

  if (!employeeId) {
    return sendValidationError(res, {
      id: ['Employee id must be a positive integer'],
    });
  }

  req.params.id = String(employeeId);

  return next();
};

export const validateEmployeeListQuery: RequestHandler = (req, res, next) => {
  const errors: ValidationErrors = {};
  const departmentId = req.query.department_id
    ? parsePositiveInteger(req.query.department_id)
    : null;
  const positionId = req.query.position_id ? parsePositiveInteger(req.query.position_id) : null;
  const isActive = req.query.is_active === undefined ? null : parseBooleanInput(req.query.is_active);
  const page = req.query.page === undefined ? 1 : parsePositiveInteger(req.query.page);
  const limit = req.query.limit === undefined ? 10 : parsePositiveInteger(req.query.limit);
  const search = normalizeOptionalString(req.query.search);

  if (req.query.department_id !== undefined && !departmentId) {
    addError(errors, 'department_id', 'Department id must be a positive integer');
  }

  if (req.query.position_id !== undefined && !positionId) {
    addError(errors, 'position_id', 'Position id must be a positive integer');
  }

  if (req.query.is_active !== undefined && isActive === null) {
    addError(errors, 'is_active', 'Is active must be a boolean, 1, or 0');
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

  req.employeeListQuery = {
    search,
    departmentId,
    positionId,
    isActive,
    page: Number(page),
    limit: Number(limit),
  } satisfies EmployeeListQuery;

  return next();
};

export const validateCreateEmployee: RequestHandler = (req, res, next) => {
  const { errors, payload } = buildEmployeePayload(req.body as Record<string, unknown>, true);

  if (Object.keys(errors).length > 0) {
    return sendValidationError(res, errors);
  }

  req.body = payload;

  return next();
};

export const validateUpdateEmployee: RequestHandler = (req, res, next) => {
  const { errors, payload } = buildEmployeePayload(req.body as Record<string, unknown>, false);

  if (Object.keys(errors).length > 0) {
    return sendValidationError(res, errors);
  }

  req.body = payload;

  return next();
};
