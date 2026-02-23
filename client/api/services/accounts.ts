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