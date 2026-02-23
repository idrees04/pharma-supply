/**
 * Product Suppliers API Service
 *
 * This module encapsulates all API calls for product-supplier relationships.
 * It provides both raw service methods and custom React Query hooks.
 *
 * Architecture:
 * Component → Hook (useProductSuppliers, etc.) → Service (productSupplierService) → Requests
 *
 * API Base: https://mds.vtoxi.com/api/ProductSuppliers
 */

import { get, post, put, deleteRequest, RequestConfig } from '@/api/requests';
import {
  ProductSupplier,
  SupplierProductDetail,
  SupplierBalance,
  UpdateProductSupplierRequest,
  LinkProductSupplierRequest,
  BulkLinkProductSupplierRequest,
  BulkDelinktProductSupplierRequest,
  BulkLinkResponse,
  BulkDelinkResponse,
  GetProductSuppliersListResponse,
  GetProductSupplierResponse,
  UpdateProductSupplierResponse,
  DeleteProductSupplierResponse,
  GetProductSuppliersByProductResponse,
  GetSupplierProductsResponse,
  GetProductSuppliersBySupplierResponse,
  GetSupplierBalanceResponse,
  LinkProductSupplierResponse,
  BulkLinkProductSupplierResponse,
  BulkDelinkProductSupplierResponse,
} from '@/types/api/productSuppliers';
import {
  useGetQuery,
  usePostMutation,
  usePutMutation,
  useDeleteMutation,
} from '@/api/hooks';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Product Suppliers API Service
 *
 * All product supplier API calls go through this service object.
 * This keeps endpoint URLs and logic centralized and reusable.
 */
export const productSupplierService = {
  /**
   * API 1: GET /api/ProductSuppliers - Get all product suppliers
   */
  getProductSuppliers: async (
    config?: RequestConfig
  ): Promise<ProductSupplier[]> => {
    const response = await get<GetProductSuppliersListResponse>(
      '/api/ProductSuppliers',
      config
    );
    return response.data;
  },

  /**
   * API 2: GET /api/ProductSuppliers/:id - Get a single product supplier by ID
   */
  getProductSupplier: async (
    id: number,
    config?: RequestConfig
  ): Promise<ProductSupplier> => {
    const response = await get<GetProductSupplierResponse>(
      `/api/ProductSuppliers/${id}`,
      config
    );
    return response.data;
  },

  /**
   * API 3: PUT /api/ProductSuppliers/:id - Update a product supplier
   */
  updateProductSupplier: async (
    id: number,
    data: UpdateProductSupplierRequest,
    config?: RequestConfig
  ): Promise<ProductSupplier> => {
    const response = await put<UpdateProductSupplierResponse, UpdateProductSupplierRequest>(
      `/api/ProductSuppliers/${id}`,
      data,
      config
    );
    return response.data;
  },

  /**
   * API 4: DELETE /api/ProductSuppliers/:id - Delete a single product supplier
   */
  deleteProductSupplier: async (
    id: number,
    config?: RequestConfig
  ): Promise<void> => {
    await deleteRequest<DeleteProductSupplierResponse>(
      `/api/ProductSuppliers/${id}`,
      config
    );
  },

  /**
   * API 5: GET /api/ProductSuppliers/by-product/:productId - Get suppliers for a specific product
   */
  getProductSuppliersByProduct: async (
    productId: number,
    config?: RequestConfig
  ): Promise<ProductSupplier[]> => {
    const response = await get<GetProductSuppliersByProductResponse>(
      `/api/ProductSuppliers/by-product/${productId}`,
      config
    );
    return response.data;
  },

  /**
   * API 6: GET /api/Suppliers/:id/products - Get all products supplied by a supplier
   */
  getSupplierProducts: async (
    supplierId: number,
    config?: RequestConfig
  ): Promise<SupplierProductDetail[]> => {
    const response = await get<GetSupplierProductsResponse>(
      `/api/Suppliers/${supplierId}/products`,
      config
    );
    return response.data;
  },

  /**
   * API 7: GET /api/ProductSuppliers/by-supplier/:supplierId - Get all product-supplier links for a supplier
   */
  getProductSuppliersBySupplier: async (
    supplierId: number,
    config?: RequestConfig
  ): Promise<ProductSupplier[]> => {
    const response = await get<GetProductSuppliersBySupplierResponse>(
      `/api/ProductSuppliers/by-supplier/${supplierId}`,
      config
    );
    return response.data;
  },

  /**
   * API 8: GET /api/Suppliers/:id/balance - Get supplier balance information
   */
  getSupplierBalance: async (
    supplierId: number,
    config?: RequestConfig
  ): Promise<SupplierBalance> => {
    const response = await get<GetSupplierBalanceResponse>(
      `/api/Suppliers/${supplierId}/balance`,
      config
    );
    return response.data;
  },

  /**
   * API 9: POST /api/ProductSuppliers/link - Link a product to a supplier
   */
  linkProductSupplier: async (
    data: LinkProductSupplierRequest,
    config?: RequestConfig
  ): Promise<ProductSupplier> => {
    const response = await post<LinkProductSupplierResponse, LinkProductSupplierRequest>(
      '/api/ProductSuppliers/link',
      data,
      config
    );
    return response.data;
  },

  /**
   * API 10: POST /api/ProductSuppliers/bulk-link - Bulk link multiple products to a supplier
   */
  bulkLinkProductSuppliers: async (
    data: BulkLinkProductSupplierRequest,
    config?: RequestConfig
  ): Promise<BulkLinkResponse> => {
    const response = await post<BulkLinkProductSupplierResponse, BulkLinkProductSupplierRequest>(
      '/api/ProductSuppliers/bulk-link',
      data,
      config
    );
    return response.data;
  },

  /**
   * API 11: DELETE /api/ProductSuppliers/:id - Bulk delink multiple products from a supplier
   * Note: This endpoint uses DELETE method with a request body (unusual but per API spec)
   */
  bulkDelinkProductSuppliers: async (
    data: BulkDelinktProductSupplierRequest,
    config?: RequestConfig
  ): Promise<BulkDelinkResponse> => {
    // Note: This is a DELETE request with a body, which is unconventional
    // The API expects this format per the specification
    const response = await deleteRequest<BulkDelinkProductSupplierResponse>(
      `/api/ProductSuppliers`,
      {
        ...config,
        data: data,
      }
    );
    return response.data;
  },
};

