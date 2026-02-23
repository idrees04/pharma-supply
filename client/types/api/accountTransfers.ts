import { ApiResponse, PaginatedResponse } from './common';

// Enums (if needed)
export enum TransferStatus {
    Pending = 1,
    Completed = 2,
    Cancelled = 3,
    Failed = 4,
}

// DTOs
export interface AccountTransferDto {
    id: number;
    transferNumber: string | null;
    transferDate: string; // ISO date
    fromAccountId: number;
    fromAccountName: string | null;
    toAccountId: number;
    toAccountName: string | null;
    amount: number;
    referenceNumber: string | null;
    notes: string | null;
    isActive: boolean;
}

// Request DTOs
export interface CreateAccountTransferRequest {
    transferDate: string; // ISO date
    fromAccountId: number;
    toAccountId: number;
    amount: number;
    referenceNumber?: string | null;
    notes?: string | null;
}

// Query parameters
export interface AccountTransferListQueryParams {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    sortBy?: string;
    sortDescending?: boolean;
}

// Response types
export type GetAccountTransfersResponse = ApiResponse<PaginatedResponse<AccountTransferDto>>;
export type GetAccountTransferResponse = ApiResponse<AccountTransferDto>;
export type CreateAccountTransferResponse = ApiResponse<AccountTransferDto>;
export type DeleteAccountTransferResponse = ApiResponse<null>; // ObjectResponseWrapper -> data = null