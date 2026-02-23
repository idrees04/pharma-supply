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