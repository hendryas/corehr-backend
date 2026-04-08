import { Response } from 'express';

interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => string | number | boolean | null | undefined;
}

const escapeCsvValue = (value: string | number | boolean | null | undefined): string => {
  if (value === null || value === undefined) {
    return '';
  }

  const normalized = String(value);

  if (normalized.includes('"') || normalized.includes(',') || normalized.includes('\n')) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
};

export const buildCsv = <T>(rows: T[], columns: CsvColumn<T>[]): string => {
  const headerRow = columns.map((column) => escapeCsvValue(column.header)).join(',');
  const dataRows = rows.map((row) =>
    columns.map((column) => escapeCsvValue(column.accessor(row))).join(','),
  );

  return [headerRow, ...dataRows].join('\n');
};

export const sendCsvDownload = (res: Response, filename: string, csvContent: string): Response => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  return res.status(200).send(csvContent);
};
