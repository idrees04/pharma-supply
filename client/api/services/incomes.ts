import { get, post, put, deleteRequest, RequestConfig } from '@/api/requests';
import type { PaginatedResponse } from '@/types/api/common';
import {
  IncomeDto,
  CreateIncomeRequest,
  UpdateIncomeRequest,
  IncomeListQueryParams,
  GetIncomesResponse,
  GetIncomeResponse,
  CreateIncomeResponse,
  UpdateIncomeResponse,
  DeleteIncomeResponse,
  GetIssuedIncomeVouchersResponse,
  GetIncomeVoucherPrintResponse,
  IssueIncomeVoucherResponse,
  IssueIncomeVoucherRequest,
  IncomeVoucherPrintDto,
} from '@/types/api/incomes';
import { useGetQuery, usePostMutation, usePutMutation, useDeleteMutation } from '@/api/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { accountKeys } from '@/api/services/accounts';

export const incomeService = {
  getIncomes: async (
    params?: IncomeListQueryParams,
    config?: RequestConfig
  ): Promise<PaginatedResponse<IncomeDto>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.pageNumber !== undefined) queryParams.append('PageNumber', String(params.pageNumber));
      if (params.pageSize !== undefined) queryParams.append('PageSize', String(params.pageSize));
      if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);
      if (params.sortBy) queryParams.append('SortBy', params.sortBy);
      if (params.sortDescending !== undefined) queryParams.append('SortDescending', String(params.sortDescending));
    }
    const url = `/api/Incomes${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await get<GetIncomesResponse>(url, config);
    return response.data;
  },

  getIncome: async (id: number, config?: RequestConfig): Promise<IncomeDto> => {
    const response = await get<GetIncomeResponse>(`/api/Incomes/${id}`, config);
    return response.data;
  },

  /** Backend may return null data with Created message — treat as success without entity */
  createIncome: async (data: CreateIncomeRequest, config?: RequestConfig): Promise<IncomeDto | null> => {
    const response = await post<CreateIncomeResponse, CreateIncomeRequest>('/api/Incomes', data, config);
    return response.data ?? null;
  },

  updateIncome: async (id: number, data: UpdateIncomeRequest, config?: RequestConfig): Promise<IncomeDto | null> => {
    const response = await put<UpdateIncomeResponse, UpdateIncomeRequest>(`/api/Incomes/${id}`, data, config);
    return response.data ?? null;
  },

  deleteIncome: async (id: number, config?: RequestConfig): Promise<void> => {
    await deleteRequest<DeleteIncomeResponse>(`/api/Incomes/${id}`, config);
  },

  getIssuedVouchers: async (config?: RequestConfig): Promise<IncomeDto[]> => {
    const response = await get<GetIssuedIncomeVouchersResponse>('/api/Incomes/vouchers/issued', config);
    return response.data;
  },

  getVoucherForPrint: async (id: number, config?: RequestConfig): Promise<IncomeVoucherPrintDto> => {
    const response = await get<GetIncomeVoucherPrintResponse>(`/api/Incomes/${id}/voucher-for-print`, config);
    return response.data;
  },

  issueVoucher: async (id: number, data: IssueIncomeVoucherRequest, config?: RequestConfig): Promise<IncomeDto> => {
    const response = await post<IssueIncomeVoucherResponse, IssueIncomeVoucherRequest>(
      `/api/Incomes/${id}/issue-voucher`,
      data,
      config
    );
    return response.data;
  },
};

const incomeKeys = {
  all: ['incomes'] as const,
  list: (p: IncomeListQueryParams | undefined) => [...incomeKeys.all, 'list', p] as const,
  detail: (id: number) => [...incomeKeys.all, id] as const,
  issued: () => [...incomeKeys.all, 'vouchers', 'issued'] as const,
  print: (id: number) => [...incomeKeys.all, 'voucher-print', id] as const,
};

export function useIncomeList(params?: IncomeListQueryParams) {
  return useGetQuery<PaginatedResponse<IncomeDto>>(
    incomeKeys.list(params),
    () => incomeService.getIncomes(params),
    { staleTime: 60 * 1000 }
  );
}

export function useIncome(id: number | null) {
  return useGetQuery<IncomeDto>(incomeKeys.detail(id ?? 0), () => incomeService.getIncome(id!), {
    enabled: id !== null && id > 0,
  });
}

export function useIssuedVoucherIncomes() {
  return useGetQuery<IncomeDto[]>(incomeKeys.issued(), () => incomeService.getIssuedVouchers(), {
    staleTime: 60 * 1000,
  });
}

export function useIncomeVoucherPrint(id: number | null) {
  return useGetQuery<IncomeVoucherPrintDto>(incomeKeys.print(id ?? 0), () => incomeService.getVoucherForPrint(id!), {
    enabled: id !== null && id > 0,
  });
}

export function useCreateIncome() {
  const queryClient = useQueryClient();
  return usePostMutation<IncomeDto | null, CreateIncomeRequest>((data) => incomeService.createIncome(data), {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incomeKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.balances() });
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}

export function useUpdateIncome(id: number) {
  const queryClient = useQueryClient();
  return usePutMutation<IncomeDto | null, UpdateIncomeRequest>((data) => incomeService.updateIncome(id, data), {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incomeKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.balances() });
    },
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();
  return useDeleteMutation((incomeId: number) => incomeService.deleteIncome(incomeId), {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incomeKeys.all });
    },
  });
}

export type IssueIncomeVoucherPayload = { incomeId: number } & IssueIncomeVoucherRequest;

export function useIssueIncomeVoucher() {
  const queryClient = useQueryClient();
  return usePostMutation<IncomeDto, IssueIncomeVoucherPayload>(
    ({ incomeId, voucherTemplateKey }) => incomeService.issueVoucher(incomeId, { voucherTemplateKey }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: incomeKeys.all });
        queryClient.invalidateQueries({ queryKey: incomeKeys.issued() });
      },
    }
  );
}

export { incomeKeys };

