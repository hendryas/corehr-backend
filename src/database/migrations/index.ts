import { Migration } from '../types';
import { createCoreTablesMigration } from './001_create_core_tables';
import { addSoftDeleteToManagementTablesMigration } from './002_add_soft_delete_to_management_tables';
import { addSoftDeleteToOperationalTablesMigration } from './003_add_soft_delete_to_operational_tables';
import { createAuthSessionsTableMigration } from './004_create_auth_sessions_table';
import { createNotificationsTableMigration } from './005_create_notifications_table';
import { createLeaveTypesAndRefactorLeaveRequestsMigration } from './006_create_leave_types_and_refactor_leave_requests';

export const migrations: Migration[] = [
  createCoreTablesMigration,
  addSoftDeleteToManagementTablesMigration,
  addSoftDeleteToOperationalTablesMigration,
  createAuthSessionsTableMigration,
  createNotificationsTableMigration,
  createLeaveTypesAndRefactorLeaveRequestsMigration,
];
