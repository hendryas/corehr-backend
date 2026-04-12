import { Logger } from 'pino';

import { ActiveRequestSession, AuthenticatedUser } from './auth';
import { AttendanceListQuery } from './attendance';
import { EmployeeListQuery } from './employee';
import { LeaveListQuery } from './leave';
import { NotificationListQuery } from './notification';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      logger?: Logger;
      user?: AuthenticatedUser;
      authSession?: ActiveRequestSession;
      employeeListQuery?: EmployeeListQuery;
      attendanceListQuery?: AttendanceListQuery;
      leaveListQuery?: LeaveListQuery;
      notificationListQuery?: NotificationListQuery;
    }
  }
}

export {};
