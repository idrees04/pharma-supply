import type { ApiResponse } from '@/types/api/common';

/** Shared shape for supplier / product / hospital bulk import API responses. */
export interface BulkImportRowResult {
  rowNumber: number;
  status: string;
  recordPreview: string;
  messages: string[];
}

export interface BulkImportResult {
  totalRowsRead: number;
  importedCount: number;
  skippedDuplicateCount: number;
  failedValidationCount: number;
  skippedEmptyCount: number;
  rowResults: BulkImportRowResult[];
  errorReportBase64?: string | null;
  errorReportFileName?: string | null;
}

export type BulkImportApiResponse = ApiResponse<BulkImportResult>;
