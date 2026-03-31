/**
 * Accounts Service & Hooks
 *
 * Service layer for the Accounts API module.
 * Provides CRUD operations and balance queries with proper
 * cache invalidation and optimistic update support.
 *
 * Endpoints:
 *   GET    /api/Accounts          — List all accounts
 *   POST   /api/Accounts          — Create account
 *   GET    /api/Accounts/{id}     — Get account by ID
 *   PUT    /api/Accounts/{id}     — Update account
 *   DELETE /api/Accounts/{id}     — Delete account
 *   GET    /api/Accounts/balances — Get balance summary
 */

import { get, post, put, deleteRequest, RequestConfig } from '@/api/requests';
import {
    AccountDto,
    AccountBalanceDto,
    CreateAccountRequest,
    UpdateAccountRequest,
    GetAccountsResponse,
    GetAccountResponse,
    CreateAccountResponse,
    UpdateAccountResponse,
    DeleteAccountResponse,
    GetAccountBalancesResponse,
} from '@/types/api/accounts';
import { useGetQuery, usePostMutation, usePutMutation, useDeleteMutation } from '@/api/hooks';
import { useQueryClient } from '@tanstack/react-query';

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const accountKeys = {
    all:      ['accounts'] as const,
    lists:    () => [...accountKeys.all, 'list'] as const,
    detail:   (id: number) => [...accountKeys.all, id] as const,
    balances: () => [...accountKeys.all, 'balances'] as const,
} as const;

// ─── Service Object ──────────────────────────────────────────────────────────

export const accountService = {
    /**
     * GET /api/Accounts — Fetch all accounts
     */
    getAccounts: async (config?: RequestConfig): Promise<AccountDto[]> => {
        const response = await get<GetAccountsResponse>('/api/Accounts', config);
        return response.data;
    },

    /**
     * GET /api/Accounts/{id} — Fetch a single account
     */
    getAccount: async (id: number, config?: RequestConfig): Promise<AccountDto> => {
        const response = await get<GetAccountResponse>(`/api/Accounts/${id}`, config);
        return response.data;
    },

    /**
     * POST /api/Accounts — Create a new account
     */
    createAccount: async (
        data: CreateAccountRequest,
        config?: RequestConfig
    ): Promise<AccountDto> => {
        const response = await post<CreateAccountResponse, CreateAccountRequest>(
            '/api/Accounts',
            data,
            config
        );
        return response.data;
    },

    /**
     * PUT /api/Accounts/{id} — Update an existing account
     */
    updateAccount: async (
        id: number,
        data: UpdateAccountRequest,
        config?: RequestConfig
    ): Promise<AccountDto> => {
        const response = await put<UpdateAccountResponse, UpdateAccountRequest>(
            `/api/Accounts/${id}`,
            data,
            config
        );
        return response.data;
    },

    /**
     * DELETE /api/Accounts/{id} — Delete an account
     */
    deleteAccount: async (id: number, config?: RequestConfig): Promise<void> => {
        await deleteRequest<DeleteAccountResponse>(`/api/Accounts/${id}`, config);
    },

    /**
     * GET /api/Accounts/balances — Get balance summary for all accounts
     */
    getAccountBalances: async (config?: RequestConfig): Promise<AccountBalanceDto[]> => {
        const response = await get<GetAccountBalancesResponse>('/api/Accounts/balances', config);
        return response.data;
    },
};

// ─── Custom Hooks ────────────────────────────────────────────────────────────

/**
 * useAccountList — Fetches all accounts
 *
 * Returns the full list from GET /api/Accounts.
 * Caches for 5 minutes. Auto-refetches on window focus.
 */
export function useAccountList() {
    return useGetQuery<AccountDto[]>(
        accountKeys.all,
        () => accountService.getAccounts(),
        { staleTime: 5 * 60 * 1000 }
    );
}

/**
 * useAccount — Fetches a single account by ID
 *
 * Conditionally enabled; pass `null` to skip the query.
 */
export function useAccount(id: number | null) {
    return useGetQuery<AccountDto>(
        accountKeys.detail(id ?? 0),
        () => accountService.getAccount(id!),
        { enabled: id !== null && id > 0 }
    );
}

/**
 * useAccountBalances — Fetches account balance summary
 *
 * GET /api/Accounts/balances
 */
export function useAccountBalances() {
    return useGetQuery<AccountBalanceDto[]>(
        accountKeys.balances(),
        () => accountService.getAccountBalances(),
        { staleTime: 5 * 60 * 1000 }
    );
}

/**
 * useCreateAccount — Creates a new account
 *
 * Invalidates the accounts list cache on success.
 */
export function useCreateAccount() {
    const queryClient = useQueryClient();
    return usePostMutation<AccountDto, CreateAccountRequest>(
        (data) => accountService.createAccount(data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: accountKeys.all });
                queryClient.invalidateQueries({ queryKey: accountKeys.balances() });
            },
        }
    );
}

/**
 * useUpdateAccount — Updates an existing account
 *
 * @param id — The account ID to update (bound at hook instantiation)
 */
export function useUpdateAccount(id: number) {
    const queryClient = useQueryClient();
    return usePutMutation<AccountDto, UpdateAccountRequest>(
        (data) => accountService.updateAccount(id, data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: accountKeys.all });
                queryClient.invalidateQueries({ queryKey: accountKeys.detail(id) });
                queryClient.invalidateQueries({ queryKey: accountKeys.balances() });
            },
        }
    );
}

/**
 * useDeleteAccount — Deletes an account
 *
 * The mutation accepts an account ID at call-site:
 *   deleteAccount(accountId);
 */
export function useDeleteAccount() {
    const queryClient = useQueryClient();
    return useDeleteMutation<void, number>(
        (id: number) => accountService.deleteAccount(id),
        {
            onSuccess: (_result, id) => {
                queryClient.removeQueries({ queryKey: accountKeys.detail(id) });
                queryClient.invalidateQueries({ queryKey: accountKeys.all });
                queryClient.invalidateQueries({ queryKey: accountKeys.balances() });
            },
        }
    );
}
