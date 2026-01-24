/**
 * Supplier API Types
 *
 * Type definitions for all Supplier API endpoints.
 * These types are used for request/response type safety.
 *
 * API Base: https://mds.vtoxi.com/api/Suppliers
 */

/**
 * Supplier entity from the API
 * Core data structure for supplier master records
 */
export interface Supplier {
  id: number;
  supplierName: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  taxNumber: string;
  licenseNumber: string;
  paymentTermDays: number;
  creditLimit: number;
  outstandingBalance: number;
  status: number;
  notes: string;
  isActive: boolean;
}

/**
 * Request body for creating a supplier (POST /api/Suppliers)
 * Only includes fields that should be set during creation
 */
export interface CreateSupplierRequest {
  supplierName: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  taxNumber: string;
  licenseNumber: string;
  paymentTermDays: number;
  creditLimit: number;
  notes: string;
}

/**
 * Request body for updating a supplier (PUT /api/Suppliers/:id)
 * Includes all updatable fields including status and isActive
 */
export interface UpdateSupplierRequest {
  supplierName: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  taxNumber: string;
  licenseNumber: string;
  paymentTermDays: number;
  creditLimit: number;
  status: number;
  notes: string;
  isActive: boolean;
}

/**
 * Query parameters for supplier list API
 */
export interface SupplierListQueryParams {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
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
 * Product supplied by a supplier (API 6: GET /api/Suppliers/:id/products)
 */
export interface SupplierProduct {
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
 * Purchase order for a supplier (API 7: GET /api/Suppliers/:id/purchase-orders)
 */
export interface SupplierPurchaseOrder {
  id: number;
  purchaseOrderNumber: string;
  orderDate: string; // ISO 8601 date string
  expectedDeliveryDate: string; // ISO 8601 date string
  status: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
}

/**
 * Supplier balance information (API 8: GET /api/Suppliers/:id/balance)
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
 * GET /api/Suppliers response (API 1)
 */
export type GetSuppliersListResponse = ApiResponse<PaginatedResponse<Supplier>>;

/**
 * POST /api/Suppliers response (API 2)
 */
export type CreateSupplierResponse = ApiResponse<Supplier>;

/**
 * GET /api/Suppliers/:id response (API 3)
 */
export type GetSupplierResponse = ApiResponse<Supplier>;

/**
 * PUT /api/Suppliers/:id response (API 4)
 */
export type UpdateSupplierResponse = ApiResponse<Supplier>;

/**
 * DELETE /api/Suppliers/:id response (API 5)
 */
export type DeleteSupplierResponse = ApiResponse<string>;

/**
 * GET /api/Suppliers/:id/products response (API 6)
 */
export type GetSupplierProductsResponse = ApiResponse<SupplierProduct[]>;

/**
 * GET /api/Suppliers/:id/purchase-orders response (API 7)
 */
export type GetSupplierPurchaseOrdersResponse = ApiResponse<
  PaginatedResponse<SupplierPurchaseOrder>
>;

/**
 * GET /api/Suppliers/:id/balance response (API 8)
 */
export type GetSupplierBalanceResponse = ApiResponse<SupplierBalance>;

/**
 * GET /api/Suppliers/active response (API 9)
 */
export type GetActiveSuppliersResponse = ApiResponse<Supplier[]>;

/**
 * GET /api/Suppliers/by-status/:status response (API 10)
 */
export type GetSuppliersByStatusResponse = ApiResponse<Supplier[]>;
