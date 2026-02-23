import { useQueryClient } from '@tanstack/react-query';
import { useGetQuery, usePostMutation, usePutMutation, useDeleteMutation } from '@/api/hooks';
import { expenseCategoryService } from '@/api/services/expenseCategories';
import {
    ExpenseCategory,
    CreateExpenseCategoryRequest,
    UpdateExpenseCategoryRequest,
} from '@/types/api/expenseCategories';

export function useExpenseCategories() {
    return useGetQuery<ExpenseCategory[]>(['expenseCategories'], () => expenseCategoryService.getExpenseCategories(), {
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

export function useExpenseCategory(id: number | null) {
    return useGetQuery<ExpenseCategory>(
        ['expenseCategories', id],
        () => expenseCategoryService.getExpenseCategory(id!),
        {
            enabled: id !== null,
        }
    );
}

export function useCreateExpenseCategory() {
    const queryClient = useQueryClient();

    return usePostMutation<ExpenseCategory, CreateExpenseCategoryRequest>(
        (data) => expenseCategoryService.createExpenseCategory(data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
            },
        }
    );
}

export function useUpdateExpenseCategory(id: number) {
    const queryClient = useQueryClient();

    return usePutMutation<ExpenseCategory, UpdateExpenseCategoryRequest>(
        (data) => expenseCategoryService.updateExpenseCategory(id, data),
        {
            onSuccess: (updated) => {
                queryClient.setQueryData(['expenseCategories', id], updated);
                queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
            },
        }
    );
}

export function useDeleteExpenseCategory() {
    const queryClient = useQueryClient();

    return useDeleteMutation(
        (id: number) => expenseCategoryService.deleteExpenseCategory(id),
        {
            onSuccess: (_, id) => {
                queryClient.removeQueries({ queryKey: ['expenseCategories', id] });
                queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
            },
        }
    );
}