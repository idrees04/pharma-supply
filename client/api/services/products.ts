/**
 * Products API Service
 *
 * This module encapsulates all API calls for products.
 * It provides both raw service methods and custom React Query hooks.
 *
 * Architecture:
 * Component → Hook (useProductList, etc.) → Service (productService) → Requests
 *
 * API Base: https://mds.vtoxi.com/api/Products
 */

import { get, post, put, deleteRequest, RequestConfig } from '../requests';
import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  GetProductsListResponse,
  CreateProductResponse,
  GetProductResponse,
  UpdateProductResponse,
  DeleteProductResponse,
  GetLowStockProductsResponse,
  ProductListQueryParams,
  PaginatedResponse,
} from '@/types/api/products';
import { useGetQuery, usePostMutation, usePutMutation, useDeleteMutation } from '../hooks';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Products API Service
 *
 * All product API calls go through this service object.
 * This keeps endpoint URLs and logic centralized and reusable.
 */
export const productService = {
  /**
   * Get all products with optional filtering and pagination
   */
  getProducts: async (
    params?: ProductListQueryParams,
    config?: RequestConfig
  ): Promise<PaginatedResponse<Product>> => {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.pageNumber !== undefined) queryParams.append('PageNumber', params.pageNumber.toString());
      if (params.pageSize !== undefined) queryParams.append('PageSize', params.pageSize.toString());
      if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);
      if (params.sortBy) queryParams.append('SortBy', params.sortBy);
      if (params.sortDescending !== undefined)
        queryParams.append('SortDescending', params.sortDescending.toString());
    }

    const url = `/api/Products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await get<GetProductsListResponse>(url, config);

    // Return just the data part, not the wrapper
    return response.data;
  },

  /**
   * Get a single product by ID
   */
  getProduct: async (id: number, config?: RequestConfig): Promise<Product> => {
    const response = await get<GetProductResponse>(`/api/Products/${id}`, config);
    return response.data;
  },

  /**
   * Create a new product
   */
  createProduct: async (
    data: CreateProductRequest,
    config?: RequestConfig
  ): Promise<Product> => {
    const response = await post<CreateProductResponse, CreateProductRequest>(
      '/api/Products',
      data,
      config
    );
    return response.data;
  },

  /**
   * Update a product
   */
  updateProduct: async (
    id: number,
    data: UpdateProductRequest,
    config?: RequestConfig
  ): Promise<Product> => {
    const response = await put<UpdateProductResponse, UpdateProductRequest>(
      `/api/Products/${id}`,
      data,
      config
    );
    return response.data;
  },

  /**
   * Delete a product
   */
  deleteProduct: async (id: number, config?: RequestConfig): Promise<void> => {
    await deleteRequest<DeleteProductResponse>(`/api/Products/${id}`, config);
  },

  /**
   * Get low stock products
   * Returns products where availableQuantity <= reorderLevel
   */
  getLowStockProducts: async (config?: RequestConfig): Promise<Product[]> => {
    const response = await get<GetLowStockProductsResponse>('/api/Products/low-stock', config);
    return response.data;
  },
};

/**
 * Custom Hooks for Products
 *
 * These hooks combine React Query with the service layer.
 * Components should use these hooks instead of calling the service directly.
 */

/**
 * useProductList - Fetch products with optional filters and pagination
 *
 * Example:
 *   const { data, isPending, error } = useProductList({
 *     pageNumber: 1,
 *     pageSize: 20,
 *     searchTerm: 'paracetamol'
 *   });
 *
 *   if (isPending) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.userMessage}</div>;
 *
 *   return (
 *     <div>
 *       {data.items.map(product => <ProductCard key={product.id} {...product} />)}
 *     </div>
 *   );
 */
export function useProductList(params?: ProductListQueryParams) {
  return useGetQuery(
    ['products', params],
    () => productService.getProducts(params),
    {
      // Products list can be cached for 5 minutes since pagination changes the cache key
      staleTime: 5 * 60 * 1000,
    }
  );
}

/**
 * useProduct - Fetch a single product by ID
 *
 * Example:
 *   const { data: product, isPending, error } = useProduct(productId);
 *
 *   if (!product) return null;
 *   return <div>{product.productName}</div>;
 */
export function useProduct(id: number | null) {
  return useGetQuery(
    ['products', id],
    () => productService.getProduct(id!),
    {
      enabled: id !== null, // Don't fetch if id is null
    }
  );
}

/**
 * useCreateProduct - Create a new product
 *
 * Example:
 *   const { mutate: createProduct, isPending, error } = useCreateProduct();
 *
 *   const handleSubmit = (formData: CreateProductRequest) => {
 *     createProduct(formData, {
 *       onSuccess: () => {
 *         toast.success('Product created successfully');
 *         closeDialog();
 *       },
 *       onError: (error) => {
 *         toast.error(error.userMessage);
 *       },
 *     });
 *   };
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return usePostMutation<Product, CreateProductRequest>(
    (data) => productService.createProduct(data),
    {
      onSuccess: () => {
        // Invalidate products list to refetch updated data
        queryClient.invalidateQueries({ queryKey: ['products'] });
      },
    }
  );
}

/**
 * useUpdateProduct - Update a product
 *
 * Example:
 *   const { mutate: updateProduct, isPending } = useUpdateProduct(productId);
 *
 *   const handleSubmit = (formData: UpdateProductRequest) => {
 *     updateProduct(formData, {
 *       onSuccess: () => {
 *         toast.success('Product updated');
 *       },
 *     });
 *   };
 */
export function useUpdateProduct(id: number) {
  const queryClient = useQueryClient();

  return usePutMutation<Product, UpdateProductRequest>(
    (data) => productService.updateProduct(id, data),
    {
      onSuccess: (updated) => {
        // Update the single product cache
        queryClient.setQueryData(['products', id], updated);
        // Invalidate products list
        queryClient.invalidateQueries({ queryKey: ['products'] });
      },
    }
  );
}

/**
 * useDeleteProduct - Delete a product
 *
 * Example:
 *   const { mutate: deleteProduct, isPending } = useDeleteProduct(productId);
 *
 *   const handleDelete = () => {
 *     if (confirm('Delete this product?')) {
 *       deleteProduct(undefined, {
 *         onSuccess: () => {
 *           toast.success('Product deleted');
 *         },
 *       });
 *     }
 *   };
 */
export function useDeleteProduct(id: number) {
  const queryClient = useQueryClient();

  return useDeleteMutation(
    () => productService.deleteProduct(id),
    {
      onSuccess: () => {
        // Remove from cache
        queryClient.removeQueries({ queryKey: ['products', id] });
        // Invalidate list
        queryClient.invalidateQueries({ queryKey: ['products'] });
      },
    }
  );
}

/**
 * useLowStockProducts - Fetch products with low stock
 *
 * Example:
 *   const { data: lowStockProducts, isPending, error } = useLowStockProducts();
 *
 *   if (isPending) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.userMessage}</div>;
 *
 *   return (
 *     <div>
 *       Found {lowStockProducts.length} products with low stock
 *     </div>
 *   );
 */
export function useLowStockProducts() {
  return useGetQuery(
    ['products', 'low-stock'],
    () => productService.getLowStockProducts(),
    {
      staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    }
  );
}
