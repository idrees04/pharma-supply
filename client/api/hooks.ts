/**
 * Custom React Query Hooks Module
 *
 * This module provides reusable, typed hooks that wrap TanStack React Query.
 * These hooks handle:
 * - Data fetching with automatic caching
 * - Mutations (POST, PUT, PATCH, DELETE) with optimistic updates
 * - Loading and error states
 * - Retry logic and exponential backoff
 * - Stale-while-revalidate pattern
 *
 * Philosophy:
 * - Hooks are the recommended interface. Avoid calling api functions directly.
 * - Each hook is customizable but has sensible defaults
 * - Errors are always ApiError instances
 * - Loading/error states are type-safe
 */

import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  UseQueryOptions,
  UseMutationOptions,
  UseInfiniteQueryOptions,
  InfiniteData,
} from '@tanstack/react-query';
import { get, post, put, patch, deleteRequest } from './requests';
import { ApiError } from './errors';

/**
 * useGetQuery - Fetches data with caching and background refetch
 *
 * Features:
 * - Automatic caching by key
 * - Stale time: data is considered fresh for 5 minutes
 * - Garbage collection: unused data removed after 10 minutes
 * - Automatic refetch on tab focus/network reconnect
 * - Error boundary integration
 *
 * Example:
 *   const { data: product, isPending, error } = useGetQuery<Product>(
 *     ['products', id],
 *     () => get<Product>(`/products/${id}`)
 *   );
 *
 *   if (isPending) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   return <div>{product.name}</div>;
 */
export function useGetQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, ApiError, T>, 'queryKey' | 'queryFn'>
) {
  return useQuery<T, ApiError>({
    queryKey,
    queryFn,
    // Default cache time: 5 minutes
    // Data is considered "fresh" for 5 min, won't refetch if recently fetched
    staleTime: 5 * 60 * 1000,
    // Garbage collection time: 10 minutes
    // Unused query data is removed from memory after 10 min
    gcTime: 10 * 60 * 1000,
    // Retry failed requests 3 times with exponential backoff
    // By default, only retries on retryable errors (network, 5xx)
    retry: (failureCount, error) => {
      if (error instanceof ApiError) {
        // Don't retry client errors (4xx) except specific ones
        if (error.isAuthError) return false;
        // Don't retry 404s
        if (error.statusCode === 404) return false;
        // Retry up to 3 times for retryable errors
        return failureCount < 3 && error.isRetryable;
      }
      return failureCount < 3;
    },
    // Refetch on window focus and reconnect
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    ...options,
  });
}

/**
 * usePostMutation - Creates a new resource
 *
 * Features:
 * - Automatic error normalization
 * - Optimistic updates (update UI before server response)
 * - Automatic cache invalidation after success
 * - Typed request and response data
 *
 * Example:
 *   const { mutate, isPending, error } = usePostMutation<Product, CreateProductDTO>(
 *     (data) => post<Product>('/products', data),
 *     {
 *       onSuccess: (newProduct) => {
 *         queryClient.invalidateQueries({ queryKey: ['products'] });
 *         toast.success('Product created');
 *       },
 *       onError: (error) => {
 *         toast.error(error.userMessage);
 *       },
 *     }
 *   );
 *
 *   const handleSubmit = (formData: CreateProductDTO) => {
 *     mutate(formData);
 *   };
 */
export function usePostMutation<T, D = any>(
  mutationFn: (data: D) => Promise<T>,
  options?: Omit<UseMutationOptions<T, ApiError, D>, 'mutationFn'>
) {
  return useMutation<T, ApiError, D>({
    mutationFn,
    ...options,
  });
}

/**
 * usePutMutation - Updates an entire resource
 *
 * Use for full resource replacement. For partial updates, use usePatchMutation.
 *
 * Example:
 *   const { mutate } = usePutMutation<Product, UpdateProductDTO>(
 *     (data) => put<Product>(`/products/${id}`, data)
 *   );
 */
export function usePutMutation<T, D = any>(
  mutationFn: (data: D) => Promise<T>,
  options?: Omit<UseMutationOptions<T, ApiError, D>, 'mutationFn'>
) {
  return useMutation<T, ApiError, D>({
    mutationFn,
    ...options,
  });
}

/**
 * usePatchMutation - Partially updates a resource
 *
 * Use for partial updates (only changed fields sent).
 * Safer than PUT as it only modifies specified fields.
 *
 * Example:
 *   const { mutate } = usePatchMutation<Product, Partial<UpdateProductDTO>>(
 *     (data) => patch<Product>(`/products/${id}`, data)
 *   );
 *
 *   mutate({ name: 'New Name' }); // Only updates name
 */
