import assert from 'node:assert/strict';
import test from 'node:test';

const createAuthUser = (role: 'admin_hr' | 'employee' = 'employee') => ({
  id: role === 'admin_hr' ? 99 : 7,
  employeeCode: role === 'admin_hr' ? 'ADM-099' : 'EMP-007',
  fullName: role === 'admin_hr' ? 'Maya HR' : 'Budi',
  email: role === 'admin_hr' ? 'maya@corehr.local' : 'budi@corehr.local',
  phone: null,
  gender: null,
  address: null,
  hireDate: '2025-01-01',
  isActive: true,
  role,
  departmentId: null,
  departmentName: null,
  positionId: null,
  positionName: null,
});

const createLeaveEntity = (status: 'pending' | 'approved' | 'rejected' = 'pending') => ({
  id: 11,
  userId: 7,
  employeeCode: 'EMP-007',
  fullName: 'Budi',
  leaveTypeId: 1,
  leaveTypeCode: 'annual_leave',
  leaveTypeName: 'Annual Leave',
  startDate: '2026-04-20',
  endDate: '2026-04-22',
  reason: 'Liburan keluarga',
  status,
  approvedBy: status === 'pending' ? null : 99,
  approverName: status === 'pending' ? null : 'Maya HR',
  approvedAt: status === 'pending' ? null : '2026-04-12 10:00:00',
  rejectionReason: status === 'rejected' ? 'Kuota tim tidak mencukupi' : null,
  createdAt: '2026-04-12 09:00:00',
  updatedAt: '2026-04-12 10:00:00',
});

test('createLeave triggers leave submitted notifications after the request is created', async () => {
  const { createLeaveService } = await import('../services/leave.service.js');
  let createdUserId: number | null = null;
  const notifiedLeaves: number[] = [];

  const service = createLeaveService({
    leaveRepository: {
      async findAll() {
        throw new Error('Not implemented');
      },
      async findAllForExport() {
        throw new Error('Not implemented');
      },
      async findById() {
        return createLeaveEntity();
      },
      async create(payload) {
        createdUserId = payload.userId;
        return 11;
      },
      async update() {
        throw new Error('Not implemented');
      },
      async softDelete() {
        throw new Error('Not implemented');
      },
      async approve() {
        throw new Error('Not implemented');
      },
      async reject() {
        throw new Error('Not implemented');
      },
    },
    employeeRepository: {
      async findById() {
        return {
          ...createAuthUser('employee'),
          createdAt: '2025-01-01 00:00:00',
          updatedAt: '2025-01-01 00:00:00',
        };
      },
    },
    leaveTypeRepository: {
      async findById() {
        return {
          id: 1,
          code: 'annual_leave',
          name: 'Annual Leave',
          description: null,
          createdAt: '2025-01-01 00:00:00',
          updatedAt: '2025-01-01 00:00:00',
        };
      },
    },
    notificationService: {
      async notifyLeaveSubmitted(_actor, leave) {
        notifiedLeaves.push(leave.id);
      },
      async notifyLeaveApproved() {
        throw new Error('Not implemented');
      },
      async notifyLeaveRejected() {
        throw new Error('Not implemented');
      },
    },
    now: () => new Date('2026-04-12T10:00:00.000Z'),
  });

  const result = await service.createLeave(createAuthUser('employee'), {
    leaveTypeId: 1,
    startDate: '2026-04-20',
    endDate: '2026-04-22',
    reason: 'Liburan keluarga',
  });

  assert.equal(createdUserId, 7);
  assert.equal(result.id, 11);
  assert.deepEqual(notifiedLeaves, [11]);
});

test('approveLeave notifies the employee after admin approval', async () => {
  const { createLeaveService } = await import('../services/leave.service.js');
  let approvedLeaveId: number | null = null;
  const approvedNotifications: number[] = [];
  let findByIdCallCount = 0;

  const service = createLeaveService({
    leaveRepository: {
      async findAll() {
        throw new Error('Not implemented');
      },
      async findAllForExport() {
        throw new Error('Not implemented');
      },
      async findById() {
        findByIdCallCount += 1;

        return findByIdCallCount === 1 ? createLeaveEntity('pending') : createLeaveEntity('approved');
      },
      async create() {
        throw new Error('Not implemented');
      },
      async update() {
        throw new Error('Not implemented');
      },
      async softDelete() {
        throw new Error('Not implemented');
      },
      async approve(id) {
        approvedLeaveId = id;
        return true;
      },
      async reject() {
        throw new Error('Not implemented');
      },
    },
    employeeRepository: {
      async findById() {
        throw new Error('Not implemented');
      },
    },
    leaveTypeRepository: {
      async findById() {
        throw new Error('Not implemented');
      },
    },
    notificationService: {
      async notifyLeaveSubmitted() {
        throw new Error('Not implemented');
      },
      async notifyLeaveApproved(_actor, leave) {
        approvedNotifications.push(leave.id);
      },
      async notifyLeaveRejected() {
        throw new Error('Not implemented');
      },
    },
    now: () => new Date('2026-04-12T10:00:00.000Z'),
  });

  const result = await service.approveLeave(createAuthUser('admin_hr'), 11);

  assert.equal(approvedLeaveId, 11);
  assert.equal(result.status, 'approved');
  assert.deepEqual(approvedNotifications, [11]);
});

test('rejectLeave notifies the employee after admin rejection', async () => {
  const { createLeaveService } = await import('../services/leave.service.js');
  const rejectedNotifications: number[] = [];
  let findByIdCallCount = 0;

  const service = createLeaveService({
    leaveRepository: {
      async findAll() {
        throw new Error('Not implemented');
      },
      async findAllForExport() {
        throw new Error('Not implemented');
      },
      async findById() {
        findByIdCallCount += 1;

        return findByIdCallCount === 1 ? createLeaveEntity('pending') : createLeaveEntity('rejected');
      },
      async create() {
        throw new Error('Not implemented');
      },
      async update() {
        throw new Error('Not implemented');
      },
      async softDelete() {
        throw new Error('Not implemented');
      },
      async approve() {
        throw new Error('Not implemented');
      },
      async reject() {
        return true;
      },
    },
    employeeRepository: {
      async findById() {
        throw new Error('Not implemented');
      },
    },
    leaveTypeRepository: {
      async findById() {
        throw new Error('Not implemented');
      },
    },
    notificationService: {
      async notifyLeaveSubmitted() {
        throw new Error('Not implemented');
      },
      async notifyLeaveApproved() {
        throw new Error('Not implemented');
      },
      async notifyLeaveRejected(_actor, leave) {
        rejectedNotifications.push(leave.id);
      },
    },
    now: () => new Date('2026-04-12T10:00:00.000Z'),
  });

  const result = await service.rejectLeave(createAuthUser('admin_hr'), 11, {
    rejectionReason: 'Kuota tim tidak mencukupi',
  });

  assert.equal(result.status, 'rejected');
  assert.deepEqual(rejectedNotifications, [11]);
});
