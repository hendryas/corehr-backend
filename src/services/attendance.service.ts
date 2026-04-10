import { AttendanceStatus, AuthenticatedUser } from '../types/auth';
import { AttendanceCreatePayload, AttendanceListQuery, AttendanceUpdatePayload } from '../types/attendance';
import { AppError } from '../utils/app-error';
import { formatDateForMysql, formatDateTimeForMysql } from '../utils/date';
import {
  isDuplicateEntryError,
  isForeignKeyConstraintError,
} from '../utils/mysql-error';
import { attendanceRepository } from '../repositories/attendance.repository';
import { employeeRepository } from '../repositories/employee.repository';

const attendanceStatuses: AttendanceStatus[] = ['present', 'sick', 'leave', 'absent'];

const toComparableDate = (value: string): Date => {
  return new Date(value.replace(' ', 'T'));
};

const ensureUserExists = async (userId: number): Promise<void> => {
  const user = await employeeRepository.findById(userId);

  if (!user) {
    throw new AppError('Employee not found', 404);
  }
};

const ensureCheckOutAfterCheckIn = (checkIn: string | null, checkOut: string | null): void => {
  if (!checkIn || !checkOut) {
    return;
  }

  if (toComparableDate(checkOut) < toComparableDate(checkIn)) {
    throw new AppError('Check-out cannot be earlier than check-in', 422);
  }
};

const ensureAttendanceAccessible = (authUser: AuthenticatedUser, ownerUserId: number): void => {
  if (authUser.role === 'employee' && authUser.id !== ownerUserId) {
    throw new AppError('You do not have permission to access this attendance', 403);
  }
};

export const attendanceService = {
  async getAttendances(authUser: AuthenticatedUser, query: AttendanceListQuery) {
    const scopedQuery: AttendanceListQuery = {
      ...query,
      userId: authUser.role === 'employee' ? authUser.id : query.userId,
    };

    const result = await attendanceRepository.findAll(scopedQuery);

    return {
      items: result.items,
      pagination: {
        page: scopedQuery.page,
        limit: scopedQuery.limit,
        total: result.total,
        totalPages: result.total === 0 ? 0 : Math.ceil(result.total / scopedQuery.limit),
      },
    };
  },

  async exportAttendances(query: AttendanceListQuery) {
    return attendanceRepository.findAllForExport(query);
  },

  async getAttendanceById(authUser: AuthenticatedUser, id: number) {
    const attendance = await attendanceRepository.findById(id);

    if (!attendance) {
      throw new AppError('Attendance not found', 404);
    }

    ensureAttendanceAccessible(authUser, attendance.userId);

    return attendance;
  },

  async getMyAttendances(authUser: AuthenticatedUser, query: AttendanceListQuery) {
    return this.getAttendances(authUser, {
      ...query,
      userId: authUser.id,
    });
  },

  async createAttendance(payload: AttendanceCreatePayload) {
    await ensureUserExists(payload.userId);
    ensureCheckOutAfterCheckIn(payload.checkIn, payload.checkOut);

    try {
      const attendanceId = await attendanceRepository.create(payload);

      return this.getAttendanceById(
        {
          id: payload.userId,
          email: '',
          role: 'admin_hr',
          employeeCode: '',
          fullName: '',
          phone: null,
          gender: null,
          address: null,
          hireDate: null,
          isActive: true,
          departmentId: null,
          departmentName: null,
          positionId: null,
          positionName: null,
        },
        attendanceId,
      );
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new AppError('Attendance for this employee and date already exists', 409);
      }

      if (isForeignKeyConstraintError(error)) {
        throw new AppError('Employee not found', 404);
      }

      throw error;
    }
  },

  async updateAttendance(id: number, payload: AttendanceUpdatePayload) {
    await this.getAttendanceById(
      {
        id: payload.userId,
        email: '',
        role: 'admin_hr',
        employeeCode: '',
        fullName: '',
        phone: null,
        gender: null,
        address: null,
        hireDate: null,
        isActive: true,
        departmentId: null,
        departmentName: null,
        positionId: null,
        positionName: null,
      },
      id,
    );
    await ensureUserExists(payload.userId);
    ensureCheckOutAfterCheckIn(payload.checkIn, payload.checkOut);

    try {
      await attendanceRepository.update(id, payload);
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new AppError('Attendance for this employee and date already exists', 409);
      }

      if (isForeignKeyConstraintError(error)) {
        throw new AppError('Employee not found', 404);
      }

      throw error;
    }

    return this.getAttendanceById(
      {
        id: payload.userId,
        email: '',
        role: 'admin_hr',
        employeeCode: '',
        fullName: '',
        phone: null,
        gender: null,
        address: null,
        hireDate: null,
        isActive: true,
        departmentId: null,
        departmentName: null,
        positionId: null,
        positionName: null,
      },
      id,
    );
  },

  async deleteAttendance(id: number) {
    const attendance = await attendanceRepository.findById(id);

    if (!attendance) {
      throw new AppError('Attendance not found', 404);
    }

    await attendanceRepository.softDelete(id);
  },

  async checkIn(authUser: AuthenticatedUser) {
    const now = new Date();
    const attendanceDate = formatDateForMysql(now);
    const existingAttendance = await attendanceRepository.findByUserIdAndDate(authUser.id, attendanceDate);

    if (existingAttendance) {
      if (existingAttendance.checkIn) {
        throw new AppError('You have already checked in today', 409);
      }

      throw new AppError('Attendance record for today already exists', 409);
    }

    const attendanceId = await attendanceRepository.create({
      userId: authUser.id,
      attendanceDate,
      checkIn: formatDateTimeForMysql(now),
      checkOut: null,
      status: attendanceStatuses[0],
      notes: null,
    });

    return this.getAttendanceById(authUser, attendanceId);
  },

  async checkOut(authUser: AuthenticatedUser) {
    const now = new Date();
    const attendanceDate = formatDateForMysql(now);
    const attendance = await attendanceRepository.findByUserIdAndDate(authUser.id, attendanceDate);

    if (!attendance) {
      throw new AppError('No attendance record found for today', 404);
    }

    if (!attendance.checkIn) {
      throw new AppError('Cannot check out before check in', 422);
    }

    if (attendance.checkOut) {
      throw new AppError('You have already checked out today', 409);
    }

    const checkOut = formatDateTimeForMysql(now);

    if (toComparableDate(checkOut) < toComparableDate(attendance.checkIn)) {
      throw new AppError('Check-out cannot be earlier than check-in', 422);
    }

    await attendanceRepository.updateCheckOut(attendance.id, checkOut);

    return this.getAttendanceById(authUser, attendance.id);
  },
};
