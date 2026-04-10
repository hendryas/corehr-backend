import { Logger } from 'pino';

import { AuthenticatedUser } from './auth';
import { AttendanceListQuery } from './attendance';
import { EmployeeListQuery } from './employee';
import { LeaveListQuery } from './leave';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      logger?: Logger;
      user?: AuthenticatedUser;
      employeeListQuery?: EmployeeListQuery;
      attendanceListQuery?: AttendanceListQuery;
      leaveListQuery?: LeaveListQuery;
    }
  }
}

export {};
