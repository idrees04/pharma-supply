import { useQueryClient } from '@tanstack/react-query';
import { useGetQuery, usePostMutation, usePutMutation, useDeleteMutation } from '@/api/hooks';
import { expenseService } from '@/api/services/expenses';
import {
    ExpenseDto,
    CreateExpenseRequest,
    UpdateExpenseRequest,
    ExpenseListQueryParams,
} from '@/types/api/expenses';
import { PaginatedResponse } from '@/types/api/common';

export function useExpenses(params?: ExpenseListQueryParams) {
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
            onSuccess: (updated) => {
                queryClient.setQueryData(['expenses', id], updated);
                queryClient.invalidateQueries({ queryKey: ['expenses'] });
            },
        }
    );
}

export function useDeleteExpense() {
    const queryClient = useQueryClient();

    return useDeleteMutation(
        (id: number) => expenseService.deleteExpense(id),
        {
            onSuccess: (_, id) => {
                queryClient.removeQueries({ queryKey: ['expenses', id] });
                queryClient.invalidateQueries({ queryKey: ['expenses'] });
            },
        }
    );
}