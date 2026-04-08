interface MysqlLikeError {
  code?: string;
  errno?: number;
  sqlMessage?: string;
}

const toMysqlLikeError = (error: unknown): MysqlLikeError => {
  if (typeof error === 'object' && error !== null) {
    return error as MysqlLikeError;
  }

  return {};
};

export const isDuplicateEntryError = (error: unknown): boolean => {
  return toMysqlLikeError(error).code === 'ER_DUP_ENTRY';
};

export const isForeignKeyConstraintError = (error: unknown): boolean => {
  const code = toMysqlLikeError(error).code;

  return code === 'ER_ROW_IS_REFERENCED_2' || code === 'ER_NO_REFERENCED_ROW_2';
};

export const getMysqlErrorMessage = (error: unknown): string | undefined => {
  return toMysqlLikeError(error).sqlMessage;
};
