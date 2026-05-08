import { get, post } from '@/api/requests';
import type {
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  CreateInvoiceFromSupplyOrderRequest,
  CreateInvoiceFromSupplyOrderResponse,
  GetInvoiceResponse,
  GetInvoicesResponse,
  GetInvoicesBySupplyOrderResponse,
  GetOutstandingInvoicesResponse,
  GetOverdueInvoicesResponse,
  InvoiceDto,
  InvoiceListQueryParams,
  ProcessInvoicePaymentRequest,
  ProcessInvoicePaymentResponse,
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

  async getBySupplyOrder(supplyOrderId: number): Promise<InvoiceDto[]> {
    const response = await get<GetInvoicesBySupplyOrderResponse>(
      `/api/Invoices/by-supply-order/${supplyOrderId}`
    );
    return response.data;
  }

  async createFromSupplyOrder(
    supplyOrderId: number,
    data: CreateInvoiceFromSupplyOrderRequest
  ): Promise<CreateInvoiceFromSupplyOrderResponse> {
    return post<CreateInvoiceFromSupplyOrderResponse, CreateInvoiceFromSupplyOrderRequest>(
      `/api/Invoices/from-supply-order/${supplyOrderId}`,
      data
    );
  }

  async processPayment(
    invoiceId: number,
    data: ProcessInvoicePaymentRequest
  ): Promise<ProcessInvoicePaymentResponse> {
    return post<ProcessInvoicePaymentResponse, ProcessInvoicePaymentRequest>(
      `/api/Invoices/${invoiceId}/payments`,
      data
    );
  }
}

export const invoiceService = new InvoiceService();

export type { InvoiceListQueryParams, CreateInvoiceRequest };
