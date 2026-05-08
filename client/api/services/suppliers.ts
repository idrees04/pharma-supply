/**
 * Suppliers API Service
 *
 * This module encapsulates all API calls for suppliers.
 * It provides both raw service methods and custom React Query hooks.
 *
 * Architecture:
 * Component → Hook (useSupplierList, etc.) → Service (supplierService) → Requests
 *
 * API Base: https://mds.vtoxi.com/api/Suppliers
 */

import { get, post, put, deleteRequest, RequestConfig } from '@/api/requests';
import {
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  GetSuppliersListResponse,
  CreateSupplierResponse,
  GetSupplierResponse,
  UpdateSupplierResponse,
  DeleteSupplierResponse,
  GetSupplierProductsResponse,
  GetSupplierPurchaseOrdersResponse,
  GetSupplierBalanceResponse,
  GetActiveSuppliersResponse,
  GetSuppliersByStatusResponse,
  SupplierListQueryParams,
  PaginatedResponse,
  SupplierProduct,
  SupplierPurchaseOrder,
  SupplierBalance,
} from '@/types/api/suppliers';
import {
  useGetQuery,
  usePostMutation,
  usePutMutation,
  useDeleteMutation,
} from '@/api/hooks';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Suppliers API Service
 *
 * All supplier API calls go through this service object.
 * This keeps endpoint URLs and logic centralized and reusable.
 */
export const supplierService = {
  /**
   * API 1: GET /api/Suppliers - Get all suppliers with optional filtering and pagination
   */
  getSuppliers: async (
    params?: SupplierListQueryParams,
    config?: RequestConfig
  ): Promise<PaginatedResponse<Supplier>> => {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.pageNumber !== undefined)
        queryParams.append('PageNumber', params.pageNumber.toString());
      if (params.pageSize !== undefined)
        queryParams.append('PageSize', params.pageSize.toString());
      if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);
      if (params.sortBy) queryParams.append('SortBy', params.sortBy);
      if (params.sortDescending !== undefined)
        queryParams.append('SortDescending', params.sortDescending.toString());
    }

    const url = `/api/Suppliers${queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`;
    const response = await get<GetSuppliersListResponse>(url, config);

    // Return just the data part, not the wrapper
    return response.data;
  },

  /**
   * API 3: GET /api/Suppliers/:id - Get a single supplier by ID
   */
  getSupplier: async (
    id: number,
    config?: RequestConfig
  ): Promise<Supplier> => {
    const response = await get<GetSupplierResponse>(
      `/api/Suppliers/${id}`,
      config
    );
    return response.data;
  },

  /**
   * API 2: POST /api/Suppliers - Create a new supplier
   */
  createSupplier: async (
    data: CreateSupplierRequest,
    config?: RequestConfig
  ): Promise<Supplier> => {
    const response = await post<CreateSupplierResponse, CreateSupplierRequest>(
      '/api/Suppliers',
      data,
      config
    );
    return response.data;
  },

  /**
   * API 4: PUT /api/Suppliers/:id - Update a supplier
   */
  updateSupplier: async (
    id: number,
    data: UpdateSupplierRequest,
    config?: RequestConfig
  ): Promise<Supplier> => {
    const response = await put<UpdateSupplierResponse, UpdateSupplierRequest>(
      `/api/Suppliers/${id}`,
      data,
      config
    );
    return response.data;
  },

  /**
   * API 5: DELETE /api/Suppliers/:id - Delete a supplier
   */
  deleteSupplier: async (
    id: number,
    config?: RequestConfig
  ): Promise<void> => {
    await deleteRequest<DeleteSupplierResponse>(
      `/api/Suppliers/${id}`,
      config
    );
  },

  /**
   * API 6: GET /api/Suppliers/:id/products - Get products supplied by a specific supplier
   */
  getSupplierProducts: async (
    id: number,
    config?: RequestConfig
  ): Promise<SupplierProduct[]> => {
    const response = await get<GetSupplierProductsResponse>(
      `/api/Suppliers/${id}/products`,
      config
    );
    return response.data;
  },

  /**
   * API 7: GET /api/Suppliers/:id/purchase-orders - Get purchase orders for a supplier
   */
  getSupplierPurchaseOrders: async (
    id: number,
    params?: SupplierListQueryParams,
    config?: RequestConfig
  ): Promise<PaginatedResponse<SupplierPurchaseOrder>> => {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.pageNumber !== undefined)
        queryParams.append('PageNumber', params.pageNumber.toString());
      if (params.pageSize !== undefined)
        queryParams.append('PageSize', params.pageSize.toString());
      if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);
      if (params.sortBy) queryParams.append('SortBy', params.sortBy);
      if (params.sortDescending !== undefined)
        queryParams.append('SortDescending', params.sortDescending.toString());
    }

    const url = `/api/Suppliers/${id}/purchase-orders${queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`;
    const response = await get<GetSupplierPurchaseOrdersResponse>(
      url,
      config
    );
    return response.data;
  },

  /**
   * API 8: GET /api/Suppliers/:id/balance - Get supplier balance information
   */
  getSupplierBalance: async (
    id: number,
    config?: RequestConfig
  ): Promise<SupplierBalance> => {
    const response = await get<GetSupplierBalanceResponse>(
      `/api/Suppliers/${id}/balance`,
      config
    );
    return response.data;
  },

  /**
   * API 9: GET /api/Suppliers/active - Get all active suppliers
   */
  getActiveSuppliers: async (
    config?: RequestConfig
  ): Promise<Supplier[]> => {
    const response = await get<GetActiveSuppliersResponse>(
      '/api/Suppliers/active',
      config
    );
    return response.data;
  },

  /**
   * API 10: GET /api/Suppliers/by-status/:status - Get suppliers by status
   */
  getSuppliersByStatus: async (
    status: number,
    config?: RequestConfig
  ): Promise<Supplier[]> => {
    const response = await get<GetSuppliersByStatusResponse>(
      `/api/Suppliers/by-status/${status}`,
      config
    );
    return response.data;
  },
};