/**
 * Custom Hooks for Product Suppliers
 *
 * These hooks combine React Query with the service layer.
 * Components should use these hooks instead of calling the service directly.
 */

/**
 * useProductSuppliers - Fetch all product suppliers
 *
 * Example:
 *   const { data, isPending, error } = useProductSuppliers();
 *
 *   if (isPending) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.userMessage}</div>;
 *
 *   return (
 *     <div>
 *       {data.map(supplier => (
 *         <ProductSupplierCard key={supplier.id} {...supplier} />
 *       ))}
 *     </div>
 *   );
 */
export function useProductSuppliers() {
  return useGetQuery(
    ['productSuppliers'],
    () => productSupplierService.getProductSuppliers(),
    {
      staleTime: 5 * 60 * 1000,
    }
  );
}

/**
 * useProductSupplier - Fetch a single product supplier by ID
 *
 * Example:
 *   const { data: productSupplier, isPending, error } = useProductSupplier(supplierId);
 *
 *   if (!productSupplier) return null;
 *   return <div>{productSupplier.productName} - {productSupplier.supplierName}</div>;
 */
export function useProductSupplier(id: number | null) {
  return useGetQuery(
    ['productSuppliers', id],
    () => productSupplierService.getProductSupplier(id!),
    {
      enabled: id !== null,
    }
  );
}

/**
 * useUpdateProductSupplier - Update a product supplier relationship
 *
 * Example:
 *   const { mutate: updateProductSupplier, isPending } = useUpdateProductSupplier(supplierId);
 *
 *   const handleSubmit = (formData: UpdateProductSupplierRequest) => {
 *     updateProductSupplier(formData, {
 *       onSuccess: () => {
 *         toast.success('Product supplier updated');
 *       },
 *       onError: (error) => {
 *         toast.error(error.userMessage);
 *       },
 *     });
 *   };
 */
export function useUpdateProductSupplier(id: number) {
  const queryClient = useQueryClient();

  return usePutMutation<ProductSupplier, UpdateProductSupplierRequest>(
    (data) => productSupplierService.updateProductSupplier(id, data),
    {
      onSuccess: (updated) => {
        // Update the single product supplier cache
        queryClient.setQueryData(['productSuppliers', id], updated);
        // Invalidate product suppliers list
        queryClient.invalidateQueries({ queryKey: ['productSuppliers'] });
        // Invalidate by-product queries
        queryClient.invalidateQueries({ queryKey: ['productSuppliers', 'by-product'] });
        // Invalidate by-supplier queries
        queryClient.invalidateQueries({ queryKey: ['productSuppliers', 'by-supplier'] });
      },
    }
  );
}

