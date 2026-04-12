import bcrypt from 'bcryptjs';

import { authRepository } from '../repositories/auth.repository';
import { sessionService } from './session.service';
import { LoginRequestBody } from '../types/auth';
import { AppError } from '../utils/app-error';
import { AuditLogContext, logAuditEvent } from '../utils/logger';
import { signAccessToken } from '../utils/jwt';

export const authService = {
  async login(payload: LoginRequestBody, auditContext?: AuditLogContext) {
    const user = await authRepository.findByEmail(payload.email);

    if (!user) {
      logAuditEvent(
        auditContext,
        'auth.login_failed',
        {
          module: 'auth',
          email: payload.email,
          reason: 'user_not_found',
        },
        'Login failed',
      );
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      logAuditEvent(
        auditContext,
        'auth.login_failed',
        {
          module: 'auth',
          email: payload.email,
          targetUserId: user.id,
          reason: 'inactive_user',
        },
        'Login failed',
      );
      throw new AppError('Your account is inactive. Please contact administrator', 403);
    }

    const isPasswordValid = await bcrypt.compare(payload.password, user.password);

    if (!isPasswordValid) {
      logAuditEvent(
        auditContext,
        'auth.login_failed',
        {
          module: 'auth',
          email: payload.email,
          targetUserId: user.id,
          reason: 'invalid_password',
        },
        'Login failed',
      );
      throw new AppError('Invalid email or password', 401);
    }

    const session = await sessionService.createSession(user.id);
    const accessToken = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    });

    const { password: _password, ...safeUser } = user;

    logAuditEvent(
      {
        ...auditContext,
        actorUserId: user.id,
        actorRole: user.role,
      },
      'auth.login_success',
      {
        module: 'auth',
        targetUserId: user.id,
        email: user.email,
      },
      'Login successful',
    );

    return {
      accessToken,
      user: safeUser,
    };
  },

  async logout(sessionId: string, userId: number, auditContext?: AuditLogContext) {
    await sessionService.logout(sessionId);

    logAuditEvent(
      {
        ...auditContext,
        actorUserId: userId,
      },
      'auth.logout_success',
      {
        module: 'auth',
        targetUserId: userId,
      },
      'Logout successful',
    );
  },
};
