import { ApiResponse, PaginatedResponse } from './common';
import type { PaymentDto } from './payments';

/** Must stay in sync with `InvoiceStatus` in `Backend/MDS/MDS.Dal/Entities/Invoice.cs`. */
export enum InvoiceStatus {
    Draft = 1,
    Generated = 2,
    Sent = 3,
    PartiallyPaid = 4,
    Paid = 5,
    Overdue = 6,
    Cancelled = 7,
    Refunded = 8,
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
    hospitalRegistrationNumber?: string | null;
    hospitalAddress?: string | null;
    hospitalPhone?: string | null;
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
    /** Hospital AR before this invoice's remaining ex-tax due. */
    previousBalance?: number;
    /** Current total hospital outstanding (ex-tax receivable). */
    hospitalOutstandingBalance?: number;
    /** Cumulative hospital / late-delivery deduction; reduces ex-tax collectible. */
    lateDeliveryDeduction?: number;
    /** TotalAmount − TaxAmount − LateDeliveryDeduction (supplier cash expectation). */
    taxExclusiveCollectibleAmount?: number;
    /** Display-only: Σ (line net ex tax − qty × standard purchase rate). */
    estimatedContributionMargin?: number | null;
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
    /** API model requires non-empty notes */
    notes: string;
    /** API model requires non-empty terms */
    termsAndConditions: string;
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
  /** Cumulative deduction on the invoice; optional — omit to leave unchanged. */
  lateDeliveryDeduction?: number | null;
  paymentDate?: string | null;
  paymentMode: number;
  referenceNumber?: string | null;
  notes?: string | null;
}

export type ProcessInvoicePaymentResponse = ApiResponse<PaymentDto>;
