/**
 * Delivery Challan API Types
 *
 * Type definitions for all Delivery Challan API endpoints.
 */

import { ApiResponse } from './common';

/**
 * Status enum for Delivery Challan
 */
export enum DeliveryChallanStatus {
  Draft = 1,
  Dispatched = 2,
  Delivered = 3,
}

/**
 * Delivery Challan Item entity
 */
export interface DeliveryChallanItem {
  id: number;
  supplyOrderItemId: number;
  productId: number;
  productName: string | null;
  quantityDispatched: number;
  productBatchId: number | null;
  batchNumber: string | null;
  batchExpiryDate: string | null; // ISO date-time
}

/**
 * Delivery Challan entity
 */
export interface DeliveryChallan {
  id: number;
  supplyOrderId: number;
  supplyOrderNumber: string | null;
  challanNumber: string | null;
  dispatchDate: string; // ISO date-time
  status: DeliveryChallanStatus;
  notes: string | null;
  items: DeliveryChallanItem[];
}

/**
 * Response types
 */
export type GetDeliveryChallanResponse = ApiResponse<DeliveryChallan>;
