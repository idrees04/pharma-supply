/**
 * Purchase Orders API Service
 *
 * API Base: https://mds.vtoxi.com/api/PurchaseOrders
 */

import { get, post, put, deleteRequest, RequestConfig } from '../requests';
import {
  PurchaseOrder,
  CreatePurchaseOrderRequest,
  UpdatePurchaseOrderRequest,
  GetPurchaseOrdersListResponse,
  GetPurchaseOrderResponse,
  CreatePurchaseOrderResponse,
  UpdatePurchaseOrderResponse,
  DeletePurchaseOrderResponse,
  GetPurchaseOrderStatusesResponse,
  GetPurchaseOrdersByStatusResponse,
  GetPurchaseOrdersBySupplierResponse,
  ReceivePurchaseOrderRequest,
  ReceivePurchaseOrderResponse,
  PartialOrderRequest,
  PartialOrderResponse,
  PurchaseOrderListQueryParams,
  PurchaseOrderStatus,
} from '@/types/api/purchaseOrders';
import { PaginatedResponse } from '@/types/api/products';
import { useGetQuery, usePostMutation, usePutMutation, useDeleteMutation } from '../hooks';
import { useQueryClient } from '@tanstack/react-query';

export const purchaseOrderService = {
  /**
   * Get all purchase orders with optional filtering and pagination
   */
  getPurchaseOrders: async (
    params?: PurchaseOrderListQueryParams,
    config?: RequestConfig
  ): Promise<PaginatedResponse<PurchaseOrder>> => {
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

    const url = `/api/PurchaseOrders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await get<GetPurchaseOrdersListResponse>(url, config);
    return response.data;
  },

  /**
   * Get a single purchase order by ID
   */
  getPurchaseOrder: async (id: number, config?: RequestConfig): Promise<PurchaseOrder> => {
    const response = await get<GetPurchaseOrderResponse>(`/api/PurchaseOrders/${id}`, config);
    return response.data;
  },

  /**
   * Create a new purchase order
   */
  createPurchaseOrder: async (
    data: CreatePurchaseOrderRequest,
    config?: RequestConfig
  ): Promise<PurchaseOrder> => {
    const response = await post<CreatePurchaseOrderResponse, CreatePurchaseOrderRequest>(
      '/api/PurchaseOrders',
      data,
      config
    );
    return response.data;
  },

  /**
   * Update a purchase order
   */
  updatePurchaseOrder: async (
    id: number,
    data: UpdatePurchaseOrderRequest,
    config?: RequestConfig
  ): Promise<PurchaseOrder> => {
    const response = await put<UpdatePurchaseOrderResponse, UpdatePurchaseOrderRequest>(
      `/api/PurchaseOrders/${id}`,
      data,
      config
    );
    return response.data;
  },

  /**
   * Delete a purchase order
   */
  deletePurchaseOrder: async (id: number, config?: RequestConfig): Promise<void> => {
    await deleteRequest<DeletePurchaseOrderResponse>(`/api/PurchaseOrders/${id}`, config);
  },

  /**
   * Get purchase order statuses
   * Returns the list of possible status values and names
   */
  getStatuses: async (): Promise<PurchaseOrderStatus[]> => {
    const response = await get<GetPurchaseOrderStatusesResponse>('/api/PurchaseOrders/statuses');
    return response.data;
  },

  /**
   * Get purchase orders by status
   */
  getPurchaseOrdersByStatus: async (status: number, config?: RequestConfig): Promise<PurchaseOrder[]> => {
    const response = await get<GetPurchaseOrdersByStatusResponse>(`/api/PurchaseOrders/by-status/${status}`, config);
    return response.data;
  },

  /**
   * Get purchase orders by supplier
   */
  getPurchaseOrdersBySupplier: async (supplierId: number, config?: RequestConfig): Promise<PurchaseOrder[]> => {
    const response = await get<GetPurchaseOrdersBySupplierResponse>(`/api/PurchaseOrders/by-supplier/${supplierId}`, config);
    return response.data;
  },

  /**
   * Receive items for a purchase order
   */
  receiveItems: async (data: ReceivePurchaseOrderRequest, config?: RequestConfig): Promise<ReceivePurchaseOrderResponse> => {
    return post<ReceivePurchaseOrderResponse, ReceivePurchaseOrderRequest>(
      '/api/PurchaseOrders/receive',
      data,
      config
    );
  },

  /**
   * Create a partial order
   */
  createPartialOrder: async (id: number, data: PartialOrderRequest, config?: RequestConfig): Promise<PurchaseOrder> => {
    const response = await post<PartialOrderResponse, PartialOrderRequest>(
      `/api/PurchaseOrders/${id}/partial-order`,
      data,
      config
    );
    return response.data;
  },
};

/**
 * Custom Hooks for Purchase Orders
 */

export function usePurchaseOrderList(params?: PurchaseOrderListQueryParams) {
  return useGetQuery<PaginatedResponse<PurchaseOrder>>(
    ['purchaseOrders', params],
    () => purchaseOrderService.getPurchaseOrders(params),
    {
      staleTime: 5 * 60 * 1000,
    }
  );
}

export function usePurchaseOrder(id: number | null) {
  return useGetQuery(
    ['purchaseOrders', id],
    () => purchaseOrderService.getPurchaseOrder(id!),
    {
      enabled: id !== null,
    }
  );
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return usePostMutation<PurchaseOrder, CreatePurchaseOrderRequest>(
    (data) => purchaseOrderService.createPurchaseOrder(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      },
    }
  );
}

export function useUpdatePurchaseOrder(id: number) {
  const queryClient = useQueryClient();

  return usePutMutation<PurchaseOrder, UpdatePurchaseOrderRequest>(
    (data) => purchaseOrderService.updatePurchaseOrder(id, data),
    {
      onSuccess: (updated) => {
        queryClient.setQueryData(['purchaseOrders', id], updated);
        queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      },
    }
  );
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();

  return useDeleteMutation(
    (id: number) => purchaseOrderService.deletePurchaseOrder(id),
    {
      onSuccess: (_, id) => {
        queryClient.removeQueries({ queryKey: ['purchaseOrders', id] });
        queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      },
    }
  );
}

export function usePurchaseOrderStatuses() {
  return useGetQuery(
    ['purchaseOrders', 'statuses'],
    () => purchaseOrderService.getStatuses(),
    {
      staleTime: 24 * 60 * 60 * 1000, // Cache statuses for 24 hours
    }
  );
}

export function usePurchaseOrdersByStatus(status: number | null) {
  return useGetQuery(
    ['purchaseOrders', 'by-status', status],
    () => purchaseOrderService.getPurchaseOrdersByStatus(status!),
    {
      enabled: status !== null,
    }
  );
}

export function usePurchaseOrdersBySupplier(supplierId: number | null) {
  return useGetQuery(
    ['purchaseOrders', 'by-supplier', supplierId],
    () => purchaseOrderService.getPurchaseOrdersBySupplier(supplierId!),
    {
      enabled: supplierId !== null,
    }
  );
}

export function useReceiveItems() {
  const queryClient = useQueryClient();

  return usePostMutation<ReceivePurchaseOrderResponse, ReceivePurchaseOrderRequest>(
    (data) => purchaseOrderService.receiveItems(data),
    {
      onSuccess: (response, variables) => {
        const updated = response.data;
        if (updated) {
          queryClient.setQueryData(['purchaseOrders', updated.id], updated);
        }
        queryClient.invalidateQueries({ queryKey: ['purchaseOrders', variables.purchaseOrderId] });
        queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      },
    }
  );
}
