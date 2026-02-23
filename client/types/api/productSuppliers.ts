// types/api/productSuppliers.ts
import { ApiResponse } from './common';

// DTOs
export interface ProductSupplierDto {
  id: number;
  productId: number;
  productName: string | null;
  productCode: string | null;
  supplierId: number;
  supplierName: string | null;
  supplierProductCode: string | null;
  purchaseRate: number;
  leadTimeDays: number;
  minOrderQuantity: number;
  isPreferredSupplier: boolean;
  isActive: boolean;
}

// Request DTOs
export interface LinkProductSupplierRequest {
  productId: number;
  supplierId: number;
  supplierProductCode?: string | null;
  supplierRate: number;
  leadTimeDays?: number;
  minimumOrderQuantity?: number;
  discountPercentage?: number;
  isPreferredSupplier?: boolean;
  notes?: string | null;
}

export interface UpdateProductSupplierRequest {
  supplierProductCode?: string | null;
  supplierRate: number;
  leadTimeDays?: number;
  minimumOrderQuantity?: number;
  discountPercentage?: number;
  isPreferredSupplier?: boolean;
  notes?: string | null;
  isActive?: boolean;
}

export interface BulkLinkProductsToSupplierRequest {
  supplierId: number;
  products: {
    productId: number;
    supplierProductCode?: string | null;
    supplierRate: number;
    leadTimeDays?: number;
    minimumOrderQuantity?: number;
    discountPercentage?: number;
    isPreferredSupplier?: boolean;
    notes?: string | null;
  }[];
}

export interface BulkDelinkProductsFromSupplierRequest {
  supplierId: number;
  productIds: number[];
}

// Response types
export interface BulkLinkResponse {
  supplierId: number;
  totalRequested: number;
  successfullyLinked: number;
  skipped: number;
  errors: string[] | null;
}

export interface BulkDelinkResponse {
  supplierId: number;
  totalRequested: number;
  successfullyDelinked: number;
  notFound: number;
  errors: string[] | null;
}

export type GetProductSuppliersResponse = ApiResponse<ProductSupplierDto[]>;
export type GetProductSupplierResponse = ApiResponse<ProductSupplierDto>;
export type UpdateProductSupplierResponse = ApiResponse<ProductSupplierDto>;
export type DeleteProductSupplierResponse = ApiResponse<null>;
export type GetProductSuppliersByProductResponse = ApiResponse<ProductSupplierDto[]>;
export type GetProductSuppliersBySupplierResponse = ApiResponse<ProductSupplierDto[]>;
export type LinkProductSupplierResponse = ApiResponse<ProductSupplierDto>;
export type BulkLinkResponseWrapper = ApiResponse<BulkLinkResponse>;
export type BulkDelinkResponseWrapper = ApiResponse<BulkDelinkResponse>;