import { ApiResponse, PaginatedResponse } from './common';

/** Matches MDS.Dal.Entities.IncomeStatus */
export enum IncomeStatus {
  Pending = 1,
  Received = 3,
  Cancelled = 5,
}

export interface IncomeDto {
  id: number;
  incomeNumber: string | null;
  incomeDate: string;
  incomeCategoryId: number;
  incomeCategoryName: string | null;
  amount: number;
  description: string | null;
  accountId: number;
  accountName: string | null;
  status: IncomeStatus;
  notes: string | null;
  isActive: boolean;
  voucherNumber: string | null;
  voucherIssuedDate: string | null;
  voucherTemplateKey: string | null;
  referenceNumber: string | null;
}

/** POST /api/Incomes — backend requires non-null strings; send "" for empty. */
export interface CreateIncomeRequest {
  incomeDate: string;
  incomeCategoryId: number;
  amount: number;
  description: string;
  accountId: number;
  referenceNumber: string;
  notes: string;
}

/** PUT /api/Incomes/{id} */
export interface UpdateIncomeRequest {
  incomeDate: string;
  incomeCategoryId: number;
  amount: number;
  description: string;
  accountId: number;
  status: IncomeStatus;
  notes: string;
}

export interface IssueIncomeVoucherRequest {
  voucherTemplateKey?: string | null;
}

export interface IssueIncomeVoucherBatchRequest {
  incomeIds: number[];
  voucherTemplateKey?: string | null;
}

export interface IncomeVoucherLinePrintDto {
  incomeId: number;
  incomeNumber: string | null;
  incomeDate: string;
  categoryName: string | null;
  accountName: string | null;
  amount: number;
  description: string | null;
  referenceNumber: string | null;
}

export interface IncomeVoucherPrintDto {
  incomeId: number;
  voucherNumber: string | null;
  incomeNumber: string | null;
  incomeDate: string;
  voucherIssuedDate: string | null;
  voucherTemplateKey: string | null;
  accountName: string | null;
  categoryName: string | null;
  amount: number;
  totalAmount: number;
  amountInWords: string | null;
  description: string | null;
  referenceNumber: string | null;
  notes: string | null;
  lines: IncomeVoucherLinePrintDto[];
}

export interface IncomeVoucherGroupDto {
  voucherNumber: string;
  voucherIssuedDate: string | null;
  voucherTemplateKey: string | null;
  lineCount: number;
  totalAmount: number;
  incomes: IncomeDto[];
}

export interface IncomeVoucherBatchResultDto {
  voucherNumber: string;
  voucherIssuedDate: string | null;
  totalAmount: number;
  incomes: IncomeDto[];
}

export interface IncomeListQueryParams {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

export type GetIncomesResponse = ApiResponse<PaginatedResponse<IncomeDto>>;
export type GetIncomeResponse = ApiResponse<IncomeDto>;
export type CreateIncomeResponse = ApiResponse<IncomeDto | null>;
export type UpdateIncomeResponse = ApiResponse<IncomeDto | null>;
export type DeleteIncomeResponse = ApiResponse<null>;
export type GetIssuedIncomeVouchersResponse = ApiResponse<IncomeDto[]>;
export type GetIssuedIncomeVoucherGroupsResponse = ApiResponse<IncomeVoucherGroupDto[]>;
export type GetIncomeVoucherPrintResponse = ApiResponse<IncomeVoucherPrintDto>;
export type IssueIncomeVoucherResponse = ApiResponse<IncomeDto>;
export type IssueIncomeVoucherBatchResponse = ApiResponse<IncomeVoucherBatchResultDto>;

