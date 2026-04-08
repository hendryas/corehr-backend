import { RequestHandler } from 'express';

import { sendError } from '../utils/response';

type ValidationErrors = Record<string, string[]>;

const addError = (errors: ValidationErrors, field: string, message: string): void => {
  if (!errors[field]) {
    errors[field] = [];
  }

  errors[field].push(message);
};

export const validateLogin: RequestHandler = (req, res, next) => {
  const errors: ValidationErrors = {};
  const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!email) {
    addError(errors, 'email', 'Email is required');
  } else {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      addError(errors, 'email', 'Email must be a valid email address');
    }
  }

  if (!password) {
    addError(errors, 'password', 'Password is required');
  }

  if (Object.keys(errors).length > 0) {
    return sendError(res, {
      statusCode: 422,
      message: 'Validation failed',
      errors,
    });
  }

  req.body.email = email.toLowerCase();

  return next();
};
