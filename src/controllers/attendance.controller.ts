import { RequestHandler } from 'express';

import { attendanceService } from '../services/attendance.service';
import { sendSuccess } from '../utils/response';

export const getAttendances: RequestHandler = async (req, res) => {
  const attendances = await attendanceService.getAttendances(req.user!, req.attendanceListQuery!);

  return sendSuccess(res, {
    message: 'Attendances fetched successfully',
    data: attendances,
  });
};

export const getAttendanceById: RequestHandler = async (req, res) => {
  const attendance = await attendanceService.getAttendanceById(req.user!, Number(req.params.id));

  return sendSuccess(res, {
    message: 'Attendance fetched successfully',
    data: attendance,
  });
};

export const getMyAttendances: RequestHandler = async (req, res) => {
  const attendances = await attendanceService.getMyAttendances(req.user!, req.attendanceListQuery!);

  return sendSuccess(res, {
    message: 'My attendances fetched successfully',
    data: attendances,
  });
};

export const createAttendance: RequestHandler = async (req, res) => {
  const attendance = await attendanceService.createAttendance(req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Attendance created successfully',
    data: attendance,
  });
};

export const updateAttendance: RequestHandler = async (req, res) => {
  const attendance = await attendanceService.updateAttendance(Number(req.params.id), req.body);

  return sendSuccess(res, {
    message: 'Attendance updated successfully',
    data: attendance,
  });
};

export const deleteAttendance: RequestHandler = async (req, res) => {
  await attendanceService.deleteAttendance(Number(req.params.id));

  return sendSuccess(res, {
    message: 'Attendance deleted successfully',
    data: null,
  });
};

export const checkIn: RequestHandler = async (req, res) => {
  const attendance = await attendanceService.checkIn(req.user!);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Check-in successful',
    data: attendance,
  });
};

export const checkOut: RequestHandler = async (req, res) => {
  const attendance = await attendanceService.checkOut(req.user!);

  return sendSuccess(res, {
    message: 'Check-out successful',
    data: attendance,
  });
};
