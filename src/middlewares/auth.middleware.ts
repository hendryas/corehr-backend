import { RequestHandler } from 'express';

import { authRepository } from '../repositories/auth.repository';
import { AppError } from '../utils/app-error';
import { verifyAccessToken } from '../utils/jwt';

const getBearerToken = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

export const authenticate: RequestHandler = async (req, _res, next) => {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    return next(new AppError('Missing or invalid Authorization header', 401));
  }

  const payload = verifyAccessToken(token);
  const user = await authRepository.findActiveById(payload.id);

  if (!user) {
    return next(new AppError('User session is no longer valid', 401));
  }

  req.user = user;

  return next();
};