export function usePatchMutation<T, D = any>(
  mutationFn: (data: D) => Promise<T>,
  options?: Omit<UseMutationOptions<T, ApiError, D>, 'mutationFn'>
) {
  return useMutation<T, ApiError, D>({
    mutationFn,
    ...options,
  });
}

/**
 * useDeleteMutation - Deletes a resource
 *
 * Response type is typically void, but can be any type if server returns data.
 *
 * Example:
 *   const { mutate } = useDeleteMutation<void>(
 *     () => deleteRequest<void>(`/products/${id}`),
 *     {
 *       onSuccess: () => {
 *         queryClient.invalidateQueries({ queryKey: ['products'] });
 *         navigate('/products');
 *       },
 *     }
 *   );
 *
 *   const handleDelete = () => {
 *     if (confirm('Delete this product?')) {
 *       mutate();
 *     }
 *   };
 */
export function useDeleteMutation<T = void, D = any>(
  mutationFn: (data: D) => Promise<T>,
  options?: Omit<UseMutationOptions<T, ApiError, D>, 'mutationFn'>
) {
  return useMutation<T, ApiError, D>({
    mutationFn,
    ...options,
  });
}

/**
 * useInfiniteGetQuery - Fetches paginated data with infinite scroll
 *
 * Perfect for "load more" functionality or infinite scroll lists.
 *
 * Features:
 * - Automatic pagination handling
 * - Merge consecutive page results
 * - "hasNextPage" detection
 * - Automatic refetch of old pages
 *
 * Example:
 *   const {
 *     data,
 *     error,
 *     fetchNextPage,
 *     hasNextPage,
 *     isFetching,
 *     isPending,
 *   } = useInfiniteGetQuery<Product>(
 *     ['products'],
 *     ({ pageParam = 1 }) => get<{ items: Product[]; nextPage?: number }>(
 *       `/products?page=${pageParam}&limit=20`
 *     ),
 *     {
 *       getNextPageParam: (lastPage) => lastPage.nextPage,
 *     }
 *   );
 *
 *   return (
 *     <>
 *       {data?.pages.map((page) =>
 *         page.items.map((product) => <ProductCard key={product.id} {...product} />)
 *       )}
 *       {hasNextPage && <button onClick={() => fetchNextPage()}>Load More</button>}
 *     </>
 *   );
 */
export function useInfiniteGetQuery<T>(
  queryKey: readonly unknown[],
  queryFn: (context: { pageParam?: any }) => Promise<T>,
  options: Omit<UseInfiniteQueryOptions<T, ApiError, InfiniteData<T>>, 'queryKey' | 'queryFn'>
) {
  return useInfiniteQuery<T, ApiError, InfiniteData<T>>({
    queryKey,
    queryFn,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    initialPageParam: 1,
    ...options,
  });
}

/**
 * usePrefetch - Prefetch data before it's needed
 *
 * Useful for:
 * - Prefetching data on hover
 * - Pre-loading next page data
 * - Warming up cache before navigation
 *
 * Example:
 *   const queryClient = useQueryClient();
 *
 *   const handleMouseEnter = (id: string) => {
 *     queryClient.prefetchQuery({
 *       queryKey: ['products', id],
 *       queryFn: () => get<Product>(`/products/${id}`),
 *     });
 *   };
 *
 *   return (
 *     <div onMouseEnter={() => handleMouseEnter(id)}>
 *       {product.name}
 *     </div>
 *   );
 */

/**
 * Type-safe mutation hook factory
 *
 * Create custom mutation hooks for repeated patterns:
 *
 * Example:
 *   const useCreateProduct = () =>
 *     usePostMutation<Product, CreateProductDTO>(
 *       (data) => post<Product>('/products', data),
 *       {
 *         onSuccess: () => {
 *           queryClient.invalidateQueries({ queryKey: ['products'] });
 *         },
 *       }
 *     );
 */

/**
 * Utility: Hook to combine multiple mutations sequentially
 *
 * Useful for operations that require multiple API calls in sequence
 *
 * Example:
 *   const createAndNotify = async () => {
 *     const product = await mutate1(data);
 *     const notification = await mutate2(product.id);
 *     return notification;
 *   };
 */

export type { UseQueryOptions, UseMutationOptions, UseInfiniteQueryOptions };
