import { ApiResponse } from './common';

// DTOs
export interface ExpenseCategory {
    id: number;
    categoryName: string;
    categoryCode: string | null;
    description: string | null;
    displayOrder: number;
    isActive: boolean;
    // Note: The full entity includes federationId and audit fields, but we only expose what's in the DTO.
    // In the spec, the request/response uses the full ExpenseCategory entity.
    // We'll use this interface for both request and response, but omit fields that shouldn't be sent.
}

// Request DTOs (same as entity for POST/PUT)
export type CreateExpenseCategoryRequest = Omit<ExpenseCategory, 'id' | 'isActive'> & {
    isActive?: boolean;
};
export type UpdateExpenseCategoryRequest = Partial<Omit<ExpenseCategory, 'id'>>;

// Response types
export type GetExpenseCategoriesResponse = ApiResponse<ExpenseCategory[]>;
export type GetExpenseCategoryResponse = ApiResponse<ExpenseCategory>;
export type CreateExpenseCategoryResponse = ApiResponse<ExpenseCategory>;
export type UpdateExpenseCategoryResponse = ApiResponse<ExpenseCategory>;
export type DeleteExpenseCategoryResponse = ApiResponse<null>;