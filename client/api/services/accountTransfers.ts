import { get, post, deleteRequest, RequestConfig } from '@/api/requests';
import {
    AccountTransferDto,
    CreateAccountTransferRequest,
    AccountTransferListQueryParams,
    GetAccountTransfersResponse,
    GetAccountTransferResponse,
    CreateAccountTransferResponse,
    DeleteAccountTransferResponse,
} from '@/types/api/accountTransfers';
import { PaginatedResponse } from '@/types/api/common';

export const accountTransferService = {
    /**
     * Get all account transfers with pagination
     */
    getAccountTransfers: async (
        params?: AccountTransferListQueryParams,
        config?: RequestConfig
    ): Promise<PaginatedResponse<AccountTransferDto>> => {
        const queryParams = new URLSearchParams();

        if (params) {
            if (params.pageNumber !== undefined) queryParams.append('PageNumber', params.pageNumber.toString());
            if (params.pageSize !== undefined) queryParams.append('PageSize', params.pageSize.toString());
            if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);
            if (params.sortBy) queryParams.append('SortBy', params.sortBy);
            if (params.sortDescending !== undefined) queryParams.append('SortDescending', params.sortDescending.toString());
        }

        const url = `/api/AccountTransfers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await get<GetAccountTransfersResponse>(url, config);
        return response.data;
    },

    /**
     * Get a single account transfer by ID
     */
    getAccountTransfer: async (id: number, config?: RequestConfig): Promise<AccountTransferDto> => {
        const response = await get<GetAccountTransferResponse>(`/api/AccountTransfers/${id}`, config);
        return response.data;
    },

    /**
     * Create a new account transfer
     */
    createAccountTransfer: async (
        data: CreateAccountTransferRequest,
        config?: RequestConfig
    ): Promise<AccountTransferDto> => {
        const response = await post<CreateAccountTransferResponse, CreateAccountTransferRequest>(
            '/api/AccountTransfers',
            data,
            config
        );
        return response.data;
    },

    /**
     * Delete an account transfer
     */
    deleteAccountTransfer: async (id: number, config?: RequestConfig): Promise<void> => {
        await deleteRequest<DeleteAccountTransferResponse>(`/api/AccountTransfers/${id}`, config);
    },
};