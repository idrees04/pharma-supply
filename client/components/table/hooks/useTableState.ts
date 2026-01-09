/**
 * useTableState Hook
 *
 * Manages table state (pagination, sorting, filtering, etc.)
 * Can be used in controlled or uncontrolled mode.
 *
 * Why a separate hook:
 * - Separates state management from component logic
 * - Makes table state reusable across different table instances
 * - Makes testing easier (can test state logic independently)
 * - Allows composition of multiple table behaviors
 */

import { useState, useCallback, useMemo } from 'react';
import { SortingState, ColumnFiltersState, VisibilityState } from '@tanstack/react-table';
import {
  TablePaginationState,
  TableState,
  ColumnAlignment,
} from '../types';

interface UseTableStateOptions {
  /**
   * Initial pagination state
   */
  initialPagination?: Partial<TablePaginationState>;

  /**
   * Initial sorting state
   */
  initialSorting?: SortingState;

  /**
   * Initial column filters
   */
  initialColumnFilters?: ColumnFiltersState;

  /**
   * Initial global filter
   */
  initialGlobalFilter?: string;

  /**
   * Initial column visibility
   */
  initialColumnVisibility?: VisibilityState;

  /**
   * Initial row selection
   */
  initialRowSelection?: Record<string, boolean>;

  /**
   * Persist state to localStorage
   */
  persistKey?: string;

  /**
   * Page size
   */
  pageSize?: number;
}

/**
 * Hook that manages table state
 * Handles pagination, sorting, filtering, row selection, column visibility
 */
export function useTableState(options: UseTableStateOptions = {}) {
  const {
    initialPagination = { pageIndex: 0, pageSize: 10 },
    initialSorting = [],
    initialColumnFilters = [],
    initialGlobalFilter = '',
    initialColumnVisibility = {},
    initialRowSelection = {},
    persistKey,
    pageSize = 10,
  } = options;

  // Pagination state
  const [pagination, setPagination] = useState<TablePaginationState>(() => ({
    pageIndex: initialPagination.pageIndex ?? 0,
    pageSize: initialPagination.pageSize ?? pageSize,
  }));

  // Sorting state
  const [sorting, setSorting] = useState<SortingState>(initialSorting);

  // Column filters state
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialColumnFilters);

  // Global filter state
  const [globalFilter, setGlobalFilter] = useState<string>(initialGlobalFilter);

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(initialColumnVisibility);

  // Row selection state
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>(initialRowSelection);

  /**
   * Reset pagination to first page
   * Call this when filters or sorting change
   */
  const resetPagination = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }));
  }, []);

  /**
   * Set page
   */
  const setPageIndex = useCallback((pageIndex: number) => {
    setPagination((prev) => ({
      ...prev,
      pageIndex,
    }));
  }, []);

  /**
   * Set page size
   */
  const setPageSize = useCallback((pageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: 0, // Reset to first page when changing page size
      pageSize,
    }));
  }, []);

  /**
   * Handle sorting change
   * Resets pagination to first page when sorting changes
   */
  const handleSortingChange = useCallback((newSorting: SortingState | ((old: SortingState) => SortingState)) => {
    const nextSorting = typeof newSorting === 'function' ? newSorting(sorting) : newSorting;
    setSorting(nextSorting);
    resetPagination();
  }, [sorting, resetPagination]);

  /**
   * Handle column filters change
   * Resets pagination to first page when filters change
   */
  const handleColumnFiltersChange = useCallback(
    (newFilters: ColumnFiltersState | ((old: ColumnFiltersState) => ColumnFiltersState)) => {
      const nextFilters = typeof newFilters === 'function' ? newFilters(columnFilters) : newFilters;
      setColumnFilters(nextFilters);
      resetPagination();
    },
    [columnFilters, resetPagination]
  );

  /**
   * Handle global filter change
   * Resets pagination to first page when filter changes
   */
  const handleGlobalFilterChange = useCallback(
    (filter: string | ((old: string) => string)) => {
      const nextFilter = typeof filter === 'function' ? filter(globalFilter) : filter;
      setGlobalFilter(nextFilter);
      resetPagination();
    },
    [globalFilter, resetPagination]
  );

  /**
   * Handle column visibility change
   */
  const handleColumnVisibilityChange = useCallback(
    (newVisibility: VisibilityState | ((old: VisibilityState) => VisibilityState)) => {
      const nextVisibility = typeof newVisibility === 'function' ? newVisibility(columnVisibility) : newVisibility;
      setColumnVisibility(nextVisibility);
    },
    [columnVisibility]
  );

  /**
   * Handle row selection change
   */
  const handleRowSelectionChange = useCallback(
    (newSelection: Record<string, boolean> | ((old: Record<string, boolean>) => Record<string, boolean>)) => {
      const nextSelection = typeof newSelection === 'function' ? newSelection(rowSelection) : newSelection;
      setRowSelection(nextSelection);
    },
    [rowSelection]
  );

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setColumnFilters([]);
    setGlobalFilter('');
    resetPagination();
  }, [resetPagination]);

  /**
   * Clear all state
   */
  const resetState = useCallback(() => {
    setPagination({ pageIndex: 0, pageSize });
    setSorting([]);
    setColumnFilters([]);
    setGlobalFilter('');
    setColumnVisibility({});
    setRowSelection({});
  }, [pageSize]);

  /**
   * Get combined table state
   */
  const tableState = useMemo(
    (): TableState => ({
      pagination,
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
    }),
    [pagination, sorting, columnFilters, globalFilter, columnVisibility, rowSelection]
  );

  return {
    // State
    pagination,
    sorting,
    columnFilters,
    globalFilter,
    columnVisibility,
    rowSelection,
    tableState,

    // Pagination
    setPageIndex,
    setPageSize,

    // Sorting
    setSorting: handleSortingChange,

    // Filtering
    setColumnFilters: handleColumnFiltersChange,
    setGlobalFilter: handleGlobalFilterChange,
    clearFilters,

    // Column visibility
    setColumnVisibility: handleColumnVisibilityChange,

    // Row selection
    setRowSelection: handleRowSelectionChange,

    // Utils
    resetPagination,
    resetState,
  };
}

export type UseTableStateReturn = ReturnType<typeof useTableState>;
