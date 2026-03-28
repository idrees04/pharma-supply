/**
 * Supply Order API Types
 *
 * Type definitions for all Supply Order API endpoints.
 */

import { ApiResponse, PaginatedResponse } from './products';

/**
 * Supply Order Item entity
 */
export interface SupplyOrderItem {
  id: number;
  productId: number;
  productName: string;
  productCode: string;
  orderedQuantity: number;
  fulfilledQuantity: number;
  remainingQuantity: number;
  unitPrice: number;
  taxPercentage: number;
  taxAmount: number;
  discountPercentage: number;
  discountAmount: number;
  totalAmount: number;
  fulfillmentSource: number;
  supplierId: number;
  supplierName: string;
  status: number;
}

/**
 * Supply Order entity
 */
export interface SupplyOrder {
  id: number;
  supplyOrderNumber: string;
  hospitalId: number;
  hospitalName: string;
  orderDate: string;
  requiredByDate: string;
  fulfilledDate: string | null;
  status: number;
  subTotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  requestedBy: string;
  approvedBy: string | null;
  approvedDate: string | null;
  shippingAddress: string | null;
  notes: string | null;
  invoiceId: number | null;
  items: SupplyOrderItem[] | null;
}

/**
 * Request for creating a Supply Order
 */
export interface CreateSupplyOrderRequest {
  hospitalId: number;
  orderDate: string;
  requiredByDate: string;
  requestedBy: string;
  shippingAddress: string;
  notes: string;
  items: {
    productId: number;
    orderedQuantity: number;
    unitPrice: number;
    taxPercentage: number;
    discountPercentage: number;
    fulfillmentSource: number;
    supplierId: number;
  }[];
}

/**
 * Request for updating a Supply Order
 */
export interface UpdateSupplyOrderRequest {
  requiredByDate: string;
  requestedBy: string;
  shippingAddress: string;
  notes: string;
  status: number;
}

/**
 * Query parameters for Supply Order list API
 */
export interface SupplyOrderListQueryParams {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

/**
 * API response types
 */
export type GetSupplyOrdersListResponse = ApiResponse<PaginatedResponse<SupplyOrder>>;
export type GetSupplyOrderResponse = ApiResponse<SupplyOrder>;
export type CreateSupplyOrderResponse = ApiResponse<SupplyOrder>;
export type UpdateSupplyOrderResponse = ApiResponse<SupplyOrder>;
export type DeleteSupplyOrderResponse = ApiResponse<boolean>;
export type GetSupplyOrdersByStatusResponse = ApiResponse<SupplyOrder[]>;
export type GetSupplyOrderStatusesResponse = ApiResponse<{ value: number; name: string }[]>;
