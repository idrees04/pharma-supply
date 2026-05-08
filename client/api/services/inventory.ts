import { get, post, put, RequestConfig } from '@/api/requests';
import {
    InventoryStockDto,
    ProductBatchDto,
    CreateProductBatchRequest,
    UpdateInventoryStockRequest,
    InventoryListQueryParams,
    GetInventoryStocksResponse,
    GetInventoryBatchesResponse,
    GetExpiringBatchesResponse,
    CreateProductBatchResponse,
    UpdateInventoryStockResponse,
} from '@/types/api/inventory';
import { PaginatedResponse } from '@/types/api/common';
import { useGetQuery, usePostMutation, usePutMutation } from '@/api/hooks';
import { useQueryClient } from '@tanstack/react-query';

export const inventoryService = {
    /**
     * Get inventory stocks with pagination
     */
    getStocks: async (
        params?: InventoryListQueryParams,
        config?: RequestConfig
    ): Promise<PaginatedResponse<InventoryStockDto>> => {
        const queryParams = new URLSearchParams();

        if (params) {
            if (params.pageNumber !== undefined) queryParams.append('PageNumber', params.pageNumber.toString());
            if (params.pageSize !== undefined) queryParams.append('PageSize', params.pageSize.toString());
            if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);
            if (params.sortBy) queryParams.append('SortBy', params.sortBy);
            if (params.sortDescending !== undefined) queryParams.append('SortDescending', params.sortDescending.toString());
        }

        const url = `/api/Inventory/stocks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await get<GetInventoryStocksResponse>(url, config);
        return response.data;
    },

    /**
     * Get product batches with pagination
     */
    getBatches: async (
        params?: InventoryListQueryParams,
        config?: RequestConfig
    ): Promise<PaginatedResponse<ProductBatchDto>> => {
        const queryParams = new URLSearchParams();

        if (params) {
            if (params.pageNumber !== undefined) queryParams.append('PageNumber', params.pageNumber.toString());
            if (params.pageSize !== undefined) queryParams.append('PageSize', params.pageSize.toString());
            if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);
            if (params.sortBy) queryParams.append('SortBy', params.sortBy);
            if (params.sortDescending !== undefined) queryParams.append('SortDescending', params.sortDescending.toString());
        }

        const url = `/api/Inventory/batches${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await get<GetInventoryBatchesResponse>(url, config);
        return response.data;
    },

    /**
     * Create a new product batch
     */
    createBatch: async (
        data: CreateProductBatchRequest,
        config?: RequestConfig
    ): Promise<ProductBatchDto> => {
        const response = await post<CreateProductBatchResponse, CreateProductBatchRequest>(
            '/api/Inventory/batches',
            data,
            config
        );
        return response.data;
    },

    /**
     * Get expiring batches
     */
    getExpiringBatches: async (config?: RequestConfig): Promise<ProductBatchDto[]> => {
        const response = await get<GetExpiringBatchesResponse>('/api/Inventory/batches/expiring', config);
        return response.data;
    },

    /**
     * Adjust inventory stock for a product
     */
    adjustStock: async (
        productId: number,
        data: UpdateInventoryStockRequest,
        config?: RequestConfig
    ): Promise<InventoryStockDto> => {
        const response = await put<UpdateInventoryStockResponse, UpdateInventoryStockRequest>(
            `/api/Inventory/stocks/${productId}/adjust`,
            data,
            config
        );
        return response.data;
    },
};

/**
 * Custom Hooks for Inventory
 */

export function useInventoryStocks(params?: InventoryListQueryParams) {
    return useGetQuery<PaginatedResponse<InventoryStockDto>>(
        ['inventory', 'stocks', params],
        () => inventoryService.getStocks(params),
        {
            staleTime: 5 * 60 * 1000,
        }
    );
}

export function useInventoryBatches(params?: InventoryListQueryParams) {
    return useGetQuery<PaginatedResponse<ProductBatchDto>>(
        ['inventory', 'batches', params],
        () => inventoryService.getBatches(params),
        {
            staleTime: 5 * 60 * 1000,
        }
    );
}

export function useCreateProductBatch() {
    const queryClient = useQueryClient();
    return usePostMutation<ProductBatchDto, CreateProductBatchRequest>(
        (data) => inventoryService.createBatch(data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['inventory', 'batches'] });
            },
        }
    );
}

export function useExpiringBatches() {
    return useGetQuery<ProductBatchDto[]>(
        ['inventory', 'batches', 'expiring'],
        () => inventoryService.getExpiringBatches(),
        {
            staleTime: 10 * 60 * 1000,
        }
    );
}

export function useAdjustStock(productId: number) {
    const queryClient = useQueryClient();
    return usePutMutation<InventoryStockDto, UpdateInventoryStockRequest>(
        (data) => inventoryService.adjustStock(productId, data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['inventory', 'stocks'] });
                queryClient.invalidateQueries({ queryKey: ['products', 'low-stock'] });
            },
        }
    );
}
