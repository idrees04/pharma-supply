/**
 * useTableQuery Hook
 *
 * Integrates @tanstack/react-query with table state management.
 * Handles server-side pagination, sorting, filtering, and caching.
 *
 * Philosophy:
 * - Server is the source of truth for data
 * - Query state drives table state changes
 * - Automatic refetch on state changes
 * - Built-in caching, retry, and deduplication
 * - Easy to test (mock the query function)
 */

import { useCallback, useMemo } from 'react';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import {
  TableDataResponse,
  TablePaginationState,
  TableQueryParams,
} from '../types';

interface UseTableQueryOptions<TData, TError = Error> {
  /**
   * Unique query key (for caching)
   */
  queryKey: string[];

  /**
   * Function to fetch table data from server
   * Must return TableDataResponse<TData>
   */
  queryFn: (params: TableQueryParams) => Promise<TableDataResponse<TData>>;

  /**
   * Current pagination state
   */
  pagination: TablePaginationState;

  /**
   * Current sorting state
   */
  sorting?: SortingState;

  /**
   * Current column filters
   */
  columnFilters?: ColumnFiltersState;

  /**
   * Current global filter
   */
  globalFilter?: string;

  /**
   * Enable/disable the query
   */
  enabled?: boolean;

  /**
   * Stale time (cache duration)
   */
  staleTime?: number;

  /**
   * Garbage collection time
   */
  gcTime?: number;

  /**
   * React Query options
   */
  queryOptions?: Omit<
    UseQueryOptions<TableDataResponse<TData>, TError>,
    'queryKey' | 'queryFn'
  >;
}

/**
 * Hook that fetches table data using React Query
 * Automatically builds query params from table state
 * Handles pagination, sorting, filtering server-side
 */
export function useTableQuery<TData, TError = Error>({
  queryKey,
  queryFn,
  pagination,
  sorting = [],
  columnFilters = [],
  globalFilter = '',
  enabled = true,
  staleTime = 1000 * 60 * 5, // 5 minutes
  gcTime = 1000 * 60 * 10, // 10 minutes
  queryOptions,
}: UseTableQueryOptions<TData, TError>) {
  /**
   * Build query params from table state
   * This memo ensures we only rebuild params when state actually changes
   */
  const queryParams = useMemo((): TableQueryParams => {
    return {
      page: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting:
        sorting.length > 0
          ? sorting.map((s) => ({
              id: s.id,
              desc: s.desc,
            }))
          : undefined,
      columnFilters:
        columnFilters.length > 0
          ? columnFilters.reduce(
              (acc, filter) => {
                acc[filter.id] = filter.value;
                return acc;
              },
              {} as Record<string, unknown>
            )
          : undefined,
      globalFilter: globalFilter || undefined,
    };
  }, [pagination, sorting, columnFilters, globalFilter]);

  /**
   * Build full query key including state
   * This ensures different states have different cache entries
   */
  const fullQueryKey = useMemo(() => {
    return [
      ...queryKey,
      {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting,
        columnFilters,
        globalFilter,
      },
    ];
  }, [queryKey, pagination, sorting, columnFilters, globalFilter]);

  /**
   * Execute the query
   */
  const query = useQuery<TableDataResponse<TData>, TError>({
    queryKey: fullQueryKey,
    queryFn: () => queryFn(queryParams),
    enabled,
    staleTime,
    gcTime,
    ...queryOptions,
  });

  /**
   * Extract commonly used values
   */
  const data = query.data?.items ?? [];
  const totalCount = query.data?.total ?? 0;
  const hasNextPage = query.data?.hasNextPage ?? false;
  const hasPreviousPage = query.data?.hasPreviousPage ?? false;

  /**
   * Refetch data
   */
  const refetch = useCallback(() => {
    return query.refetch();
  }, [query]);

  /**
   * Retry failed query
   */
  const retry = useCallback(() => {
    return query.refetch();
  }, [query]);

  return {
    // Data
    data,
    totalCount,
    hasNextPage,
    hasPreviousPage,
    raw: query.data,

    // Status
    isPending: query.isPending,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isRefetching: query.isRefetching,
    isError: query.isError,
    isSuccess: query.isSuccess,
    isLoadingError: query.isLoadingError,
    isPaused: query.isPaused,

    // Error
    error: query.error,

    // Actions
    refetch,
    retry,

    // Raw query object (for advanced use)
    query,
  };
}

export type UseTableQueryReturn<TData> = ReturnType<typeof useTableQuery<TData>>;
