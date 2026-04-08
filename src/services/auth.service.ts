import bcrypt from 'bcryptjs';

import { authRepository } from '../repositories/auth.repository';
import { LoginRequestBody } from '../types/auth';
import { AppError } from '../utils/app-error';
import { signAccessToken } from '../utils/jwt';

export const authService = {
  async login(payload: LoginRequestBody) {
    const user = await authRepository.findByEmail(payload.email);

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account is inactive. Please contact administrator', 403);
    }

    const isPasswordValid = await bcrypt.compare(payload.password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const accessToken = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const { password: _password, ...safeUser } = user;

    return {
      accessToken,
      user: safeUser,
    };
  },
};
