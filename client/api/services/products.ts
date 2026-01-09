/**
 * Products API Service
 *
 * This module demonstrates the service layer pattern:
 * - Encapsulates API calls for a specific domain (products)
 * - Provides typed interfaces for request/response data
 * - Centralizes endpoint URLs
 * - Adds domain-specific logic (e.g., filtering, sorting)
 * - Can be used by multiple components/pages
 *
 * Architecture:
 * Component (ProductList.tsx)
 *   ↓ (calls hook)
 * useProductList() hook
 *   ↓ (calls function)
 * productService.getProducts()
 *   ↓ (calls function)
 * get<Product[]>('/products')
 *   ↓ (calls interceptor)
 * Axios instance
 *   ↓ (calls)
 * Server /api/products endpoint
 *
 * This separation allows:
 * - Easy testing (mock productService)
 * - Endpoint changes in one place
 * - Reusable API logic across components
 * - Clear data flow
 */

import { get, post, put, patch, deleteRequest, RequestConfig } from '../requests';
import { useGetQuery, usePostMutation, usePutMutation, usePatchMutation, useDeleteMutation } from '../hooks';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Domain Types
 *
 * These types represent your domain model.
 * Should match your backend types for type safety.
 */
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  sku: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDTO {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  sku: string;
}

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  sku?: string;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProductFilter {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'price' | 'quantity' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Products API Service
 *
 * All API calls for products go through this service.
 * This keeps endpoint URLs and logic centralized.
 */
export const productService = {
  /**
   * Get all products with optional filtering
   */
  getProducts: async (filters?: ProductFilter, config?: RequestConfig): Promise<ProductListResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    }

    const url = `/products${params.toString() ? `?${params.toString()}` : ''}`;
    return get<ProductListResponse>(url, config);
  },

  /**
   * Get a single product by ID
   */
  getProduct: async (id: string, config?: RequestConfig): Promise<Product> => {
    return get<Product>(`/products/${id}`, config);
  },

  /**
   * Create a new product
   */
  createProduct: async (data: CreateProductDTO, config?: RequestConfig): Promise<Product> => {
    return post<Product, CreateProductDTO>('/products', data, config);
  },

  /**
   * Update entire product (replace)
   */
  updateProduct: async (id: string, data: UpdateProductDTO, config?: RequestConfig): Promise<Product> => {
    return put<Product, UpdateProductDTO>(`/products/${id}`, data, config);
  },

  /**
   * Partially update a product
   */
  patchProduct: async (id: string, data: Partial<UpdateProductDTO>, config?: RequestConfig): Promise<Product> => {
    return patch<Product, Partial<UpdateProductDTO>>(`/products/${id}`, data, config);
  },

  /**
   * Delete a product
   */
  deleteProduct: async (id: string, config?: RequestConfig): Promise<void> => {
    return deleteRequest<void>(`/products/${id}`, config);
  },

  /**
   * Bulk delete products
   */
  bulkDeleteProducts: async (ids: string[], config?: RequestConfig): Promise<void> => {
    return post<void, { ids: string[] }>('/products/bulk-delete', { ids }, config);
  },
};

/**
 * Custom Hooks for Products
 *
 * These hooks combine React Query with the service layer.
 * Components should use these hooks, not the service directly.
 */

/**
 * useProductList - Fetch products with optional filters
 *
 * Example:
 *   const { data, isPending, error } = useProductList({ page: 1, pageSize: 20 });
 *   
 *   if (isPending) return <div>Loading products...</div>;
 *   if (error) return <div>Error: {error.userMessage}</div>;
 *   
 *   return (
 *     <div>
 *       {data.items.map(product => <ProductCard key={product.id} {...product} />)}
 *     </div>
 *   );
 */
export function useProductList(filters?: ProductFilter) {
  return useGetQuery(
    ['products', filters], // Include filters in cache key for separate caching per filter
    () => productService.getProducts(filters),
    {
      // Products list can be cached longer since we have pagination
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

/**
 * useProduct - Fetch a single product
 *
 * Example:
 *   const { data: product, isPending, error } = useProduct(productId);
 */
export function useProduct(id: string) {
  return useGetQuery(
    ['products', id],
    () => productService.getProduct(id),
    {
      enabled: !!id, // Don't fetch if id is undefined
    }
  );
}

/**
 * useCreateProduct - Create a new product
 *
 * Example:
 *   const { mutate: createProduct, isPending, error } = useCreateProduct();
 *   
 *   const handleCreate = (formData: CreateProductDTO) => {
 *     createProduct(formData, {
 *       onSuccess: (newProduct) => {
 *         toast.success('Product created');
 *         navigate(`/products/${newProduct.id}`);
 *       },
 *       onError: (error) => {
 *         if (error.hasValidationErrors) {
 *           setFormErrors(error.validationErrors);
 *         } else {
 *           toast.error(error.userMessage);
 *         }
 *       },
 *     });
 *   };
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return usePostMutation<Product, CreateProductDTO>(
    (data) => productService.createProduct(data),
    {
      onSuccess: (newProduct) => {
        // Invalidate products list so it refetches
        queryClient.invalidateQueries({ queryKey: ['products'] });

        // Optionally set the new product in cache for instant access
        queryClient.setQueryData(['products', newProduct.id], newProduct);
      },
    }
  );
}

/**
 * useUpdateProduct - Update a product
 *
 * Example:
 *   const { mutate: updateProduct } = useUpdateProduct(productId);
 *   
 *   const handleSubmit = (formData: UpdateProductDTO) => {
 *     updateProduct(formData, {
 *       onSuccess: (updated) => {
 *         toast.success('Product updated');
 *       },
 *     });
 *   };
 */
export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();

  return usePutMutation<Product, UpdateProductDTO>(
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
 * usePatchProduct - Partially update a product
 */
export function usePatchProduct(id: string) {
  const queryClient = useQueryClient();

  return usePatchMutation<Product, Partial<UpdateProductDTO>>(
    (data) => productService.patchProduct(id, data),
    {
      onSuccess: (updated) => {
        queryClient.setQueryData(['products', id], updated);
        queryClient.invalidateQueries({ queryKey: ['products'] });
      },
    }
  );
}

/**
 * useDeleteProduct - Delete a product
 *
 * Example:
 *   const { mutate: deleteProduct } = useDeleteProduct(productId);
 *   
 *   const handleDelete = () => {
 *     if (confirm('Delete this product?')) {
 *       deleteProduct(undefined, {
 *         onSuccess: () => {
 *           toast.success('Product deleted');
 *           navigate('/products');
 *         },
 *       });
 *     }
 *   };
 */
export function useDeleteProduct(id: string) {
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