/**
 * Custom Hooks for Suppliers
 *
 * These hooks combine React Query with the service layer.
 * Components should use these hooks instead of calling the service directly.
 */

/**
 * useSupplierList - Fetch suppliers with optional filters and pagination
 *
 * Example:
 *   const { data, isPending, error } = useSupplierList({
 *     pageNumber: 1,
 *     pageSize: 20,
 *     searchTerm: 'ABC Pharma'
 *   });
 *
 *   if (isPending) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.userMessage}</div>;
 *
 *   return (
 *     <div>
 *       {data.items.map(supplier => (
 *         <SupplierCard key={supplier.id} {...supplier} />
 *       ))}
 *     </div>
 *   );
 */
export function useSupplierList(
  params?: SupplierListQueryParams,
  options?: { enabled?: boolean }
) {
  return useGetQuery<PaginatedResponse<Supplier>>(
    ['suppliers', params],
    () => supplierService.getSuppliers(params),
    {
      staleTime: 5 * 60 * 1000,
      enabled: options?.enabled ?? true,
    }
  );
}

/**
 * useSupplier - Fetch a single supplier by ID
 *
 * Example:
 *   const { data: supplier, isPending, error } = useSupplier(supplierId);
 *
 *   if (!supplier) return null;
 *   return <div>{supplier.supplierName}</div>;
 */
export function useSupplier(id: number | null) {
  return useGetQuery<Supplier>(
    ['suppliers', id],
    () => supplierService.getSupplier(id!),
    {
      enabled: id !== null, // Don't fetch if id is null
    }
  );
}

/**
 * useCreateSupplier - Create a new supplier
 *
 * Example:
 *   const { mutate: createSupplier, isPending, error } = useCreateSupplier();
 *
 *   const handleSubmit = (formData: CreateSupplierRequest) => {
 *     createSupplier(formData, {
 *       onSuccess: () => {
 *         toast.success('Supplier created successfully');
 *         closeDialog();
 *       },
 *       onError: (error) => {
 *         toast.error(error.userMessage);
 *       },
 *     });
 *   };
 */
export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return usePostMutation<Supplier, CreateSupplierRequest>(
    (data) => supplierService.createSupplier(data),
    {
      onSuccess: () => {
        // Invalidate suppliers list to refetch updated data
        queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        // Invalidate active suppliers list
        queryClient.invalidateQueries({ queryKey: ['suppliers', 'active'] });
      },
    }
  );
}

