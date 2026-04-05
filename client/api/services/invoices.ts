import { get, post } from '@/api/requests';
import type {
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  GetInvoiceResponse,
  GetInvoicesResponse,
  GetOutstandingInvoicesResponse,
  GetOverdueInvoicesResponse,
  InvoiceListQueryParams,
} from '@/types/api/invoices';

class InvoiceService {
  async getAll(params?: InvoiceListQueryParams): Promise<GetInvoicesResponse> {
    const queryString = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, value]) => value !== undefined && value !== '')
            .map(([key, value]) => [key, String(value)]),
        ).toString()
      : '';

    const url = `/api/Invoices${queryString ? `?${queryString}` : ''}`;
    return get<GetInvoicesResponse>(url);
  }

  async getById(id: number): Promise<GetInvoiceResponse> {
    return get<GetInvoiceResponse>(`/api/Invoices/${id}`);
  }

  async create(data: CreateInvoiceRequest): Promise<CreateInvoiceResponse> {
    return post<CreateInvoiceResponse, CreateInvoiceRequest>('/api/Invoices', data);
  }

  async getOutstanding(): Promise<GetOutstandingInvoicesResponse> {
    return get<GetOutstandingInvoicesResponse>('/api/Invoices/outstanding');
  }

  async getOverdue(): Promise<GetOverdueInvoicesResponse> {
    return get<GetOverdueInvoicesResponse>('/api/Invoices/overdue');
  }
}

export const invoiceService = new InvoiceService();

export type { InvoiceListQueryParams, CreateInvoiceRequest };
