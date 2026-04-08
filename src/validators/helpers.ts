import { sendError } from '../utils/response';

export type ValidationErrors = Record<string, string[]>;

export const addError = (errors: ValidationErrors, field: string, message: string): void => {
  if (!errors[field]) {
    errors[field] = [];
  }

  errors[field].push(message);
};

export const normalizeOptionalString = (value: unknown): string | null => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  return trimmed === '' ? null : trimmed;
};

export const parsePositiveInteger = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);

    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
};

export const parseBooleanInput = (value: unknown): boolean | null => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (value === 1) {
      return true;
    }

    if (value === 0) {
      return false;
    }
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (normalized === 'true' || normalized === '1') {
      return true;
    }

    if (normalized === 'false' || normalized === '0') {
      return false;
    }
  }

  return null;
};

export const isValidDateString = (value: string): boolean => {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().startsWith(value);
};

export const sendValidationError = (
  res: Parameters<typeof sendError>[0],
  errors: ValidationErrors,
) => {
  return sendError(res, {
    statusCode: 422,
    message: 'Validation failed',
    errors,
  });
};
