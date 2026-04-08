import { RequestHandler } from 'express';

import { UserRole } from '../types/auth';
import { AppError } from '../utils/app-error';

export const allowRoles = (...roles: UserRole[]): RequestHandler => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to access this resource', 403));
    }

    return next();
  };
};
