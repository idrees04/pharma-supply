import { get, post, put, deleteRequest, RequestConfig } from '@/api/requests';
import {
    ExpenseCategory,
    CreateExpenseCategoryRequest,
    UpdateExpenseCategoryRequest,
    GetExpenseCategoriesResponse,
    GetExpenseCategoryResponse,
    CreateExpenseCategoryResponse,
    UpdateExpenseCategoryResponse,
    DeleteExpenseCategoryResponse,
} from '@/types/api/expenseCategories';
import { useGetQuery, usePostMutation, usePutMutation, useDeleteMutation } from '@/api/hooks';
import { useQueryClient } from '@tanstack/react-query';

export const expenseCategoryService = {
    /**
     * Get all expense categories
     */
    getExpenseCategories: async (config?: RequestConfig): Promise<ExpenseCategory[]> => {
        const response = await get<GetExpenseCategoriesResponse>('/api/ExpenseCategories', config);
        return response.data;
    },

    /**
     * Get a single expense category by ID
     */
    getExpenseCategory: async (id: number, config?: RequestConfig): Promise<ExpenseCategory> => {
        const response = await get<GetExpenseCategoryResponse>(`/api/ExpenseCategories/${id}`, config);
        return response.data;
    },

    /**
     * Create a new expense category
     */
    createExpenseCategory: async (
        data: CreateExpenseCategoryRequest,
        config?: RequestConfig
    ): Promise<ExpenseCategory> => {
        const response = await post<CreateExpenseCategoryResponse, CreateExpenseCategoryRequest>(
            '/api/ExpenseCategories',
            data,
            config
        );
        return response.data;
    },

    /**
     * Update an expense category
     */
    updateExpenseCategory: async (
        id: number,
        data: UpdateExpenseCategoryRequest,
        config?: RequestConfig
    ): Promise<ExpenseCategory> => {
        const response = await put<UpdateExpenseCategoryResponse, UpdateExpenseCategoryRequest>(
            `/api/ExpenseCategories/${id}`,
            data,
            config
        );
        return response.data;
    },

    /**
     * Delete an expense category
     */
    deleteExpenseCategory: async (id: number, config?: RequestConfig): Promise<void> => {
        await deleteRequest<DeleteExpenseCategoryResponse>(`/api/ExpenseCategories/${id}`, config);
    },
};

/**
 * Custom Hooks for Expense Categories
 */

export function useExpenseCategories() {
    return useGetQuery<ExpenseCategory[]>(
        ['expenseCategories'],
        () => expenseCategoryService.getExpenseCategories(),
        {
            staleTime: 10 * 60 * 1000,
        }
    );
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
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
                queryClient.invalidateQueries({ queryKey: ['expenseCategories', id] });
            },
        }
    );
}

export function useDeleteExpenseCategory() {
    const queryClient = useQueryClient();
    return useDeleteMutation(
        (id: number) => expenseCategoryService.deleteExpenseCategory(id),
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
            },
        }
    );
}
