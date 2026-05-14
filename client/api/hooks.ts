import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  UseQueryOptions,
  UseMutationOptions,
  UseInfiniteQueryOptions,
  InfiniteData,
} from '@tanstack/react-query';
import { ApiError } from './errors';

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


export function usePostMutation<T, D = any>(
  mutationFn: (data: D) => Promise<T>,
  options?: Omit<UseMutationOptions<T, ApiError, D>, 'mutationFn'>
) {
  return useMutation<T, ApiError, D>({
    mutationFn,
    ...options,
  });
}


export function usePutMutation<T, D = any>(
  mutationFn: (data: D) => Promise<T>,
  options?: Omit<UseMutationOptions<T, ApiError, D>, 'mutationFn'>
) {
  return useMutation<T, ApiError, D>({
    mutationFn,
    ...options,
  });
}


export function usePatchMutation<T, D = any>(
  mutationFn: (data: D) => Promise<T>,
  options?: Omit<UseMutationOptions<T, ApiError, D>, 'mutationFn'>
) {
  return useMutation<T, ApiError, D>({
    mutationFn,
    ...options,
  });
}


export function useDeleteMutation<T = void, D = any>(
  mutationFn: (data: D) => Promise<T>,
  options?: Omit<UseMutationOptions<T, ApiError, D>, 'mutationFn'>
) {
  return useMutation<T, ApiError, D>({
    mutationFn,
    ...options,
  });
}


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
export type { UseQueryOptions, UseMutationOptions, UseInfiniteQueryOptions };









