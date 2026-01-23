/**
 * Product API Types
 *
 * Type definitions for all Product API endpoints.
 * These types are used for request/response type safety.
 *
 * API Base: https://mds.vtoxi.com/api/Products
 */

/**
 * Product entity from the API
 * All fields except availableQuantity (read-only) can be updated
 */
export interface Product {
  id: number;
  productName: string;
  genericName: string;
  productCode: string;
  manufacturer: string;
  productTypeId: number;
  productTypeName: string;
  category: string;
  subCategory: string;
  unitOfMeasure: string;
  standardPurchaseRate: number;
  standardSaleRate: number;
  taxPercentage: number;
  reorderLevel: number;
  reorderQuantity: number;
  hsnCode: string;
  isBatchRequired: boolean;
  description: string;
  requiresPrescription: boolean;
  storageConditions: string;
  availableQuantity: number;
  isActive: boolean;
}

/**
 * Request body for creating a product (POST /api/Products)
 * excludes: id, productTypeName, availableQuantity (read-only fields)
 */
export interface CreateProductRequest {
  productName: string;
  genericName: string;
  productCode: string;
  manufacturer: string;
  productTypeId: number;
  category: string;
  subCategory: string;
  unitOfMeasure: string;
  standardPurchaseRate: number;
  standardSaleRate: number;
  taxPercentage: number;
  reorderLevel: number;
  reorderQuantity: number;
  hsnCode: string;
  isBatchRequired: boolean;
  description: string;
  requiresPrescription: boolean;
  storageConditions: string;
}

/**
 * Request body for updating a product (PUT /api/Products/:id)
 * Same as CreateProductRequest but excludes productCode (not updatable)
 */
export interface UpdateProductRequest {
  productName: string;
  genericName: string;
  manufacturer: string;
  productTypeId: number;
  category: string;
  subCategory: string;
  unitOfMeasure: string;
  standardPurchaseRate: number;
  standardSaleRate: number;
  taxPercentage: number;
  reorderLevel: number;
  reorderQuantity: number;
  hsnCode: string;
  isBatchRequired: boolean;
  description: string;
  requiresPrescription: boolean;
  storageConditions: string;
  isActive: boolean;
}

/**
 * Paginated list response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

/**
 * API response wrapper structure
 * All API responses follow this structure
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string | null;
  timestamp: string;
}

/**
 * GET /api/Products response
 */
export type GetProductsListResponse = ApiResponse<PaginatedResponse<Product>>;

/**
 * POST /api/Products response
 */
export type CreateProductResponse = ApiResponse<Product>;

/**
 * GET /api/Products/:id response
 */
export type GetProductResponse = ApiResponse<Product>;

/**
 * PUT /api/Products/:id response
 */
export type UpdateProductResponse = ApiResponse<Product>;

/**
 * DELETE /api/Products/:id response
 */
export type DeleteProductResponse = ApiResponse<boolean>;

/**
 * GET /api/Products/low-stock response
 */
export type GetLowStockProductsResponse = ApiResponse<Product[]>;

/**
 * Query parameters for product list API
 */
export interface ProductListQueryParams {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
}
