import { AuthenticatedUser } from './auth';
import { AttendanceListQuery } from './attendance';
import { EmployeeListQuery } from './employee';
import { LeaveListQuery } from './leave';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      employeeListQuery?: EmployeeListQuery;
      attendanceListQuery?: AttendanceListQuery;
      leaveListQuery?: LeaveListQuery;
    }
  }
}

export {};
