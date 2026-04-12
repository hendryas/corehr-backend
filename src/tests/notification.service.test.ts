import assert from 'node:assert/strict';
import test from 'node:test';

const createAdmin = (id: number, fullName: string) => ({
  id,
  employeeCode: `ADM-${id}`,
  fullName,
  email: `admin${id}@corehr.local`,
  phone: null,
  gender: null,
  address: null,
  hireDate: '2025-01-01',
  isActive: true,
  role: 'admin_hr' as const,
  departmentId: null,
  departmentName: null,
  positionId: null,
  positionName: null,
  createdAt: '2025-01-01 00:00:00',
  updatedAt: '2025-01-01 00:00:00',
});

const createActor = () => ({
  id: 7,
  employeeCode: 'EMP-007',
  fullName: 'Budi',
  email: 'budi@corehr.local',
  phone: null,
  gender: null,
  address: null,
  hireDate: '2025-01-01',
  isActive: true,
  role: 'employee' as const,
  departmentId: null,
  departmentName: null,
  positionId: null,
  positionName: null,
});

const createLeave = () => ({
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
  status: 'pending' as const,
  approvedBy: null,
  approverName: null,
  approvedAt: null,
  rejectionReason: null,
  createdAt: '2026-04-12 09:00:00',
  updatedAt: '2026-04-12 09:00:00',
});

test('notifyLeaveSubmitted sends notifications to all active HR admins except the actor', async () => {
  const { createNotificationService } = await import('../services/notification.service.js');
  const createdPayloads: Array<{
    userId: number;
    actorUserId: number | null;
    leaveRequestId: number | null;
    type: string;
    title: string;
    message: string;
  }> = [];

  const service = createNotificationService({
    notificationRepository: {
      async createMany(payloads) {
        createdPayloads.push(...payloads);
      },
      async findAllByUserId() {
        throw new Error('Not implemented');
      },
      async findByIdForUser() {
        throw new Error('Not implemented');
      },
      async markAsRead() {
        throw new Error('Not implemented');
      },
      async markAllAsRead() {
        throw new Error('Not implemented');
      },
    },
    employeeRepository: {
      async findActiveByRole() {
        return [createAdmin(1, 'HR Satu'), createAdmin(2, 'HR Dua')];
      },
    },
    now: () => new Date('2026-04-12T10:00:00.000Z'),
  });

  await service.notifyLeaveSubmitted(createActor(), createLeave());

  assert.equal(createdPayloads.length, 2);
  assert.deepEqual(
    createdPayloads.map((payload) => payload.userId),
    [1, 2],
  );
  assert.ok(createdPayloads.every((payload) => payload.type === 'leave_submitted'));
});

test('notifyLeaveApproved sends a notification to the leave owner', async () => {
  const { createNotificationService } = await import('../services/notification.service.js');
  const createdPayloads: Array<{ userId: number; type: string; message: string }> = [];
  const service = createNotificationService({
    notificationRepository: {
      async createMany(payloads) {
        createdPayloads.push(
          ...payloads.map((payload) => ({
            userId: payload.userId,
            type: payload.type,
            message: payload.message,
          })),
        );
      },
      async findAllByUserId() {
        throw new Error('Not implemented');
      },
      async findByIdForUser() {
        throw new Error('Not implemented');
      },
      async markAsRead() {
        throw new Error('Not implemented');
      },
      async markAllAsRead() {
        throw new Error('Not implemented');
      },
    },
    employeeRepository: {
      async findActiveByRole() {
        return [];
      },
    },
    now: () => new Date('2026-04-12T10:00:00.000Z'),
  });

  await service.notifyLeaveApproved(
    {
      ...createAdmin(99, 'Maya HR'),
      role: 'admin_hr',
    },
    {
      ...createLeave(),
      status: 'approved',
      approverName: 'Maya HR',
      approvedBy: 99,
      approvedAt: '2026-04-12 10:00:00',
    },
  );

  assert.equal(createdPayloads.length, 1);
  assert.equal(createdPayloads[0]?.userId, 7);
  assert.equal(createdPayloads[0]?.type, 'leave_approved');
  assert.match(createdPayloads[0]?.message ?? '', /disetujui/);
});