/**
 * useDeleteProductSupplier - Delete a product supplier relationship
 *
 * Example:
 *   const { mutate: deleteProductSupplier, isPending } = useDeleteProductSupplier(supplierId);
 *
 *   const handleDelete = () => {
 *     if (confirm('Delete this product supplier link?')) {
 *       deleteProductSupplier(undefined, {
 *         onSuccess: () => {
 *           toast.success('Product supplier deleted');
 *         },
 *       });
 *     }
 *   };
 */
export function useDeleteProductSupplier(id: number) {
  const queryClient = useQueryClient();

  return useDeleteMutation(
    () => productSupplierService.deleteProductSupplier(id),
    {
      onSuccess: () => {
        // Remove from cache
        queryClient.removeQueries({ queryKey: ['productSuppliers', id] });
        // Invalidate lists
        queryClient.invalidateQueries({ queryKey: ['productSuppliers'] });
        // Invalidate by-product queries
        queryClient.invalidateQueries({ queryKey: ['productSuppliers', 'by-product'] });
        // Invalidate by-supplier queries
        queryClient.invalidateQueries({ queryKey: ['productSuppliers', 'by-supplier'] });
      },
    }
  );
}

/**
 * useProductSuppliersByProduct - Fetch all suppliers for a specific product
 *
 * Example:
 *   const { data: suppliers, isPending } = useProductSuppliersByProduct(productId);
 *
 *   return (
 *     <div>
 *       {suppliers?.map(supplier => (
 *         <SupplierOption key={supplier.id} {...supplier} />
 *       ))}
 *     </div>
 *   );
 */
export function useProductSuppliersByProduct(productId: number | null) {
  return useGetQuery(
    ['productSuppliers', 'by-product', productId],
    () => productSupplierService.getProductSuppliersByProduct(productId!),
    {
      enabled: productId !== null,
      staleTime: 5 * 60 * 1000,
    }
  );
}

/**
 * useSupplierProducts - Fetch all products supplied by a supplier
 *
 * Example:
 *   const { data: products, isPending } = useSupplierProducts(supplierId);
 *
 *   return (
 *     <div>
 *       {products?.map(product => (
 *         <ProductCard key={product.productId} {...product} />
 *       ))}
 *     </div>
 *   );
 */
export function useSupplierProducts(supplierId: number | null) {
  return useGetQuery(
    ['suppliers', supplierId, 'products'],
    () => productSupplierService.getSupplierProducts(supplierId!),
    {
      enabled: supplierId !== null,
      staleTime: 10 * 60 * 1000,
    }
  );
}

/**
 * useProductSuppliersBySupplier - Fetch all product-supplier links for a supplier
 *
 * Example:
 *   const { data: productSuppliers, isPending } = useProductSuppliersBySupplier(supplierId);
 *
 *   return (
 *     <div>
 *       {productSuppliers?.map(ps => (
 *         <SupplierProductCard key={ps.id} {...ps} />
 *       ))}
 *     </div>
 *   );
 */
export function useProductSuppliersBySupplier(supplierId: number | null) {
  return useGetQuery<ProductSupplier[]>(
    ['productSuppliers', 'by-supplier', supplierId],
    () => productSupplierService.getProductSuppliersBySupplier(supplierId!),
    {
      enabled: supplierId !== null,
      staleTime: 5 * 60 * 1000,
    }
  );
}

/**
 * useSupplierBalance - Fetch supplier balance information
 *
 * Example:
 *   const { data: balance, isPending } = useSupplierBalance(supplierId);
 *
 *   return (
 *     <div>
 *       <p>Credit Limit: {balance?.creditLimit}</p>
 *       <p>Outstanding: {balance?.outstandingBalance}</p>
 *       <p>Available: {balance?.availableCredit}</p>
 *     </div>
 *   );
 */
export function useSupplierBalance(supplierId: number | null) {
  return useGetQuery(
    ['suppliers', supplierId, 'balance'],
    () => productSupplierService.getSupplierBalance(supplierId!),
    {
      enabled: supplierId !== null,
      staleTime: 10 * 60 * 1000,
    }
  );
}

