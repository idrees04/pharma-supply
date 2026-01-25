/**
 * ProductType API Types
 *
 * Type definitions for all ProductType API endpoints.
 * Base URL: https://mds.vtoxi.com/api/ProductTypes
 */

/**
 * ProductType entity from the API
 */
export interface ProductType {
  id: number;
  typeName: string;
  typeCode: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

/**
 * Request body for creating a ProductType (POST /api/ProductTypes)
 */
export interface CreateProductTypeRequest {
  typeName: string;
  typeCode: string;
  description: string;
  displayOrder: number;
}

/**
 * Request body for updating a ProductType (PUT /api/ProductTypes/:id)
 */
export interface UpdateProductTypeRequest {
  typeName: string;
  typeCode: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

/**
 * API response wrapper structure
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string | null;
  timestamp: string;
}

/**
 * GET /api/ProductTypes response
 */
export type GetProductTypesListResponse = ApiResponse<ProductType[]>;

/**
 * POST /api/ProductTypes response
 */
export type CreateProductTypeResponse = ApiResponse<ProductType>;

/**
 * GET /api/ProductTypes/:id response
 */
export type GetProductTypeResponse = ApiResponse<ProductType>;

/**
 * PUT /api/ProductTypes/:id response
 */
export type UpdateProductTypeResponse = ApiResponse<ProductType>;

/**
 * DELETE /api/ProductTypes/:id response
 */
export type DeleteProductTypeResponse = ApiResponse<string>;
