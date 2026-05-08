import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { invoiceService } from '@/api/services/invoices';
import { ApiError } from '@/api/errors';
import type {
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  CreateInvoiceFromSupplyOrderRequest,
  CreateInvoiceFromSupplyOrderResponse,
  GetInvoiceResponse,
  GetInvoicesResponse,
  GetOutstandingInvoicesResponse,
  GetOverdueInvoicesResponse,
  InvoiceDto,
  InvoiceListQueryParams,
  ProcessInvoicePaymentRequest,
  ProcessInvoicePaymentResponse,
} from '@/types/api/invoices';
import { accountKeys } from '@/api/services/accounts';

const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (params: InvoiceListQueryParams) => [...invoiceKeys.lists(), params] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: number) => [...invoiceKeys.details(), id] as const,
  outstanding: () => [...invoiceKeys.all, 'outstanding'] as const,
  overdue: () => [...invoiceKeys.all, 'overdue'] as const,
  bySupplyOrder: (supplyOrderId: number) => [...invoiceKeys.all, 'by-supply-order', supplyOrderId] as const,
};

export function useInvoices(
  params: InvoiceListQueryParams,
  options?: Omit<UseQueryOptions<GetInvoicesResponse, ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: () => invoiceService.getAll(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.statusCode < 500 && !error.isRetryable) {
        return false;
      }
      return failureCount < 3;
    },
    ...options,
  });
}

export function useInvoicesBySupplyOrder(
  supplyOrderId: number | null,
  options?: Omit<UseQueryOptions<InvoiceDto[], ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: supplyOrderId ? invoiceKeys.bySupplyOrder(supplyOrderId) : ['invoices', 'by-supply-order', 'none'],
    queryFn: () => invoiceService.getBySupplyOrder(supplyOrderId!),
    enabled: supplyOrderId !== null && supplyOrderId > 0,
    staleTime: 60 * 1000,
    ...options,
  });
}

export function useInvoice(
  id: number | null,
  options?: Omit<UseQueryOptions<GetInvoiceResponse, ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: invoiceKeys.detail(id || 0),
    queryFn: () => invoiceService.getById(id!),
    enabled: id !== null && id > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

export function useOutstandingInvoices(
  options?: Omit<UseQueryOptions<GetOutstandingInvoicesResponse, ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: invoiceKeys.outstanding(),
    queryFn: () => invoiceService.getOutstanding(),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

export function useOverdueInvoices(
  options?: Omit<UseQueryOptions<GetOverdueInvoicesResponse, ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: invoiceKeys.overdue(),
    queryFn: () => invoiceService.getOverdue(),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

export function useCreateInvoice(
  options?: Omit<UseMutationOptions<CreateInvoiceResponse, ApiError, CreateInvoiceRequest>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvoiceRequest) => invoiceService.create(data),
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.outstanding() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.overdue() });
      options?.onSuccess?.(data, variables, context, mutation);
    },
    ...options,
  });
}

export function useProcessInvoicePayment(
  invoiceId: number,
  options?: Omit<
    UseMutationOptions<ProcessInvoicePaymentResponse, ApiError, ProcessInvoicePaymentRequest>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  const userOnSuccess = options?.onSuccess;

  return useMutation({
    ...options,
    mutationFn: (data: ProcessInvoicePaymentRequest) => invoiceService.processPayment(invoiceId, data),
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: accountKeys.balances() });
      userOnSuccess?.(data, variables, context, mutation);
    },
  });
}

export function useCreateInvoiceFromSupplyOrder(
  options?: Omit<
    UseMutationOptions<
      CreateInvoiceFromSupplyOrderResponse,
      ApiError,
      { supplyOrderId: number; data: CreateInvoiceFromSupplyOrderRequest }
    >,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ supplyOrderId, data }: { supplyOrderId: number; data: CreateInvoiceFromSupplyOrderRequest }) =>
      invoiceService.createFromSupplyOrder(supplyOrderId, data),
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.outstanding() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.overdue() });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.bySupplyOrder(variables.supplyOrderId),
      });
      options?.onSuccess?.(data, variables, context, mutation);
    },
    ...options,
  });
}

export { invoiceKeys };
