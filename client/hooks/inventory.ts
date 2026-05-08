import { useQueryClient } from '@tanstack/react-query';
import { useGetQuery, usePostMutation, usePutMutation } from '@/api/hooks';
import { inventoryService } from '@/api/services/inventory';
import {
    InventoryStockDto,
    ProductBatchDto,
    CreateProductBatchRequest,
    UpdateInventoryStockRequest,
    InventoryListQueryParams,
} from '@/types/api/inventory';
import { PaginatedResponse } from '@/types/api/common';

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

export function useExpiringBatches() {
    return useGetQuery<ProductBatchDto[]>(
        ['inventory', 'batches', 'expiring'],
        () => inventoryService.getExpiringBatches(),
        {
            staleTime: 30 * 60 * 1000, // 30 minutes
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