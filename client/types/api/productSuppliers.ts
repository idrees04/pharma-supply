/**
 * Product Suppliers API Types
 *
 * Type definitions for all Product Suppliers API endpoints.
 * These types are used for request/response type safety.
 *
 * API Base: https://mds.vtoxi.com/api/ProductSuppliers
 */

/**
 * Product Supplier entity from the API
 * Core data structure for product-supplier relationships
 */
export interface ProductSupplier {
  id: number;
  productId: number;
  productName: string;
  productCode: string;
  supplierId: number;
  supplierName: string;
  supplierProductCode: string;
  purchaseRate: number;
  leadTimeDays: number;
  minOrderQuantity: number;
  isPreferredSupplier: boolean;
  isActive: boolean;
}

/**
 * Supplier's product details from GET /api/Suppliers/:id/products
 */
export interface SupplierProductDetail {
  productId: number;
  productName: string;
  productCode: string;
  supplierProductCode: string;
  purchaseRate: number;
  minOrderQuantity: number;
  leadTimeDays: number;
  isPreferred: boolean;
  lastPurchaseDate: string; // ISO 8601 date string
  lastPurchaseRate: number;
}

/**
 * Supplier balance information from GET /api/Suppliers/:id/balance
 */
export interface SupplierBalance {
  supplierId: number;
  supplierName: string;
  creditLimit: number;
  outstandingBalance: number;
  availableCredit: number;
  totalPurchaseAmount: number;
  totalPaidAmount: number;
  pendingOrders: number;
  completedOrders: number;
}

/**
 * Request body for updating a product supplier (PUT /api/ProductSuppliers/:id)
 */
export interface UpdateProductSupplierRequest {
  supplierProductCode: string;
  supplierRate: number;
  leadTimeDays: number;
  minimumOrderQuantity: number;
  discountPercentage: number;
  isPreferredSupplier: boolean;
  notes: string;
  isActive: boolean;
}

/**
 * Request body for linking a product to a supplier (POST /api/ProductSuppliers/link)
 */
export interface LinkProductSupplierRequest {
  productId: number;
  supplierId: number;
  supplierProductCode: string;
  supplierRate: number;
  leadTimeDays: number;
  minimumOrderQuantity: number;
  discountPercentage: number;
  isPreferredSupplier: boolean;
  notes: string;
}

/**
 * Request body for bulk linking products to a supplier (POST /api/ProductSuppliers/bulk-link)
 */
export interface BulkLinkProductSupplierRequest {
  supplierId: number;
  products: Array<{
    productId: number;
    supplierProductCode: string;
    supplierRate: number;
    leadTimeDays: number;
    minimumOrderQuantity: number;
    discountPercentage: number;
    isPreferredSupplier: boolean;
    notes: string;
  }>;
}

/**
 * Response body for bulk linking (POST /api/ProductSuppliers/bulk-link)
 */
export interface BulkLinkResponse {
  supplierId: number;
  totalRequested: number;
  successfullyLinked: number;
  skipped: number;
  errors: string[];
}

/**
 * Request body for bulk delinking products from a supplier (DELETE /api/ProductSuppliers/:id)
 * Note: This deletes the relationship between products and supplier
 */
export interface BulkDelinktProductSupplierRequest {
  supplierId: number;
  productIds: number[];
}

/**
 * Response body for bulk delink (DELETE /api/ProductSuppliers/:id)
 */
export interface BulkDelinkResponse {
  supplierId: number;
  totalRequested: number;
  successfullyDelinked: number;
  notFound: number;
  errors: string[];
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
 * GET /api/ProductSuppliers response (API 1)
 */
export type GetProductSuppliersListResponse = ApiResponse<ProductSupplier[]>;

/**
 * GET /api/ProductSuppliers/:id response (API 2)
 */
export type GetProductSupplierResponse = ApiResponse<ProductSupplier>;

/**
 * PUT /api/ProductSuppliers/:id response (API 3)
 */
export type UpdateProductSupplierResponse = ApiResponse<ProductSupplier>;

/**
 * DELETE /api/ProductSuppliers/:id response (API 4 - single delete)
 */
export type DeleteProductSupplierResponse = ApiResponse<string>;

/**
 * GET /api/ProductSuppliers/by-product/:productId response (API 5)
 */
export type GetProductSuppliersByProductResponse = ApiResponse<ProductSupplier[]>;

/**
 * GET /api/Suppliers/:id/products response (API 6)
 */
export type GetSupplierProductsResponse = ApiResponse<SupplierProductDetail[]>;

/**
 * GET /api/ProductSuppliers/by-supplier/:supplierId response (API 7)
 */
export type GetProductSuppliersBySupplierResponse = ApiResponse<ProductSupplier[]>;

/**
 * GET /api/Suppliers/:id/balance response (API 8)
 */
export type GetSupplierBalanceResponse = ApiResponse<SupplierBalance>;

/**
 * POST /api/ProductSuppliers/link response (API 9)
 */
export type LinkProductSupplierResponse = ApiResponse<ProductSupplier>;

/**
 * POST /api/ProductSuppliers/bulk-link response (API 10)
 */
export type BulkLinkProductSupplierResponse = ApiResponse<BulkLinkResponse>;

/**
 * DELETE /api/ProductSuppliers/:id response (API 11 - bulk delete)
 */
export type BulkDelinkProductSupplierResponse = ApiResponse<BulkDelinkResponse>;
