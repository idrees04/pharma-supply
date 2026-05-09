import { ApiResponse } from './common';

// DTOs (matches backend IncomeCategoryDto)
export interface IncomeCategory {
  id: number;
  categoryName: string;
  categoryCode: string | null;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
}

/** POST /api/IncomeCategories — backend uses non-nullable strings; send "" not null. */
export interface CreateIncomeCategoryRequest {
  categoryName: string;
  categoryCode: string;
  description: string;
  displayOrder: number;
}

/** PUT /api/IncomeCategories/{id} */
export interface UpdateIncomeCategoryRequest {
  categoryName: string;
  categoryCode: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

// Response types
export type GetIncomeCategoriesResponse = ApiResponse<IncomeCategory[]>;
export type GetIncomeCategoryResponse = ApiResponse<IncomeCategory>;
export type CreateIncomeCategoryResponse = ApiResponse<IncomeCategory>;
export type UpdateIncomeCategoryResponse = ApiResponse<IncomeCategory>;
export type DeleteIncomeCategoryResponse = ApiResponse<null>;

