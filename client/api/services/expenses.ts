import { get, post, put, deleteRequest, RequestConfig } from '@/api/requests';
import type { ApiResponse } from '@/types/api/common';
import {
  ExpenseDto,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseListQueryParams,
  GetExpensesResponse,
  GetExpenseResponse,
  CreateExpenseResponse,
  UpdateExpenseResponse,
  DeleteExpenseResponse,
  GetIssuedVouchersResponse,
  GetIssuedVoucherGroupsResponse,
  GetVoucherPrintResponse,
  IssueVoucherResponse,
  IssueVoucherBatchResponse,
  IssueExpenseVoucherRequest,
  IssueExpenseVoucherBatchRequest,
  ExpenseVoucherPrintDto,
  ExpenseVoucherGroupDto,
  ExpenseVoucherBatchResultDto,
} from '@/types/api/expenses';
import { PaginatedResponse } from '@/types/api/common';
import { useGetQuery, usePostMutation, usePutMutation, useDeleteMutation } from '@/api/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { accountKeys } from '@/api/services/accounts';

export const expenseService = {
  getExpenses: async (
    params?: ExpenseListQueryParams,
    config?: RequestConfig
  ): Promise<PaginatedResponse<ExpenseDto>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.pageNumber !== undefined) queryParams.append('PageNumber', String(params.pageNumber));
      if (params.pageSize !== undefined) queryParams.append('PageSize', String(params.pageSize));
      if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);
      if (params.sortBy) queryParams.append('SortBy', params.sortBy);
      if (params.sortDescending !== undefined) queryParams.append('SortDescending', String(params.sortDescending));
    }
    const url = `/api/Expenses${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await get<GetExpensesResponse>(url, config);
    return response.data;
  },

  getExpense: async (id: number, config?: RequestConfig): Promise<ExpenseDto> => {
    const response = await get<GetExpenseResponse>(`/api/Expenses/${id}`, config);
    return response.data;
  },

  /** Backend may return null data with Created message — treat as success without entity */
  createExpense: async (
    data: CreateExpenseRequest,
    config?: RequestConfig
  ): Promise<ExpenseDto | null> => {
    const response = await post<CreateExpenseResponse, CreateExpenseRequest>('/api/Expenses', data, config);
    return response.data ?? null;
  },

  updateExpense: async (
    id: number,
    data: UpdateExpenseRequest,
    config?: RequestConfig
  ): Promise<ExpenseDto | null> => {
    const response = await put<UpdateExpenseResponse, UpdateExpenseRequest>(
      `/api/Expenses/${id}`,
      data,
      config
    );
    return response.data ?? null;
  },

  deleteExpense: async (id: number, config?: RequestConfig): Promise<void> => {
    await deleteRequest<DeleteExpenseResponse>(`/api/Expenses/${id}`, config);
  },

  getIssuedVouchers: async (config?: RequestConfig): Promise<ExpenseDto[]> => {
    const response = await get<GetIssuedVouchersResponse>('/api/Expenses/vouchers/issued', config);
    return response.data;
  },

  getIssuedVoucherGroups: async (config?: RequestConfig): Promise<ExpenseVoucherGroupDto[]> => {
    const response = await get<GetIssuedVoucherGroupsResponse>(
      '/api/Expenses/vouchers/issued-groups',
      config
    );
    return response.data;
  },

  getVoucherForPrint: async (id: number, config?: RequestConfig): Promise<ExpenseVoucherPrintDto> => {
    const response = await get<GetVoucherPrintResponse>(`/api/Expenses/${id}/voucher-for-print`, config);
    return response.data;
  },

  getVoucherForPrintByNumber: async (
    voucherNumber: string,
    config?: RequestConfig
  ): Promise<ExpenseVoucherPrintDto> => {
    const response = await get<GetVoucherPrintResponse>(
      `/api/Expenses/vouchers/${encodeURIComponent(voucherNumber)}/for-print`,
      config
    );
    return response.data;
  },

  issueVoucher: async (
    id: number,
    data: IssueExpenseVoucherRequest,
    config?: RequestConfig
  ): Promise<ExpenseDto> => {
    const response = await post<IssueVoucherResponse, IssueExpenseVoucherRequest>(
      `/api/Expenses/${id}/issue-voucher`,
      data,
      config
    );
    return response.data;
  },

  issueVoucherBatch: async (
    data: IssueExpenseVoucherBatchRequest,
    config?: RequestConfig
  ): Promise<ExpenseVoucherBatchResultDto> => {
    const response = await post<IssueVoucherBatchResponse, IssueExpenseVoucherBatchRequest>(
      '/api/Expenses/issue-voucher-batch',
      data,
      config
    );
    return response.data;
  },
};

const expenseKeys = {
  all: ['expenses'] as const,
  list: (p: ExpenseListQueryParams | undefined) => [...expenseKeys.all, 'list', p] as const,
  detail: (id: number) => [...expenseKeys.all, id] as const,
  issued: () => [...expenseKeys.all, 'vouchers', 'issued'] as const,
  issuedGroups: () => [...expenseKeys.all, 'vouchers', 'issued-groups'] as const,
  print: (id: number) => [...expenseKeys.all, 'voucher-print', id] as const,
  printByNumber: (voucherNumber: string) =>
    [...expenseKeys.all, 'voucher-print-number', voucherNumber] as const,
};

export function useExpenseList(params?: ExpenseListQueryParams) {
  return useGetQuery<PaginatedResponse<ExpenseDto>>(
    expenseKeys.list(params),
    () => expenseService.getExpenses(params),
    { staleTime: 60 * 1000 }
  );
}

export function useExpense(id: number | null) {
  return useGetQuery<ExpenseDto>(expenseKeys.detail(id ?? 0), () => expenseService.getExpense(id!), {
    enabled: id !== null && id > 0,
  });
}

export function useIssuedVoucherExpenses() {
  return useGetQuery<ExpenseDto[]>(expenseKeys.issued(), () => expenseService.getIssuedVouchers(), {
    staleTime: 60 * 1000,
  });
}

export function useIssuedVoucherExpenseGroups() {
  return useGetQuery<ExpenseVoucherGroupDto[]>(
    expenseKeys.issuedGroups(),
    () => expenseService.getIssuedVoucherGroups(),
    { staleTime: 60 * 1000 }
  );
}

export function useVoucherPrint(id: number | null) {
  return useGetQuery<ExpenseVoucherPrintDto>(
    expenseKeys.print(id ?? 0),
    () => expenseService.getVoucherForPrint(id!),
    { enabled: id !== null && id > 0 }
  );
}

export function useExpenseVoucherPrintByNumber(voucherNumber: string | null) {
  return useGetQuery<ExpenseVoucherPrintDto>(
    expenseKeys.printByNumber(voucherNumber ?? ''),
    () => expenseService.getVoucherForPrintByNumber(voucherNumber!),
    { enabled: !!voucherNumber?.trim() }
  );
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return usePostMutation<ExpenseDto | null, CreateExpenseRequest>(
    (data) => expenseService.createExpense(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: expenseKeys.all });
        queryClient.invalidateQueries({ queryKey: accountKeys.balances() });
        queryClient.invalidateQueries({ queryKey: accountKeys.all });
      },
    }
  );
}

export function useUpdateExpense(id: number) {
  const queryClient = useQueryClient();
  return usePutMutation<ExpenseDto | null, UpdateExpenseRequest>(
    (data) => expenseService.updateExpense(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: expenseKeys.all });
        queryClient.invalidateQueries({ queryKey: accountKeys.balances() });
      },
    }
  );
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useDeleteMutation((expenseId: number) => expenseService.deleteExpense(expenseId), {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}

export type IssueExpenseVoucherPayload = { expenseId: number } & IssueExpenseVoucherRequest;

export function useIssueExpenseVoucher() {
  const queryClient = useQueryClient();
  return usePostMutation<ExpenseDto, IssueExpenseVoucherPayload>(
    ({ expenseId, voucherTemplateKey }) =>
      expenseService.issueVoucher(expenseId, { voucherTemplateKey }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: expenseKeys.all });
        queryClient.invalidateQueries({ queryKey: expenseKeys.issued() });
        queryClient.invalidateQueries({ queryKey: expenseKeys.issuedGroups() });
      },
    }
  );
}

export function useIssueExpenseVoucherBatch() {
  const queryClient = useQueryClient();
  return usePostMutation<ExpenseVoucherBatchResultDto, IssueExpenseVoucherBatchRequest>(
    (data) => expenseService.issueVoucherBatch(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: expenseKeys.all });
        queryClient.invalidateQueries({ queryKey: expenseKeys.issued() });
        queryClient.invalidateQueries({ queryKey: expenseKeys.issuedGroups() });
      },
    }
  );
}

export { expenseKeys };
