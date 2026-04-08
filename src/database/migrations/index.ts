import { Migration } from '../types';
import { createCoreTablesMigration } from './001_create_core_tables';

export const migrations: Migration[] = [createCoreTablesMigration];
