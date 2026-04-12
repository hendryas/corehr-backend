import assert from 'node:assert/strict';
import test from 'node:test';

test('deleteLeaveType rejects when the leave type is still used by active leave requests', async () => {
  const { createLeaveTypeService } = await import('../services/leave-type.service.js');

  const service = createLeaveTypeService(
    {
      async findAll() {
        throw new Error('Not implemented');
      },
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
      async create() {
        throw new Error('Not implemented');
      },
      async update() {
        throw new Error('Not implemented');
      },
      async softDelete() {
        return true;
      },
    },
    {
      async countActiveByLeaveTypeId() {
        return 2;
      },
    },
  );

  await assert.rejects(
    () => service.deleteLeaveType(1),
    /still used by active leave requests/,
  );
});
