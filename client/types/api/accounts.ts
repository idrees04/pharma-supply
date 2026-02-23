import { ApiResponse } from './common';

// Enums (from spec)
export enum AccountType {
    Unknown = 0,
    Cash = 1,
    Bank = 2,
    // Add missing values as needed
}

export enum AccountStatus {
    Active = 1,
    Inactive = 2,
    Suspended = 3,
}

// DTOs
export interface AccountDto {
    id: number;
    accountName: string | null;
    accountType: AccountType;
    accountNumber: string | null;
    bankName: string | null;
    bankBranch: string | null;
    currentBalance: number;
    openingBalance: number;
    openingBalanceDate: string | null; // ISO date
    description: string | null;
    isActive: boolean;
}

export interface AccountBalanceDto {
    accountId: number;
    accountName: string | null;
    accountType: AccountType;
    currentBalance: number;
}

// Request DTOs
export interface CreateAccountRequest {
    accountName: string | null;
    accountType: AccountType;
    accountNumber?: string | null;
    bankName?: string | null;
    bankBranch?: string | null;
    openingBalance?: number;
    openingBalanceDate?: string | null; // ISO date
    description?: string | null;
}

export interface UpdateAccountRequest {
    accountName?: string | null;
    accountNumber?: string | null;
    bankName?: string | null;
    bankBranch?: string | null;
    description?: string | null;
    isActive?: boolean;
}

// Response types
export type GetAccountsResponse = ApiResponse<AccountDto[]>;
export type GetAccountResponse = ApiResponse<AccountDto>;
export type CreateAccountResponse = ApiResponse<AccountDto>;
export type UpdateAccountResponse = ApiResponse<AccountDto>;
export type GetAccountBalancesResponse = ApiResponse<AccountBalanceDto[]>;