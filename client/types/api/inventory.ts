import { ApiResponse, PaginatedResponse } from './common';

// Enums
export enum BatchStatus {
    Active = 1,
    Expired = 2,
    Dispatched = 3,
    Returned = 4,
    Damaged = 5,
}

// DTOs
export interface InventoryStockDto {
    id: number;
    productId: number;
    productName: string | null;
    productCode: string | null;
    availableQuantity: number;
    reservedQuantity: number;
    totalQuantity: number;
    averageCost: number;
    totalValue: number;
    lastRestockedDate: string | null;
    lastDispatchedDate: string | null;
}

export interface ProductBatchDto {
    id: number;
    productId: number;
    productName: string | null;
    productCode: string | null;
    batchNumber: string | null;
    manufactureDate: string | null;
    expiryDate: string | null;
    receivedQuantity: number;
    currentQuantity: number;
    dispatchedQuantity: number;
    purchaseRate: number;
    purchaseOrderId: number | null;
    receivedDate: string; // ISO date
    status: BatchStatus;
    notes: string | null;
}

// Request DTOs
export interface CreateProductBatchRequest {
    productId: number;
    batchNumber?: string | null;
    manufactureDate?: string | null;
    expiryDate?: string | null;
    receivedQuantity: number;
    purchaseRate: number;
    purchaseOrderId?: number | null;
    notes?: string | null;
}

export interface UpdateInventoryStockRequest {
    quantity: number;
    notes?: string | null;
}

// Query parameters
export interface InventoryListQueryParams {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    sortBy?: string;
    sortDescending?: boolean;
}

// Response types
export type GetInventoryStocksResponse = ApiResponse<PaginatedResponse<InventoryStockDto>>;
export type GetInventoryBatchesResponse = ApiResponse<PaginatedResponse<ProductBatchDto>>;
export type GetExpiringBatchesResponse = ApiResponse<ProductBatchDto[]>;
export type CreateProductBatchResponse = ApiResponse<ProductBatchDto>;
export type UpdateInventoryStockResponse = ApiResponse<InventoryStockDto>;

export interface InventoryStockLedgerDto {
    stock: InventoryStockDto;
    batches: ProductBatchDto[];
    movements: InventoryStockMovementDto[];
}

export type GetInventoryStockLedgerResponse = ApiResponse<InventoryStockLedgerDto>;

export enum InventoryMovementType {
    Receipt = 1,
    Dispatch = 2,
    Adjustment = 3,
}

export interface InventoryStockMovementDto {
    movementDate: string;
    type: InventoryMovementType;
    quantityIn: number;
    quantityOut: number;
    purchaseOrderId: number | null;
    deliveryChallanId: number | null;
    productBatchId: number | null;
    batchNumber: string | null;
    notes: string | null;
}