import { ApiResponse } from './common';

// ─── Enums ───────────────────────────────────────────────────────────────────

/**
 * Account type enum matching the API's integer-based codes.
 * API returns `accountType: 1` (Cash), `2` (Bank), etc.
 */
export enum AccountType {
    Cash = 1,
    Bank = 2,
}

/** Human-readable labels for AccountType */
export const AccountTypeLabels: Record<AccountType, string> = {
    [AccountType.Cash]: 'Cash',
    [AccountType.Bank]: 'Bank',
};

// ─── DTOs ────────────────────────────────────────────────────────────────────

/**
 * Account DTO — exact shape returned by:
 *   GET /api/Accounts
 *   GET /api/Accounts/{id}
 *   POST /api/Accounts (response)
 *   PUT /api/Accounts/{id} (response)
 */
export interface AccountDto {
    id: number;
    accountName: string;
    accountType: AccountType;
    accountNumber: string;
    bankName: string;
    bankBranch: string;
    currentBalance: number;
    openingBalance: number;
    openingBalanceDate: string;    // ISO 8601 date string
    description: string;
    isActive: boolean;
}

/**
 * Account Balance DTO — returned by:
 *   GET /api/Accounts/balances
 */
export interface AccountBalanceDto {
    accountId: number;
    accountName: string;
    accountType: AccountType;
    currentBalance: number;
}

// ─── Request DTOs ────────────────────────────────────────────────────────────

/**
 * Create Account Request — POST /api/Accounts
 *
 * Fields match the exact API contract:
 *   accountName, accountType, accountNumber, bankName,
 *   bankBranch, openingBalance, openingBalanceDate, description
 */
export interface CreateAccountRequest {
    accountName: string;
    accountType: AccountType;
    accountNumber: string;
    bankName: string;
    bankBranch: string;
    openingBalance: number;
    openingBalanceDate: string;    // ISO 8601 date string
    description: string;
}

/**
 * Update Account Request — PUT /api/Accounts/{id}
 *
 * Fields match the exact API contract:
 *   accountName, accountNumber, bankName, bankBranch, description, isActive
 *
 * Note: accountType, openingBalance, openingBalanceDate are NOT updatable
 */
export interface UpdateAccountRequest {
    accountName: string;
    accountNumber: string;
    bankName: string;
    bankBranch: string;
    description: string;
    isActive: boolean;
}

// ─── Response Types ──────────────────────────────────────────────────────────

export type GetAccountsResponse = ApiResponse<AccountDto[]>;
export type GetAccountResponse = ApiResponse<AccountDto>;
export type CreateAccountResponse = ApiResponse<AccountDto>;
export type UpdateAccountResponse = ApiResponse<AccountDto>;
export type DeleteAccountResponse = ApiResponse<string>;
export type GetAccountBalancesResponse = ApiResponse<AccountBalanceDto[]>;