import { get, post, RequestConfig } from '@/api/requests';
import {
    InvoiceDto,
    CreateInvoiceRequest,
    InvoiceListQueryParams,
    GetInvoicesResponse,
    GetInvoiceResponse,
    GetOutstandingInvoicesResponse,
    GetOverdueInvoicesResponse,
    CreateInvoiceResponse,
} from '@/types/api/invoices';
import { PaginatedResponse } from '@/types/api/common';

export const invoiceService = {
    /**
     * Get all invoices with pagination
     */
    getInvoices: async (
        params?: InvoiceListQueryParams,
        config?: RequestConfig
    ): Promise<PaginatedResponse<InvoiceDto>> => {
        const queryParams = new URLSearchParams();

        if (params) {
            if (params.pageNumber !== undefined) queryParams.append('PageNumber', params.pageNumber.toString());
            if (params.pageSize !== undefined) queryParams.append('PageSize', params.pageSize.toString());
            if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);
            if (params.sortBy) queryParams.append('SortBy', params.sortBy);
            if (params.sortDescending !== undefined) queryParams.append('SortDescending', params.sortDescending.toString());
        }

        const url = `/api/Invoices${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await get<GetInvoicesResponse>(url, config);
        return response.data;
    },

    /**
     * Get a single invoice by ID
     */
    getInvoice: async (id: number, config?: RequestConfig): Promise<InvoiceDto> => {
        const response = await get<GetInvoiceResponse>(`/api/Invoices/${id}`, config);
        return response.data;
    },

    /**
     * Create a new invoice
     */
    createInvoice: async (
        data: CreateInvoiceRequest,
        config?: RequestConfig
    ): Promise<InvoiceDto> => {
        const response = await post<CreateInvoiceResponse, CreateInvoiceRequest>(
            '/api/Invoices',
            data,
            config
        );
        return response.data;
    },

    /**
     * Get outstanding invoices
     */
    getOutstandingInvoices: async (config?: RequestConfig): Promise<InvoiceDto[]> => {
        const response = await get<GetOutstandingInvoicesResponse>('/api/Invoices/outstanding', config);
        return response.data;
    },

    /**
     * Get overdue invoices
     */
    getOverdueInvoices: async (config?: RequestConfig): Promise<InvoiceDto[]> => {
        const response = await get<GetOverdueInvoicesResponse>('/api/Invoices/overdue', config);
        return response.data;
    },
};