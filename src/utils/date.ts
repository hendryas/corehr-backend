const pad = (value: number): string => String(value).padStart(2, '0');

export const formatDateForMysql = (date: Date): string => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const formatDateTimeForMysql = (date: Date): string => {
  return `${formatDateForMysql(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const isValidDateTimeInput = (value: string): boolean => {
  const normalized = value.trim().replace(' ', 'T');
  const parsedDate = new Date(normalized);

  return !Number.isNaN(parsedDate.getTime());
};
