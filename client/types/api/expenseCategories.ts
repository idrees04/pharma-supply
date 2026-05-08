import { ApiResponse } from './common';

// DTOs (matches backend ExpenseCategoryDto)
export interface ExpenseCategory {
    id: number;
    categoryName: string;
    categoryCode: string | null;
    description: string | null;
    displayOrder: number;
    isActive: boolean;
}

/** POST /api/ExpenseCategories — backend uses non-nullable strings; send "" not null. */
export interface CreateExpenseCategoryRequest {
    categoryName: string;
    categoryCode: string;
    description: string;
    displayOrder: number;
}

/** PUT /api/ExpenseCategories/{id} */
export interface UpdateExpenseCategoryRequest {
    categoryName: string;
    categoryCode: string;
    description: string;
    displayOrder: number;
    isActive: boolean;
}

// Response types
export type GetExpenseCategoriesResponse = ApiResponse<ExpenseCategory[]>;
export type GetExpenseCategoryResponse = ApiResponse<ExpenseCategory>;
export type CreateExpenseCategoryResponse = ApiResponse<ExpenseCategory>;
export type UpdateExpenseCategoryResponse = ApiResponse<ExpenseCategory>;
export type DeleteExpenseCategoryResponse = ApiResponse<null>;
