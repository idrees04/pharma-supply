import { ApiResponse, PaginatedResponse } from './common';

/** Matches MDS.Dal.Entities.ExpenseStatus */
export enum ExpenseStatus {
  Pending = 1,
  Paid = 3,
  Cancelled = 5,
}

export interface ExpenseDto {
  id: number;
  expenseNumber: string | null;
  expenseDate: string;
  expenseCategoryId: number;
  expenseCategoryName: string | null;
  amount: number;
  description: string | null;
  accountId: number;
  accountName: string | null;
  status: ExpenseStatus;
  notes: string | null;
  isActive: boolean;
  voucherNumber: string | null;
  voucherIssuedDate: string | null;
  voucherTemplateKey: string | null;
  payeeName: string | null;
  referenceNumber: string | null;
}

/** POST /api/Expenses — backend requires non-null strings; send "" for empty. */
export interface CreateExpenseRequest {
  expenseDate: string;
  expenseCategoryId: number;
  amount: number;
  description: string;
  accountId: number;
  payeeName: string;
  referenceNumber: string;
  notes: string;
}

export interface BulkCreateExpensesRequest {
  items: CreateExpenseRequest[];
  /** When true, issue one combined voucher for all created expenses. */
  createVoucher?: boolean;
  voucherTemplateKey?: string | null;
}

export interface BulkCreateExpensesResultDto {
  count: number;
  expenseIds: number[];
  voucherNumber: string | null;
}

/** PUT /api/Expenses/{id} */
export interface UpdateExpenseRequest {
  expenseDate: string;
  expenseCategoryId: number;
  amount: number;
  description: string;
  accountId: number;
  status: ExpenseStatus;
  notes: string;
}

export interface IssueExpenseVoucherRequest {
  voucherTemplateKey?: string | null;
}

export interface IssueExpenseVoucherBatchRequest {
  expenseIds: number[];
  voucherTemplateKey?: string | null;
}

export interface ExpenseVoucherLinePrintDto {
  expenseId: number;
  expenseNumber: string | null;
  expenseDate: string;
  categoryName: string | null;
  accountName: string | null;
  payeeName: string | null;
  amount: number;
  description: string | null;
  referenceNumber: string | null;
}

export interface ExpenseVoucherPrintDto {
  expenseId: number;
  voucherNumber: string | null;
  expenseNumber: string | null;
  expenseDate: string;
  voucherIssuedDate: string | null;
  voucherTemplateKey: string | null;
  payeeName: string | null;
  accountName: string | null;
  categoryName: string | null;
  amount: number;
  totalAmount: number;
  amountInWords: string | null;
  description: string | null;
  referenceNumber: string | null;
  notes: string | null;
  lines: ExpenseVoucherLinePrintDto[];
}

export interface ExpenseVoucherGroupDto {
  voucherNumber: string;
  voucherIssuedDate: string | null;
  voucherTemplateKey: string | null;
  lineCount: number;
  totalAmount: number;
  expenses: ExpenseDto[];
}

export interface ExpenseVoucherBatchResultDto {
  voucherNumber: string;
  voucherIssuedDate: string | null;
  totalAmount: number;
  expenses: ExpenseDto[];
}

export interface ExpenseListQueryParams {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

export type GetExpensesResponse = ApiResponse<PaginatedResponse<ExpenseDto>>;
export type GetExpenseResponse = ApiResponse<ExpenseDto>;
export type CreateExpenseResponse = ApiResponse<ExpenseDto | null>;
export type UpdateExpenseResponse = ApiResponse<ExpenseDto | null>;
export type DeleteExpenseResponse = ApiResponse<null>;
export type GetIssuedVouchersResponse = ApiResponse<ExpenseDto[]>;
export type GetIssuedVoucherGroupsResponse = ApiResponse<ExpenseVoucherGroupDto[]>;
export type GetVoucherPrintResponse = ApiResponse<ExpenseVoucherPrintDto>;
export type IssueVoucherResponse = ApiResponse<ExpenseDto>;
export type IssueVoucherBatchResponse = ApiResponse<ExpenseVoucherBatchResultDto>;
