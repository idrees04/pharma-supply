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
} from '@/types/api/payments';
import { PaginatedResponse } from '@/types/api/common';

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
};