/**
 * useLinkProductSupplier - Link a product to a supplier
 *
 * Example:
 *   const { mutate: linkProduct, isPending } = useLinkProductSupplier();
 *
 *   const handleLink = (productId: number, supplierId: number) => {
 *     linkProduct({
 *       productId,
 *       supplierId,
 *       supplierProductCode: 'SUP-001',
 *       supplierRate: 100,
 *       leadTimeDays: 7,
 *       minimumOrderQuantity: 10,
 *       discountPercentage: 0,
 *       isPreferredSupplier: false,
 *       notes: ''
 *     }, {
 *       onSuccess: () => {
 *         toast.success('Product linked to supplier');
 *       },
 *       onError: (error) => {
 *         toast.error(error.userMessage);
 *       },
 *     });
 *   };
 */
export function useLinkProductSupplier() {
  const queryClient = useQueryClient();

  return usePostMutation<ProductSupplier, LinkProductSupplierRequest>(
    (data) => productSupplierService.linkProductSupplier(data),
    {
      onSuccess: (created) => {
        // Invalidate product suppliers list
        queryClient.invalidateQueries({ queryKey: ['productSuppliers'] });
        // Invalidate by-product queries
        queryClient.invalidateQueries({ queryKey: ['productSuppliers', 'by-product'] });
        // Invalidate by-supplier queries
        queryClient.invalidateQueries({ queryKey: ['productSuppliers', 'by-supplier'] });
      },
    }
  );
}

/**
 * useBulkLinkProductSuppliers - Bulk link multiple products to a supplier
 *
 * Example:
 *   const { mutate: bulkLink, isPending } = useBulkLinkProductSuppliers();
 *
 *   const handleBulkLink = (supplierId: number, products: Array<...>) => {
 *     bulkLink({
 *       supplierId,
 *       products: [
 *         {
 *           productId: 1,
 *           supplierProductCode: 'SUP-001',
 *           supplierRate: 100,
 *           leadTimeDays: 7,
 *           minimumOrderQuantity: 10,
 *           discountPercentage: 0,
 *           isPreferredSupplier: false,
 *           notes: ''
 *         }
 *       ]
 *     }, {
 *       onSuccess: (result) => {
 *         toast.success(`Linked ${result.successfullyLinked} products`);
 *       },
 *     });
 *   };
 */
export function useBulkLinkProductSuppliers() {
  const queryClient = useQueryClient();

  return usePostMutation<BulkLinkResponse, BulkLinkProductSupplierRequest>(
    (data) => productSupplierService.bulkLinkProductSuppliers(data),
    {
      onSuccess: () => {
        // Invalidate all product supplier queries
        queryClient.invalidateQueries({ queryKey: ['productSuppliers'] });
        queryClient.invalidateQueries({ queryKey: ['productSuppliers', 'by-product'] });
        queryClient.invalidateQueries({ queryKey: ['productSuppliers', 'by-supplier'] });
      },
    }
  );
}

/**
 * useBulkDelinkProductSuppliers - Bulk delink multiple products from a supplier
 *
 * Note: This uses a custom mutation pattern because the API uses DELETE with a request body,
 * which is non-standard but per the API specification.
 *
 * Example:
 *   const { mutate: bulkDelink, isPending } = useBulkDelinkProductSuppliers();
 *
 *   const handleBulkDelink = (supplierId: number, productIds: number[]) => {
 *     bulkDelink({
 *       supplierId,
 *       productIds
 *     }, {
 *       onSuccess: (result) => {
 *         toast.success(`Delinked ${result.successfullyDelinked} products`);
 *       },
 *     });
 *   };
 */
export function useBulkDelinkProductSuppliers() {
  const queryClient = useQueryClient();

  return usePostMutation<BulkDelinkResponse, BulkDelinktProductSupplierRequest>(
    (data) => productSupplierService.bulkDelinkProductSuppliers(data),
    {
      onSuccess: () => {
        // Invalidate all product supplier queries
        queryClient.invalidateQueries({ queryKey: ['productSuppliers'] });
        queryClient.invalidateQueries({ queryKey: ['productSuppliers', 'by-product'] });
        queryClient.invalidateQueries({ queryKey: ['productSuppliers', 'by-supplier'] });
      },
    }
  );
}
