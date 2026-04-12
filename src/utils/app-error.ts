export class AppError extends Error {
  public readonly statusCode: number;

  public readonly errors?: unknown;

  public readonly code?: string;

  constructor(message: string, statusCode = 500, errors?: unknown, code?: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
  }
}