/**
 * useUpdateSupplier - Update a supplier
 *
 * Example:
 *   const { mutate: updateSupplier, isPending } = useUpdateSupplier(supplierId);
 *
 *   const handleSubmit = (formData: UpdateSupplierRequest) => {
 *     updateSupplier(formData, {
 *       onSuccess: () => {
 *         toast.success('Supplier updated');
 *       },
 *     });
 *   };
 */
export function useUpdateSupplier(id: number) {
  const queryClient = useQueryClient();

  return usePutMutation<Supplier, UpdateSupplierRequest>(
    (data) => supplierService.updateSupplier(id, data),
    {
      onSuccess: (updated) => {
        // Update the single supplier cache
        queryClient.setQueryData(['suppliers', id], updated);
        // Invalidate suppliers list
        queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        // Invalidate active suppliers list if status changed
        queryClient.invalidateQueries({ queryKey: ['suppliers', 'active'] });
      },
    }
  );
}

/**
 * useDeleteSupplier - Delete a supplier
 *
 * Example:
 *   const { mutate: deleteSupplier, isPending } = useDeleteSupplier(supplierId);
 *
 *   const handleDelete = () => {
 *     if (confirm('Delete this supplier?')) {
 *       deleteSupplier(undefined, {
 *         onSuccess: () => {
 *           toast.success('Supplier deleted');
 *         },
 *       });
 *     }
 *   };
 */
export function useDeleteSupplier(id: number) {
  const queryClient = useQueryClient();

  return useDeleteMutation(
    () => supplierService.deleteSupplier(id),
    {
      onSuccess: () => {
        // Remove from cache
        queryClient.removeQueries({ queryKey: ['suppliers', id] });
        // Invalidate list
        queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        // Invalidate active suppliers list
        queryClient.invalidateQueries({ queryKey: ['suppliers', 'active'] });
      },
    }
  );
}

/**
 * useSupplierProducts - Fetch products supplied by a specific supplier (API 6)
 *
 * Example:
 *   const { data: products, isPending } = useSupplierProducts(supplierId);
 */
export function useSupplierProducts(id: number | null) {
  return useGetQuery<SupplierProduct[]>(
    ['suppliers', id, 'products'],
    () => supplierService.getSupplierProducts(id!),
    {
      enabled: typeof id === 'number' && id > 0,
      staleTime: 0,
      gcTime: 0,
    }
  );
}

/**
 * useSupplierPurchaseOrders - Fetch purchase orders for a supplier (API 7)
 *
 * Example:
 *   const { data, isPending } = useSupplierPurchaseOrders(supplierId, {
 *     pageNumber: 1,
 *     pageSize: 10
 *   });
 */
export function useSupplierPurchaseOrders(
  id: number | null,
  params?: SupplierListQueryParams
) {
  return useGetQuery(
    ['suppliers', id, 'purchase-orders', params],
    () => supplierService.getSupplierPurchaseOrders(id!, params),
    {
      enabled: id !== null,
      staleTime: 5 * 60 * 1000,
    }
  );
}

/**
 * useSupplierBalance - Fetch supplier balance information (API 8)
 *
 * Example:
 *   const { data: balance, isPending } = useSupplierBalance(supplierId);
 */
export function useSupplierBalance(id: number | null) {
  return useGetQuery<SupplierBalance>(
    ['suppliers', id, 'balance'],
    () => supplierService.getSupplierBalance(id!),
    {
      enabled: id !== null,
      staleTime: 10 * 60 * 1000,
    }
  );
}

/**
 * useActiveSuppliers - Fetch all active suppliers (API 9)
 *
 * Example:
 *   const { data: activeSuppliers, isPending } = useActiveSuppliers();
 */
export function useActiveSuppliers() {
  return useGetQuery(
    ['suppliers', 'active'],
    () => supplierService.getActiveSuppliers(),
    {
      staleTime: 10 * 60 * 1000,
    }
  );
}

/**
 * useSuppliersByStatus - Fetch suppliers by status (API 10). Pass null to disable.
 */
export function useSuppliersByStatus(status: number | null) {
  return useGetQuery<Supplier[]>(
    ['suppliers', 'by-status', status],
    () => supplierService.getSuppliersByStatus(status!),
    {
      staleTime: 10 * 60 * 1000,
      enabled: status !== null && !Number.isNaN(status),
    }
  );
}
