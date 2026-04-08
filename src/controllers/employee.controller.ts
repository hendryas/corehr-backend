import { RequestHandler } from 'express';

import { employeeService } from '../services/employee.service';
import { buildCsv, sendCsvDownload } from '../utils/csv';
import { sendSuccess } from '../utils/response';

export const getEmployees: RequestHandler = async (req, res) => {
  const employees = await employeeService.getEmployees(req.employeeListQuery!);

  return sendSuccess(res, {
    message: 'Employees fetched successfully',
    data: employees,
  });
};

export const exportEmployeesCsv: RequestHandler = async (req, res) => {
  const employees = await employeeService.exportEmployees(req.employeeListQuery!);
  const csv = buildCsv(employees, [
    { header: 'id', accessor: (employee) => employee.id },
    { header: 'employee_code', accessor: (employee) => employee.employeeCode },
    { header: 'full_name', accessor: (employee) => employee.fullName },
    { header: 'email', accessor: (employee) => employee.email },
    { header: 'phone', accessor: (employee) => employee.phone },
    { header: 'gender', accessor: (employee) => employee.gender },
    { header: 'address', accessor: (employee) => employee.address },
    { header: 'hire_date', accessor: (employee) => employee.hireDate },
    { header: 'is_active', accessor: (employee) => employee.isActive },
    { header: 'role', accessor: (employee) => employee.role },
    { header: 'department_id', accessor: (employee) => employee.departmentId },
    { header: 'department_name', accessor: (employee) => employee.departmentName },
    { header: 'position_id', accessor: (employee) => employee.positionId },
    { header: 'position_name', accessor: (employee) => employee.positionName },
    { header: 'created_at', accessor: (employee) => employee.createdAt },
    { header: 'updated_at', accessor: (employee) => employee.updatedAt },
  ]);

  return sendCsvDownload(res, 'employees.csv', csv);
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
