import { get, post, put, deleteRequest, RequestConfig } from '@/api/requests';
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
} from '@/types/api/expenses';
import { PaginatedResponse } from '@/types/api/common';
import { useGetQuery, usePostMutation, usePutMutation, useDeleteMutation } from '@/api/hooks';
import { useQueryClient } from '@tanstack/react-query';

export const expenseService = {
    /**
     * Get all expenses with pagination
     */
    getExpenses: async (
        params?: ExpenseListQueryParams,
        config?: RequestConfig
    ): Promise<PaginatedResponse<ExpenseDto>> => {
        const queryParams = new URLSearchParams();

        if (params) {
            if (params.pageNumber !== undefined) queryParams.append('PageNumber', params.pageNumber.toString());
            if (params.pageSize !== undefined) queryParams.append('PageSize', params.pageSize.toString());
            if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);
            if (params.sortBy) queryParams.append('SortBy', params.sortBy);
            if (params.sortDescending !== undefined) queryParams.append('SortDescending', params.sortDescending.toString());
        }

        const url = `/api/Expenses${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await get<GetExpensesResponse>(url, config);
        return response.data;
    },

    /**
     * Get a single expense by ID
     */
    getExpense: async (id: number, config?: RequestConfig): Promise<ExpenseDto> => {
        const response = await get<GetExpenseResponse>(`/api/Expenses/${id}`, config);
        return response.data;
    },

    /**
     * Create a new expense
     */
    createExpense: async (
        data: CreateExpenseRequest,
        config?: RequestConfig
    ): Promise<ExpenseDto> => {
        const response = await post<CreateExpenseResponse, CreateExpenseRequest>(
            '/api/Expenses',
            data,
            config
        );
        return response.data;
    },

    /**
     * Update an expense
     */
    updateExpense: async (
        id: number,
        data: UpdateExpenseRequest,
        config?: RequestConfig
    ): Promise<ExpenseDto> => {
        const response = await put<UpdateExpenseResponse, UpdateExpenseRequest>(
            `/api/Expenses/${id}`,
            data,
            config
        );
        return response.data;
    },

    /**
     * Delete an expense
     */
    deleteExpense: async (id: number, config?: RequestConfig): Promise<void> => {
        await deleteRequest<DeleteExpenseResponse>(`/api/Expenses/${id}`, config);
    },
};

/**
 * Custom Hooks for Expenses
 */

export function useExpenseList(params?: ExpenseListQueryParams) {
    return useGetQuery<PaginatedResponse<ExpenseDto>>(
        ['expenses', params],
        () => expenseService.getExpenses(params),
        {
            staleTime: 5 * 60 * 1000,
        }
    );
}

export function useExpense(id: number | null) {
    return useGetQuery<ExpenseDto>(
        ['expenses', id],
        () => expenseService.getExpense(id!),
        {
            enabled: id !== null,
        }
    );
}

export function useCreateExpense() {
    const queryClient = useQueryClient();
    return usePostMutation<ExpenseDto, CreateExpenseRequest>(
        (data) => expenseService.createExpense(data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['expenses'] });
            },
        }
    );
}

export function useUpdateExpense(id: number) {
    const queryClient = useQueryClient();
    return usePutMutation<ExpenseDto, UpdateExpenseRequest>(
        (data) => expenseService.updateExpense(id, data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['expenses'] });
                queryClient.invalidateQueries({ queryKey: ['expenses', id] });
            },
        }
    );
}

export function useDeleteExpense() {
    const queryClient = useQueryClient();
    return useDeleteMutation(
        (id: number) => expenseService.deleteExpense(id),
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['expenses'] });
            },
        }
    );
}
