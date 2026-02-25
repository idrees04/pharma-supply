import { get, post, put, RequestConfig } from '@/api/requests';
import {
    AccountDto,
    AccountBalanceDto,
    CreateAccountRequest,
    UpdateAccountRequest,
    GetAccountsResponse,
    GetAccountResponse,
    CreateAccountResponse,
    UpdateAccountResponse,
    GetAccountBalancesResponse,
} from '@/types/api/accounts';
import { useGetQuery, usePostMutation, usePutMutation } from '@/api/hooks';
import { useQueryClient } from '@tanstack/react-query';

export const accountService = {
    /**
     * Get all accounts
     */
    getAccounts: async (config?: RequestConfig): Promise<AccountDto[]> => {
        const response = await get<GetAccountsResponse>('/api/Accounts', config);
        return response.data;
    },

    /**
     * Get a single account by ID
     */
    getAccount: async (id: number, config?: RequestConfig): Promise<AccountDto> => {
        const response = await get<GetAccountResponse>(`/api/Accounts/${id}`, config);
        return response.data;
    },

    /**
     * Create a new account
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
     * Update an existing account
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
     * Get account balances summary
     */
    getAccountBalances: async (config?: RequestConfig): Promise<AccountBalanceDto[]> => {
        const response = await get<GetAccountBalancesResponse>('/api/Accounts/balances', config);
        return response.data;
    },
};

/**
 * Custom Hooks for Accounts
 */

export function useAccountList() {
    return useGetQuery<AccountDto[]>(
        ['accounts'],
        () => accountService.getAccounts(),
        {
            staleTime: 5 * 60 * 1000,
        }
    );
}

export function useAccount(id: number | null) {
    return useGetQuery<AccountDto>(
        ['accounts', id],
        () => accountService.getAccount(id!),
        {
            enabled: id !== null,
        }
    );
}

export function useCreateAccount() {
    const queryClient = useQueryClient();
    return usePostMutation<AccountDto, CreateAccountRequest>(
        (data) => accountService.createAccount(data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['accounts'] });
            },
        }
    );
}

export function useUpdateAccount(id: number) {
    const queryClient = useQueryClient();
    return usePutMutation<AccountDto, UpdateAccountRequest>(
        (data) => accountService.updateAccount(id, data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['accounts'] });
                queryClient.invalidateQueries({ queryKey: ['accounts', id] });
            },
        }
    );
}

export function useAccountBalances() {
    return useGetQuery<AccountBalanceDto[]>(
        ['accounts', 'balances'],
        () => accountService.getAccountBalances(),
        {
            staleTime: 5 * 60 * 1000,
        }
    );
}
