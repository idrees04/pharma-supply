import { useQueryClient } from '@tanstack/react-query';
import { useGetQuery, usePostMutation } from '@/api/hooks';
import { invoiceService } from '@/api/services/invoices';
import {
    InvoiceDto,
    CreateInvoiceRequest,
    InvoiceListQueryParams,
} from '@/types/api/invoices';
import { PaginatedResponse } from '@/types/api/common';

export function useInvoices(params?: InvoiceListQueryParams) {
    return useGetQuery<PaginatedResponse<InvoiceDto>>(
        ['invoices', params],
        () => invoiceService.getInvoices(params),
        {
            staleTime: 5 * 60 * 1000,
        }
    );
}

export function useInvoice(id: number | null) {
    return useGetQuery<InvoiceDto>(
        ['invoices', id],
        () => invoiceService.getInvoice(id!),
        {
            enabled: id !== null,
        }
    );
}

export function useOutstandingInvoices() {
    return useGetQuery<InvoiceDto[]>(
        ['invoices', 'outstanding'],
        () => invoiceService.getOutstandingInvoices(),
        {
            staleTime: 2 * 60 * 1000,
        }
    );
}

export function useOverdueInvoices() {
    return useGetQuery<InvoiceDto[]>(
        ['invoices', 'overdue'],
        () => invoiceService.getOverdueInvoices(),
        {
            staleTime: 2 * 60 * 1000,
        }
    );
}

export function useCreateInvoice() {
    const queryClient = useQueryClient();

    return usePostMutation<InvoiceDto, CreateInvoiceRequest>(
        (data) => invoiceService.createInvoice(data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['invoices'] });
                queryClient.invalidateQueries({ queryKey: ['invoices', 'outstanding'] });
                queryClient.invalidateQueries({ queryKey: ['invoices', 'overdue'] });
            },
        }
    );
}