/**
 * Purchase Order API Types
 *
 * Type definitions for all Purchase Order API endpoints.
 */

import { ApiResponse, PaginatedResponse } from './products';

/**
 * Purchase Order Item entity
 */
export interface PurchaseOrderItem {
  id: number;
  productId: number;
  productName: string;
  productCode: string;
  orderedQuantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
  unitPrice: number;
  taxPercentage: number;
  taxAmount: number;
  discountPercentage: number;
  discountAmount: number;
  totalAmount: number;
  supplyOrderIds: number[];
}

/**
 * Purchase Order lifecycle status codes (matches backend enum).
 */
export enum PurchaseOrderStatus {
  Sent = 1,
  Active = 2,
  Completed = 3,
  Cancelled = 4,
}

/**
 * Purchase Order entity
 */
export interface PurchaseOrder {
  id: number;
  purchaseOrderNumber: string;
  supplierId: number;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate: string;
  status: number;
  totalAmount: number;
  paidAmount?: number;
  outstandingAmount?: number;
  deliveryAddress: string;
  paymentMethod?: 'Cash' | 'Cheque' | 'Bank';
  notes: string;
  isActive: boolean;
  createdAt: string;
  items: PurchaseOrderItem[];
}

/**
 * Request for creating a Purchase Order
 */
export interface CreatePurchaseOrderRequest {
  supplierId: number;
  orderDate: string;
  expectedDeliveryDate: string;
  deliveryAddress: string;
  notes: string;
  items: {
    productId: number;
    productName?: string;
    orderedQuantity: number;
    unitPrice: number;
    taxPercentage: number;
    discountPercentage: number;
    supplyOrderIds: number[];
  }[];
}

/**
 * Request for updating a Purchase Order
 */
export interface UpdatePurchaseOrderRequest {
  expectedDeliveryDate: string;
  deliveryAddress: string;
  notes: string;
}

/**
 * Status option from GET /api/PurchaseOrders/statuses
 */
export interface PurchaseOrderStatusOption {
  value: number;
  name: string;
}

/**
 * Request for receiving items
 */
export interface ReceivePurchaseOrderRequest {
  purchaseOrderId: number;
  actualDeliveryDate: string;
  items: {
    purchaseOrderItemId: number;
    receivedQuantity: number;
    batchNumber: string;
    manufactureDate: string;
    expiryDate: string;
    notes: string;
  }[];
}

/**
 * Request for partial order
 */
export interface PartialOrderRequest {
  expectedDeliveryDate: string;
  items: {
    productId: number;
    quantity: number;
  }[];
  supplyOrderIds: number[];
}

/**
 * Query parameters for Purchase Order list API
 */
export interface PurchaseOrderListQueryParams {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

/**
 * API response types
 */
export type GetPurchaseOrdersListResponse = ApiResponse<PaginatedResponse<PurchaseOrder>>;
export type GetPurchaseOrderResponse = ApiResponse<PurchaseOrder>;
export type CreatePurchaseOrderResponse = ApiResponse<PurchaseOrder>;
export type UpdatePurchaseOrderResponse = ApiResponse<PurchaseOrder>;
export type DeletePurchaseOrderResponse = ApiResponse<string>;
export type GetPurchaseOrderStatusesResponse = ApiResponse<PurchaseOrderStatusOption[]>;
export type GetPurchaseOrdersByStatusResponse = ApiResponse<PurchaseOrder[]>;
export type GetPurchaseOrdersBySupplierResponse = ApiResponse<PurchaseOrder[]>;
export type ReceivePurchaseOrderResponse = ApiResponse<PurchaseOrder>;
export type PartialOrderResponse = ApiResponse<PurchaseOrder>;

export interface PurchaseOrderTimelineEvent {
  occurredAt: string;
  eventType: 'Created' | 'GoodsReceived' | 'Payment' | 'Cancelled' | string;
  title: string;
  description: string;
  amount?: number | null;
  quantity?: number | null;
  referenceNumber?: string | null;
}

export type GetPurchaseOrderTimelineResponse = ApiResponse<PurchaseOrderTimelineEvent[]>;
