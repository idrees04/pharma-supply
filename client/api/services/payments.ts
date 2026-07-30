import { get, post, put, deleteRequest, RequestConfig } from '@/api/requests';
import {
    PaymentDto,
    CreatePaymentRequest,
    UpdatePaymentRequest,
    PaymentListQueryParams,
    GetPaymentsResponse,
    GetPaymentResponse,
    CreatePaymentResponse,
    UpdatePaymentResponse,
    DeletePaymentResponse,
    OpeningBalanceSettlementRequest,
    OpeningBalanceSuggestionDto,
} from '@/types/api/payments';
import { PaginatedResponse, ApiResponse } from '@/types/api/common';
import { useGetQuery, usePostMutation, usePutMutation, useDeleteMutation } from '@/api/hooks';
import { useQueryClient } from '@tanstack/react-query';

export const paymentService = {
    /**
     * Get all payments with pagination
     */
    getPayments: async (
        params?: PaymentListQueryParams,
        config?: RequestConfig
    ): Promise<PaginatedResponse<PaymentDto>> => {
        const queryParams = new URLSearchParams();

        if (params) {
            if (params.pageNumber !== undefined) queryParams.append('PageNumber', params.pageNumber.toString());
            if (params.pageSize !== undefined) queryParams.append('PageSize', params.pageSize.toString());
            if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);
            if (params.sortBy) queryParams.append('SortBy', params.sortBy);
            if (params.sortDescending !== undefined) queryParams.append('SortDescending', params.sortDescending.toString());
        }

        const url = `/api/Payments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await get<GetPaymentsResponse>(url, config);
        return response.data;
    },

    /**
     * Get a single payment by ID
     */
    getPayment: async (id: number, config?: RequestConfig): Promise<PaymentDto> => {
        const response = await get<GetPaymentResponse>(`/api/Payments/${id}`, config);
        return response.data;
    },

    /**
     * Create a new payment
     */
    createPayment: async (
        data: CreatePaymentRequest,
        config?: RequestConfig
    ): Promise<PaymentDto> => {
        const response = await post<CreatePaymentResponse, CreatePaymentRequest>(
            '/api/Payments',
            data,
            config
        );
        return response.data;
    },

    /**
     * Update a payment
     */
    updatePayment: async (
        id: number,
        data: UpdatePaymentRequest,
        config?: RequestConfig
    ): Promise<PaymentDto> => {
        const response = await put<UpdatePaymentResponse, UpdatePaymentRequest>(
            `/api/Payments/${id}`,
            data,
            config
        );
        return response.data;
    },

    /**
     * Delete a payment
     */
    deletePayment: async (id: number, config?: RequestConfig): Promise<void> => {
        await deleteRequest<DeletePaymentResponse>(`/api/Payments/${id}`, config);
    },

    getOpeningBalanceSuggestion: async (
        partyType: number,
        partyId: number,
        config?: RequestConfig
    ): Promise<OpeningBalanceSuggestionDto> => {
        const response = await get<ApiResponse<OpeningBalanceSuggestionDto>>(
            `/api/Payments/opening-balance-suggestion?partyType=${partyType}&partyId=${partyId}`,
            config
        );
        return response.data;
    },

    settleOpeningBalance: async (
        data: OpeningBalanceSettlementRequest,
        config?: RequestConfig
    ): Promise<PaymentDto> => {
        const response = await post<CreatePaymentResponse, OpeningBalanceSettlementRequest>(
            '/api/Payments/opening-balance',
            data,
            config
        );
        return response.data;
    },
};

/**
 * Custom Hooks for Payments
 */

export function usePaymentList(params?: PaymentListQueryParams) {
    return useGetQuery<PaginatedResponse<PaymentDto>>(
        ['payments', params],
        () => paymentService.getPayments(params),
        {
            staleTime: 5 * 60 * 1000,
        }
    );
}

export function usePayment(id: number | null) {
    return useGetQuery<PaymentDto>(
        ['payments', id],
        () => paymentService.getPayment(id!),
        {
            enabled: id !== null,
        }
    );
}

export function useCreatePayment() {
    const queryClient = useQueryClient();
    return usePostMutation<PaymentDto, CreatePaymentRequest>(
        (data) => paymentService.createPayment(data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['payments'] });
            },
        }
    );
}

export function useUpdatePayment(id: number) {
    const queryClient = useQueryClient();
    return usePutMutation<PaymentDto, UpdatePaymentRequest>(
        (data) => paymentService.updatePayment(id, data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['payments'] });
                queryClient.invalidateQueries({ queryKey: ['payments', id] });
            },
        }
    );
}

export function useDeletePayment() {
    const queryClient = useQueryClient();
    return useDeleteMutation(
        (id: number) => paymentService.deletePayment(id),
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['payments'] });
            },
        }
    );
}

export function useOpeningBalanceSuggestion(partyType: number | null, partyId: number | null) {
    return useGetQuery<OpeningBalanceSuggestionDto>(
        ['payments', 'opening-balance-suggestion', partyType, partyId],
        () => paymentService.getOpeningBalanceSuggestion(partyType!, partyId!),
        {
            enabled: partyType != null && partyId != null && partyId > 0,
            staleTime: 30 * 1000,
        }
    );
}

export function useSettleOpeningBalance() {
    const queryClient = useQueryClient();
    return usePostMutation<PaymentDto, OpeningBalanceSettlementRequest>(
        (data) => paymentService.settleOpeningBalance(data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['payments'] });
                queryClient.invalidateQueries({ queryKey: ['hospitals'] });
                queryClient.invalidateQueries({ queryKey: ['suppliers'] });
                queryClient.invalidateQueries({ queryKey: ['accounts'] });
            },
        }
    );
}
