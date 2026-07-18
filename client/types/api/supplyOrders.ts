/**
 * Supply Order API Types
 *
 * Type definitions for all Supply Order API endpoints.
 */

import { ApiResponse, PaginatedResponse } from './products';
import type { DeliveryChallan } from './deliveryChallans';

/** Matches backend SupplyOrderStatus enum */
export enum SupplyOrderStatus {
  Draft = 1,
  Pending = 2,
  Approved = 3,
  PartiallyFulfilled = 4,
  Fulfilled = 5,
  Invoiced = 6,
  Cancelled = 7,
}

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
  attachmentPath?: string | null;
  attachmentFileName?: string | null;
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
  requestedBy?: string;
  shippingAddress?: string;
  notes?: string;
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

/** Line payload for PUT — matches backend UpdateSupplyOrderItemDto */
export interface UpdateSupplyOrderItemRequest {
  id?: number;
  productId: number;
  orderedQuantity: number;
  unitPrice: number;
  taxPercentage: number;
  discountPercentage: number;
  fulfillmentSource: number;
  supplierId?: number | null;
}

/**
 * Request for updating a Supply Order
 * Items are optional; when sent and the order is Draft or Pending, the API replaces lines and recalculates totals.
 */
export interface UpdateSupplyOrderRequest {
  requiredByDate: string;
  requestedBy?: string;
  shippingAddress?: string;
  notes?: string;
  status: number;
  items?: UpdateSupplyOrderItemRequest[];
}

/** One option from GET /api/Enums/SupplyOrderStatus */
export interface SupplyOrderStatusOption {
  value: number;
  /** UI label (DisplayName from API) */
  name: string;
  /** Enum member name, e.g. Draft, Pending, Cancelled */
  code: string;
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

/** Summary row from GET /api/SupplyOrders/{id}/delivery-challans */
export interface DeliveryChallanSummary {
  id: number;
  challanNumber: string;
  dispatchDate: string;
  status: number;
}

/** POST /api/SupplyOrders/{id}/delivery-challans — matches CreateDeliveryChallanRequest */
export interface CreateDeliveryChallanLineInput {
  supplyOrderItemId: number;
  quantityToDispatch: number;
}

export interface CreateDeliveryChallanFromSupplyOrderRequest {
  dispatchDate: string;
  notes?: string | null;
  items: CreateDeliveryChallanLineInput[];
}

/** GET /api/SupplyOrders/{id}/dispatch-suggestion */
export interface SupplyOrderDispatchLineSuggestion {
  supplyOrderItemId: number;
  productId: number;
  productName: string | null;
  remainingToFulfill: number;
  availableInInventory: number;
  maxDispatchableQuantity: number;
}

export interface SupplyOrderDispatchSuggestion {
  supplyOrderId: number;
  supplyOrderNumber: string;
  lines: SupplyOrderDispatchLineSuggestion[];
}

/**
 * API response types
 */
export type GetSupplyOrderDeliveryChallansResponse = ApiResponse<DeliveryChallanSummary[]>;
export type GetSupplyOrderDispatchSuggestionResponse = ApiResponse<SupplyOrderDispatchSuggestion>;
export type GetSupplyOrdersListResponse = ApiResponse<PaginatedResponse<SupplyOrder>>;
export type GetSupplyOrderResponse = ApiResponse<SupplyOrder>;
export type CreateSupplyOrderResponse = ApiResponse<SupplyOrder>;
export type UpdateSupplyOrderResponse = ApiResponse<SupplyOrder>;
export type DeleteSupplyOrderResponse = ApiResponse<boolean>;
export type GetSupplyOrdersByStatusResponse = ApiResponse<SupplyOrder[]>;
export type GetSupplyOrderStatusesResponse = ApiResponse<{ value: number; name: string }[]>;
export type CreateDeliveryChallanFromSupplyOrderResponse = ApiResponse<DeliveryChallan>;
