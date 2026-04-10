import { Migration } from '../types';
import { createCoreTablesMigration } from './001_create_core_tables';
import { addSoftDeleteToManagementTablesMigration } from './002_add_soft_delete_to_management_tables';
import { addSoftDeleteToOperationalTablesMigration } from './003_add_soft_delete_to_operational_tables';

export const migrations: Migration[] = [
  createCoreTablesMigration,
  addSoftDeleteToManagementTablesMigration,
  addSoftDeleteToOperationalTablesMigration,
];
