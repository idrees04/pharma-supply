import { ApiResponse, PaginatedResponse } from './common';
import type { PaymentDto } from './payments';

// Enums
export enum InvoiceStatus {
    Draft = 1,
    Sent = 2,
    PartiallyPaid = 3,
    Paid = 4,
    Overdue = 5,
    Cancelled = 6,
    Refunded = 7,
    Disputed = 8,
}

// DTOs
export interface InvoiceItemDto {
    id: number;
    productId: number;
    productName: string | null;
    productBatchId: number | null;
    batchNumber: string | null;
    expiryDate: string | null;
    quantity: number;
    unitPrice: number;
    taxPercentage: number;
    taxAmount: number;
    discountPercentage: number;
    discountAmount: number;
    totalAmount: number;
}

export interface InvoiceDto {
    id: number;
    invoiceNumber: string | null;
    hospitalId: number;
    hospitalName: string | null;
    invoiceDate: string; // ISO date-time
    dueDate: string; // ISO date-time
    status: InvoiceStatus;
    subTotal: number;
    taxAmount: number;
    discountAmount: number;
    shippingCharges: number;
    adjustmentAmount: number;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    paymentReceivedDate: string | null; // ISO date-time
    supplyOrderId: number | null;
    deliveryChallanId: number | null;
    notes: string | null;
    termsAndConditions?: string | null;
    items?: InvoiceItemDto[] | null;
}

// Request DTOs
export interface CreateInvoiceItemRequest {
    productId: number;
    productBatchId?: number | null;
    quantity: number;
    unitPrice: number;
    taxPercentage: number;
    discountPercentage: number;
}

export interface CreateInvoiceRequest {
    hospitalId: number;
    invoiceDate: string; // ISO date-time
    dueDate: string; // ISO date-time
    shippingCharges?: number;
    adjustmentAmount?: number;
    notes?: string | null;
    termsAndConditions?: string | null;
    items?: CreateInvoiceItemRequest[] | null;
}

/**
 * Request for creating an invoice from a supply order
 * This endpoint creates an invoice directly from a supply order with optional delivery challan
 */
export interface CreateInvoiceFromSupplyOrderRequest {
    deliveryChallanId?: number | null;
    invoiceDate: string; // ISO date-time
    dueDate: string; // ISO date-time
    shippingCharges?: number;
    adjustmentAmount?: number;
    notes?: string | null;
    termsAndConditions?: string | null;
    lines?: CreateInvoiceLineItem[];
    salesTaxConfigurationId?: number | null;
}

/**
 * Line item for invoice creation from supply order
 */
export interface CreateInvoiceLineItem {
    supplyOrderItemId: number;
    quantity: number;
}

// Query parameters
export interface InvoiceListQueryParams {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    sortBy?: string;
    sortDescending?: boolean;
}

// Response types
export type InvoicePaginatedData = PaginatedResponse<InvoiceDto>;
export type GetInvoicesResponse = ApiResponse<PaginatedResponse<InvoiceDto>>;
export type GetInvoiceResponse = ApiResponse<InvoiceDto>;
export type GetOutstandingInvoicesResponse = ApiResponse<InvoiceDto[]>;
export type GetOverdueInvoicesResponse = ApiResponse<InvoiceDto[]>;
export type GetInvoicesBySupplyOrderResponse = ApiResponse<InvoiceDto[]>;
export type CreateInvoiceResponse = ApiResponse<InvoiceDto>;
export type CreateInvoiceFromSupplyOrderResponse = ApiResponse<InvoiceDto>;

/** POST /api/Invoices/{id}/payments */
export interface ProcessInvoicePaymentRequest {
  accountId: number;
  amount: number;
  paymentDate?: string | null;
  paymentMode: number;
  referenceNumber?: string | null;
  notes?: string | null;
}

export type ProcessInvoicePaymentResponse = ApiResponse<PaymentDto>;
