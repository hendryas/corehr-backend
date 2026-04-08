import jwt, { SignOptions } from 'jsonwebtoken';

import { env } from '../config/env';
import { JwtUserPayload } from '../types/auth';

export const signAccessToken = (payload: JwtUserPayload): string => {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  });
};

export const verifyAccessToken = (token: string): JwtUserPayload => {
  return jwt.verify(token, env.jwtSecret) as JwtUserPayload;
};
