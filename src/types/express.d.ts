import { AuthenticatedUser } from './auth';
import { EmployeeListQuery } from './employee';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      employeeListQuery?: EmployeeListQuery;
    }
  }
}

export {};
