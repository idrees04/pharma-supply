/**
 * Supply Orders API Service
 *
 * API Base: /api/SupplyOrders
 */

import { get, post, put, deleteRequest, RequestConfig } from '../requests';
import {
  SupplyOrder,
  CreateSupplyOrderRequest,
  UpdateSupplyOrderRequest,
  GetSupplyOrdersListResponse,
  GetSupplyOrderResponse,
  CreateSupplyOrderResponse,
  UpdateSupplyOrderResponse,
  DeleteSupplyOrderResponse,
  GetSupplyOrderStatusesResponse,
  GetSupplyOrdersByStatusResponse,
  SupplyOrderListQueryParams,
} from '@/types/api/supplyOrders';
import { PaginatedResponse } from '@/types/api/products';
import { useGetQuery, usePostMutation, usePutMutation, useDeleteMutation } from '../hooks';
import { useQueryClient } from '@tanstack/react-query';

export const supplyOrderService = {
  /**
   * Get all supply orders with optional filtering and pagination
   */
  getSupplyOrders: async (
    params?: SupplyOrderListQueryParams,
    config?: RequestConfig
  ): Promise<PaginatedResponse<SupplyOrder>> => {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.pageNumber !== undefined) {
        const pageNumber = params.pageNumber <= 0 ? 1 : params.pageNumber;
        queryParams.append('PageNumber', pageNumber.toString());
      }
      if (params.pageSize !== undefined) queryParams.append('PageSize', params.pageSize.toString());
      if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);
      if (params.sortBy) queryParams.append('SortBy', params.sortBy);
      if (params.sortDescending !== undefined)
        queryParams.append('SortDescending', params.sortDescending.toString());
    }

    const url = `/api/SupplyOrders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await get<GetSupplyOrdersListResponse>(url, config);
    return response.data;
  },

  /**
   * Get a single supply order by ID
   */
  getSupplyOrder: async (id: number, config?: RequestConfig): Promise<SupplyOrder> => {
    const response = await get<GetSupplyOrderResponse>(`/api/SupplyOrders/${id}`, config);
    return response.data;
  },

  /**
   * Create a new supply order
   */
  createSupplyOrder: async (
    data: CreateSupplyOrderRequest,
    config?: RequestConfig
  ): Promise<SupplyOrder> => {
    const response = await post<CreateSupplyOrderResponse, CreateSupplyOrderRequest>(
      '/api/SupplyOrders',
      data,
      config
    );
    return response.data;
  },

  /**
   * Update a supply order
   */
  updateSupplyOrder: async (
    id: number,
    data: UpdateSupplyOrderRequest,
    config?: RequestConfig
  ): Promise<SupplyOrder> => {
    const response = await put<UpdateSupplyOrderResponse, UpdateSupplyOrderRequest>(
      `/api/SupplyOrders/${id}`,
      data,
      config
    );
    return response.data;
  },

  /**
   * Delete a supply order
   */
  deleteSupplyOrder: async (id: number, config?: RequestConfig): Promise<void> => {
    await deleteRequest<DeleteSupplyOrderResponse>(`/api/SupplyOrders/${id}`, config);
  },

  /**
   * Get supply order statuses
   */
  getStatuses: async (): Promise<{ value: number; name: string }[]> => {
    // Return hardcoded statuses to avoid 400 error from non-existent endpoint
    return [
      { value: 1, name: 'Pending' },
      { value: 2, name: 'Approved' },
      { value: 3, name: 'Fulfilled' },
      { value: 4, name: 'Cancelled' },
    ];
  },

  /**
   * Get supply orders by status
   */
  getSupplyOrdersByStatus: async (status: number, config?: RequestConfig): Promise<SupplyOrder[]> => {
    const response = await get<GetSupplyOrdersByStatusResponse>(`/api/SupplyOrders/by-status/${status}`, config);
    return response.data;
  },
};

/**
 * Custom Hooks for Supply Orders
 */

export function useSupplyOrderList(params?: SupplyOrderListQueryParams) {
  return useGetQuery<PaginatedResponse<SupplyOrder>>(
    ['supplyOrders', params],
    () => supplyOrderService.getSupplyOrders(params),
    {
      staleTime: 5 * 60 * 1000,
    }
  );
}

export function useSupplyOrder(id: number | null) {
  return useGetQuery(
    ['supplyOrders', id],
    () => supplyOrderService.getSupplyOrder(id!),
    {
      enabled: id !== null,
    }
  );
}

export function useCreateSupplyOrder() {
  const queryClient = useQueryClient();

  return usePostMutation<SupplyOrder, CreateSupplyOrderRequest>(
    (data) => supplyOrderService.createSupplyOrder(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['supplyOrders'] });
      },
    }
  );
}

export function useUpdateSupplyOrder(id: number) {
  const queryClient = useQueryClient();

  return usePutMutation<SupplyOrder, UpdateSupplyOrderRequest>(
    (data) => supplyOrderService.updateSupplyOrder(id, data),
    {
      onSuccess: (updated) => {
        queryClient.setQueryData(['supplyOrders', id], updated);
        queryClient.invalidateQueries({ queryKey: ['supplyOrders'] });
      },
    }
  );
}

export function useDeleteSupplyOrder() {
  const queryClient = useQueryClient();

  return useDeleteMutation(
    (id: number) => supplyOrderService.deleteSupplyOrder(id),
    {
      onSuccess: (_, id) => {
        queryClient.removeQueries({ queryKey: ['supplyOrders', id] });
        queryClient.invalidateQueries({ queryKey: ['supplyOrders'] });
      },
    }
  );
}

export function useSupplyOrderStatuses() {
  return useGetQuery(
    ['supplyOrders', 'statuses'],
    () => supplyOrderService.getStatuses(),
    {
      staleTime: 24 * 60 * 60 * 1000,
    }
  );
}

export function useSupplyOrdersByStatus(status: number | null) {
  return useGetQuery(
    ['supplyOrders', 'by-status', status],
    () => supplyOrderService.getSupplyOrdersByStatus(status!),
    {
      enabled: status !== null,
    }
  );
}
