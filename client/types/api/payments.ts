import { ApiResponse, PaginatedResponse } from './common';

// Enums
export enum PaymentType {
    Incoming = 1, // from hospitals
    Outgoing = 2, // to suppliers
}

export enum PaymentMode {
    Cash = 1,
    Cheque = 2,
    BankTransfer = 3,
    CreditCard = 4,
    DebitCard = 5,
}

export enum PaymentStatus {
    Pending = 1,
    Completed = 2,
    Failed = 3,
    Cancelled = 4,
    Refunded = 5,
}

// DTOs
export interface PaymentDto {
    id: number;
    paymentNumber: string | null;
    paymentDate: string; // ISO date
    paymentType: PaymentType;
    invoiceId: number | null;
    invoiceNumber: string | null;
    purchaseOrderId: number | null;
    purchaseOrderNumber: string | null;
    hospitalId: number | null;
    hospitalName: string | null;
    supplierId: number | null;
    supplierName: string | null;
    amount: number;
    paymentMode: PaymentMode;
    accountId: number;
    accountName: string | null;
    referenceNumber: string | null;
    notes: string | null;
    isActive: boolean;
}

// Request DTOs
export interface CreatePaymentRequest {
    paymentDate: string; // ISO date
    paymentType: PaymentType;
    invoiceId?: number | null;
    purchaseOrderId?: number | null;
    amount: number;
    paymentMode: PaymentMode;
    accountId: number;
    referenceNumber?: string | null;
    notes?: string | null;
}

export interface UpdatePaymentRequest {
    paymentDate?: string;
    paymentMode?: PaymentMode;
    accountId?: number;
    referenceNumber?: string | null;
    notes?: string | null;
}

// Query parameters
export interface PaymentListQueryParams {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    sortBy?: string;
    sortDescending?: boolean;
}

// Suggested Payment Types
export interface SuggestedPaymentData {
    purchaseOrderId: number;
    purchaseOrderNumber: string | null;
    agreedOrderTotal: number;
    goodsReceivedValue: number;
    previouslyPaidAmount: number;
    totalOutstanding: number;
    suggestedPayableAmount: number;
}

export interface SuggestedPaymentResponse {
    success: boolean;
    message: string | null;
    data: SuggestedPaymentData;
    errors: any | null;
    timestamp: string;
}

// Purchase Order Payment Types
export interface ProcessPaymentRequest {
    accountId: number;
    amount: number;
    paymentDate?: string | null; // ISO date-time, nullable
    paymentMode: PaymentMode; // Enum 1-5
    referenceNumber?: string | null;
    notes?: string | null;
}

export interface ProcessPaymentResponseData {
    paymentId: number;
    paymentNumber: string | null;
    purchaseOrderId: number;
    amountPaid: number;
    newPaidAmount: number;
    newOutstandingAmount: number;
    newStatus: number; // Status enum (2..9)
}

export interface ProcessPaymentApiResponse {
    success: boolean;
    message: string | null;
    data: ProcessPaymentResponseData;
    errors: any | null;
    timestamp: string;
}

// Response types
export type GetPaymentsResponse = ApiResponse<PaginatedResponse<PaymentDto>>;
export type GetPaymentResponse = ApiResponse<PaymentDto>;
export type CreatePaymentResponse = ApiResponse<PaymentDto>;
export type UpdatePaymentResponse = ApiResponse<PaymentDto>;
export type DeletePaymentResponse = ApiResponse<null>;
