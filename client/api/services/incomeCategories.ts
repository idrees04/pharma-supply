import { get, post, put, deleteRequest, RequestConfig } from '@/api/requests';
import {
  IncomeCategory,
  CreateIncomeCategoryRequest,
  UpdateIncomeCategoryRequest,
  GetIncomeCategoriesResponse,
  GetIncomeCategoryResponse,
  CreateIncomeCategoryResponse,
  UpdateIncomeCategoryResponse,
  DeleteIncomeCategoryResponse,
} from '@/types/api/incomeCategories';
import { useGetQuery, usePostMutation, usePutMutation, useDeleteMutation } from '@/api/hooks';
import { useQueryClient } from '@tanstack/react-query';

export const incomeCategoryService = {
  getIncomeCategories: async (config?: RequestConfig): Promise<IncomeCategory[]> => {
    const response = await get<GetIncomeCategoriesResponse>('/api/IncomeCategories', config);
    return response.data;
  },

  getIncomeCategory: async (id: number, config?: RequestConfig): Promise<IncomeCategory> => {
    const response = await get<GetIncomeCategoryResponse>(`/api/IncomeCategories/${id}`, config);
    return response.data;
  },

  createIncomeCategory: async (
    data: CreateIncomeCategoryRequest,
    config?: RequestConfig
  ): Promise<IncomeCategory> => {
    const response = await post<CreateIncomeCategoryResponse, CreateIncomeCategoryRequest>(
      '/api/IncomeCategories',
      data,
      config
    );
    return response.data;
  },

  updateIncomeCategory: async (
    id: number,
    data: UpdateIncomeCategoryRequest,
    config?: RequestConfig
  ): Promise<IncomeCategory> => {
    const response = await put<UpdateIncomeCategoryResponse, UpdateIncomeCategoryRequest>(
      `/api/IncomeCategories/${id}`,
      data,
      config
    );
    return response.data;
  },

  deleteIncomeCategory: async (id: number, config?: RequestConfig): Promise<void> => {
    await deleteRequest<DeleteIncomeCategoryResponse>(`/api/IncomeCategories/${id}`, config);
  },
};

export function useIncomeCategories() {
  return useGetQuery<IncomeCategory[]>(
    ['incomeCategories'],
    () => incomeCategoryService.getIncomeCategories(),
    { staleTime: 10 * 60 * 1000 }
  );
}

export function useIncomeCategory(id: number | null) {
  return useGetQuery<IncomeCategory>(
    ['incomeCategories', id],
    () => incomeCategoryService.getIncomeCategory(id!),
    { enabled: id !== null }
  );
}

export function useCreateIncomeCategory() {
  const queryClient = useQueryClient();
  return usePostMutation<IncomeCategory, CreateIncomeCategoryRequest>(
    (data) => incomeCategoryService.createIncomeCategory(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['incomeCategories'] });
      },
    }
  );
}

export function useUpdateIncomeCategory(id: number) {
  const queryClient = useQueryClient();
  return usePutMutation<IncomeCategory, UpdateIncomeCategoryRequest>(
    (data) => incomeCategoryService.updateIncomeCategory(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['incomeCategories'] });
        queryClient.invalidateQueries({ queryKey: ['incomeCategories', id] });
      },
    }
  );
}

export function useDeleteIncomeCategory() {
  const queryClient = useQueryClient();
  return useDeleteMutation((id: number) => incomeCategoryService.deleteIncomeCategory(id), {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomeCategories'] });
    },
  });
}

