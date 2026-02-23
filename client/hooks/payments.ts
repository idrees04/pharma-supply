import { useQueryClient } from '@tanstack/react-query';
import { useGetQuery, usePostMutation, usePutMutation, useDeleteMutation } from '@/api/hooks';
import { paymentService } from '@/api/services/payments';
import {
    PaymentDto,
    CreatePaymentRequest,
    UpdatePaymentRequest,
    PaymentListQueryParams,
} from '@/types/api/payments';
import { PaginatedResponse } from '@/types/api/common';

export function usePayments(params?: PaymentListQueryParams) {
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
                // Also invalidate related invoices/purchase orders if needed
            },
        }
    );
}

export function useUpdatePayment(id: number) {
    const queryClient = useQueryClient();

    return usePutMutation<PaymentDto, UpdatePaymentRequest>(
        (data) => paymentService.updatePayment(id, data),
        {
            onSuccess: (updated) => {
                queryClient.setQueryData(['payments', id], updated);
                queryClient.invalidateQueries({ queryKey: ['payments'] });
            },
        }
    );
}

export function useDeletePayment() {
    const queryClient = useQueryClient();

    return useDeleteMutation(
        (id: number) => paymentService.deletePayment(id),
        {
            onSuccess: (_, id) => {
                queryClient.removeQueries({ queryKey: ['payments', id] });
                queryClient.invalidateQueries({ queryKey: ['payments'] });
            },
        }
    );
}