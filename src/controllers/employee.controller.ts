import { RequestHandler } from 'express';

import { employeeService } from '../services/employee.service';
import { sendSuccess } from '../utils/response';

export const getEmployees: RequestHandler = async (req, res) => {
  const employees = await employeeService.getEmployees(req.employeeListQuery!);

  return sendSuccess(res, {
    message: 'Employees fetched successfully',
    data: employees,
  });
};

export const getEmployeeById: RequestHandler = async (req, res) => {
  const employee = await employeeService.getEmployeeById(Number(req.params.id));

  return sendSuccess(res, {
    message: 'Employee fetched successfully',
    data: employee,
  });
};

export const getMyProfile: RequestHandler = async (req, res) => {
  const employee = await employeeService.getMyProfile(req.user!.id);

  return sendSuccess(res, {
    message: 'Employee profile fetched successfully',
    data: employee,
  });
};

export const createEmployee: RequestHandler = async (req, res) => {
  const employee = await employeeService.createEmployee(req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Employee created successfully',
    data: employee,
  });
};

export const updateEmployee: RequestHandler = async (req, res) => {
  const employee = await employeeService.updateEmployee(Number(req.params.id), req.body);

  return sendSuccess(res, {
    message: 'Employee updated successfully',
    data: employee,
  });
};

export const deleteEmployee: RequestHandler = async (req, res) => {
  await employeeService.deleteEmployee(Number(req.params.id));

  return sendSuccess(res, {
    message: 'Employee deleted successfully',
    data: null,
  });
};
