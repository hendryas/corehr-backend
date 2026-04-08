import { RequestHandler } from 'express';

import { departmentService } from '../services/department.service';
import { sendSuccess } from '../utils/response';

export const getDepartments: RequestHandler = async (_req, res) => {
  const departments = await departmentService.getDepartments();

  return sendSuccess(res, {
    message: 'Departments fetched successfully',
    data: departments,
  });
};

export const getDepartmentById: RequestHandler = async (req, res) => {
  const department = await departmentService.getDepartmentById(Number(req.params.id));

  return sendSuccess(res, {
    message: 'Department fetched successfully',
    data: department,
  });
};

export const createDepartment: RequestHandler = async (req, res) => {
  const department = await departmentService.createDepartment(req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Department created successfully',
    data: department,
  });
};

export const updateDepartment: RequestHandler = async (req, res) => {
  const department = await departmentService.updateDepartment(Number(req.params.id), req.body);

  return sendSuccess(res, {
    message: 'Department updated successfully',
    data: department,
  });
};

export const deleteDepartment: RequestHandler = async (req, res) => {
  await departmentService.deleteDepartment(Number(req.params.id));

  return sendSuccess(res, {
    message: 'Department deleted successfully',
    data: null,
  });
};
