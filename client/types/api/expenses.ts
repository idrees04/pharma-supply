import { ApiResponse, PaginatedResponse } from './common';

// Enums
export enum ExpenseStatus {
    Pending = 1,
    Approved = 3,
    Rejected = 5,
}

// DTOs
export interface ExpenseDto {
    id: number;
    expenseNumber: string | null;
    expenseDate: string; // ISO date
    expenseCategoryId: number;
    expenseCategoryName: string | null;
    amount: number;
    description: string | null;
    accountId: number;
    accountName: string | null;
    status: ExpenseStatus;
    notes: string | null;
    isActive: boolean;
}

// Request DTOs
export interface CreateExpenseRequest {
    expenseDate: string; // ISO date
    expenseCategoryId: number;
    amount: number;
    description?: string | null;
    accountId: number;
    notes?: string | null;
}

export interface UpdateExpenseRequest {
    expenseDate?: string;
    expenseCategoryId?: number;
    amount?: number;
    description?: string | null;
    accountId?: number;
    status?: ExpenseStatus;
    notes?: string | null;
}

// Query parameters
export interface ExpenseListQueryParams {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    sortBy?: string;
    sortDescending?: boolean;
}

// Response types
export type GetExpensesResponse = ApiResponse<PaginatedResponse<ExpenseDto>>;
export type GetExpenseResponse = ApiResponse<ExpenseDto>;
export type CreateExpenseResponse = ApiResponse<ExpenseDto>;
export type UpdateExpenseResponse = ApiResponse<ExpenseDto>;
export type DeleteExpenseResponse = ApiResponse<null>;