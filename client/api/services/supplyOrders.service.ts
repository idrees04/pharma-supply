/**
 * Supply Orders API Service
 *
 * API Base: /api/SupplyOrders
 */

import { get, post, put, deleteRequest, RequestConfig } from '@/api/requests';
import type { DeliveryChallan } from '@/types/api/deliveryChallans';
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
  DeliveryChallanSummary,
  GetSupplyOrderDeliveryChallansResponse,
  CreateDeliveryChallanFromSupplyOrderRequest,
  CreateDeliveryChallanFromSupplyOrderResponse,
  GetSupplyOrderDispatchSuggestionResponse,
  SupplyOrderDispatchSuggestion,
  SupplyOrderStatusOption,
} from '@/types/api/supplyOrders';
import type { EnumOption } from '@/types/api/dropdown';
import type { ApiResponse } from '@/types/api/products';
import { PaginatedResponse } from '@/types/api/products';
import { useGetQuery, usePostMutation, usePutMutation, useDeleteMutation } from '@/api/hooks';
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
   * Supply order statuses from GET /api/Enums/SupplyOrderStatus (matches SupplyOrderStatus enum)
   */
  getStatuses: async (config?: RequestConfig): Promise<SupplyOrderStatusOption[]> => {
    const response = await get<ApiResponse<EnumOption[]>>(`/api/Enums/SupplyOrderStatus`, config);
    return response.data.map((o) => ({
      value: o.value,
      name: o.displayName?.trim() ? o.displayName : o.name,
      code: o.name,
    }));
  },

  /**
   * Get supply orders by status
   */
  getSupplyOrdersByStatus: async (status: number, config?: RequestConfig): Promise<SupplyOrder[]> => {
    const response = await get<GetSupplyOrdersByStatusResponse>(`/api/SupplyOrders/by-status/${status}`, config);
    return response.data;
  },

  /**
   * Delivery challans linked to a supply order (for invoicing)
   */
  getDeliveryChallansForOrder: async (
    supplyOrderId: number,
    config?: RequestConfig
  ): Promise<DeliveryChallanSummary[]> => {
    const response = await get<GetSupplyOrderDeliveryChallansResponse>(
      `/api/SupplyOrders/${supplyOrderId}/delivery-challans`,
      config
    );
    return response.data;
  },

  /**
   * Stock-aware dispatch quantities for creating a delivery challan
   */
  getDispatchSuggestion: async (
    supplyOrderId: number,
    config?: RequestConfig
  ): Promise<SupplyOrderDispatchSuggestion> => {
    const response = await get<GetSupplyOrderDispatchSuggestionResponse>(
      `/api/SupplyOrders/${supplyOrderId}/dispatch-suggestion`,
      config
    );
    return response.data;
  },

  /**
   * Create delivery challan (dispatches stock, updates SO fulfillment)
   */
  createDeliveryChallanForSupplyOrder: async (
    supplyOrderId: number,
    data: CreateDeliveryChallanFromSupplyOrderRequest,
    config?: RequestConfig
  ): Promise<DeliveryChallan> => {
    const response = await post<
      CreateDeliveryChallanFromSupplyOrderResponse,
      CreateDeliveryChallanFromSupplyOrderRequest
    >(`/api/SupplyOrders/${supplyOrderId}/delivery-challans`, data, config);
    return response.data;
  },

  /**
   * Upload a single attachment for a supply order (replaces any existing file).
   */
  uploadAttachment: async (
    supplyOrderId: number,
    file: File,
    config?: RequestConfig
  ): Promise<SupplyOrder> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await post<ApiResponse<SupplyOrder>, FormData>(
      `/api/SupplyOrders/${supplyOrderId}/attachment`,
      formData,
      config
    );
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
        queryClient.setQueryData<SupplyOrder>(['supplyOrders', id], (old) => {
          if (!updated) return old;
          if (!old) return updated;
          return {
            ...old,
            ...updated,
            items: updated.items ?? old.items ?? null,
          };
        });
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
  return useGetQuery<SupplyOrderStatusOption[]>(
    ['supplyOrders', 'statuses', 'api'],
    () => supplyOrderService.getStatuses(),
    {
      staleTime: 60 * 60 * 1000,
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

export function useSupplyOrderDeliveryChallans(supplyOrderId: number | null) {
  return useGetQuery<DeliveryChallanSummary[]>(
    ['supplyOrders', supplyOrderId, 'delivery-challans'],
    () => supplyOrderService.getDeliveryChallansForOrder(supplyOrderId!),
    {
      enabled: supplyOrderId !== null && supplyOrderId > 0,
      staleTime: 60 * 1000,
    }
  );
}

export function useSupplyOrderDispatchSuggestion(supplyOrderId: number | null) {
  return useGetQuery<SupplyOrderDispatchSuggestion>(
    ['supplyOrders', supplyOrderId, 'dispatch-suggestion'],
    () => supplyOrderService.getDispatchSuggestion(supplyOrderId!),
    {
      enabled: supplyOrderId !== null && supplyOrderId > 0,
      staleTime: 30 * 1000,
    }
  );
}

export function useCreateDeliveryChallanForSupplyOrder(supplyOrderId: number) {
  const queryClient = useQueryClient();

  return usePostMutation<DeliveryChallan, CreateDeliveryChallanFromSupplyOrderRequest>(
    (data) => supplyOrderService.createDeliveryChallanForSupplyOrder(supplyOrderId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['supplyOrders', supplyOrderId] });
        queryClient.invalidateQueries({ queryKey: ['supplyOrders'] });
        queryClient.invalidateQueries({ queryKey: ['supplyOrders', supplyOrderId, 'delivery-challans'] });
        queryClient.invalidateQueries({ queryKey: ['supplyOrders', supplyOrderId, 'dispatch-suggestion'] });
      },
    }
  );
}
