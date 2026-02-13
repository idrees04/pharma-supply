/**
 * Table Utility Functions
 *
 * Helper functions for common table operations:
 * - Filtering
 * - Sorting
 * - Pagination
 * - Data transformation
 */

import { SortingState, ColumnFiltersState, Row } from '@tanstack/react-table';
import { FilterValue, TableQueryParams } from './types';

/**
 * Filter data globally by search term
 * Searches all string and number columns
 */
export function filterDataGlobally<TData extends Record<string, any>>(
  data: TData[],
  searchTerm: string,
  // Columns to search (if not provided, searches all)
  searchableColumns?: (keyof TData)[]
): TData[] {
  if (!searchTerm.trim()) {
    return data;
  }

  const lowerSearchTerm = searchTerm.toLowerCase();

  return data.filter((row) => {
    const columnsToSearch = searchableColumns ? searchableColumns : Object.keys(row);

    return columnsToSearch.some((col) => {
      const value = row[col];

      if (value === null || value === undefined) {
        return false;
      }

      if (typeof value === 'string') {
        return value.toLowerCase().includes(lowerSearchTerm);
      }

      if (typeof value === 'number') {
        return String(value).includes(lowerSearchTerm);
      }

      return false;
    });
  });
}

/**
 * Filter data by column value
 * Exact match
 */
export function filterByColumnValue<TData extends Record<string, any>>(
  data: TData[],
  columnId: keyof TData,
  value: FilterValue
): TData[] {
  if (value === undefined || value === null || value === '') {
    return data;
  }

  return data.filter((row) => {
    const cellValue = row[columnId];
    return cellValue === value;
  });
}

/**
 * Filter data by column range (for numbers, dates)
 */
export function filterByColumnRange<TData extends Record<string, any>>(
  data: TData[],
  columnId: keyof TData,
  minValue: number | Date,
  maxValue: number | Date
): TData[] {
  return data.filter((row) => {
    const cellValue = row[columnId];

    if (cellValue === null || cellValue === undefined) {
      return false;
    }

    return cellValue >= minValue && cellValue <= maxValue;
  });
}

/**
 * Sort data by multiple columns
 */
export function sortData<TData extends Record<string, any>>(
  data: TData[],
  sorting: SortingState
): TData[] {
  if (sorting.length === 0) {
    return data;
  }

  return [...data].sort((a, b) => {
    for (const { id, desc } of sorting) {
      const aValue = a[id as keyof TData];
      const bValue = b[id as keyof TData];

      // Handle null/undefined
      if (aValue === null || aValue === undefined) {
        return desc ? -1 : 1;
      }
      if (bValue === null || bValue === undefined) {
        return desc ? 1 : -1;
      }

      // Compare values
      let comparison = 0;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      if (comparison !== 0) {
        return desc ? -comparison : comparison;
      }
    }

    return 0;
  });
}

/**
 * Paginate data client-side
 */
export function paginateData<TData>(
  data: TData[],
  pageIndex: number,
  pageSize: number
): {
  items: TData[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  pageCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
} {
  const totalCount = data.length;
  const pageCount = Math.ceil(totalCount / pageSize);
  const startIndex = pageIndex * pageSize;
  const endIndex = startIndex + pageSize;
  const items = data.slice(startIndex, endIndex);

  return {
    items,
    pageIndex,
    pageSize,
    totalCount,
    pageCount,
    hasNextPage: pageIndex < pageCount - 1,
    hasPreviousPage: pageIndex > 0,
  };
}

/**
 * Get page numbers for pagination display
 * Shows current page, plus neighbors (e.g., [3, 4, 5, 6, 7] for page 5 of 100)
 */
export function getPageNumbers(
  currentPage: number,
  totalPages: number,
  windowSize: number = 5
): (number | string)[] {
  if (totalPages <= windowSize) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const pages: (number | string)[] = [];
  const halfWindow = Math.floor(windowSize / 2);
  let start = currentPage - halfWindow;
  let end = currentPage + halfWindow;

  if (start < 0) {
    start = 0;
    end = windowSize - 1;
  }

  if (end >= totalPages) {
    end = totalPages - 1;
    start = end - windowSize + 1;
  }

  // Add first page and ellipsis if needed
  if (start > 0) {
    pages.push(0);
    if (start > 1) {
      pages.push('...');
    }
  }

  // Add page range
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // Add ellipsis and last page if needed
  if (end < totalPages - 1) {
    if (end < totalPages - 2) {
      pages.push('...');
    }
    pages.push(totalPages - 1);
  }

  return pages;
}

/**
 * Convert sorting state to string for display
 */
export function sortingStateToString(sorting: SortingState): string {
  if (sorting.length === 0) {
    return 'No sorting applied';
  }

  return sorting
    .map((s) => `${s.id} ${s.desc ? 'descending' : 'ascending'}`)
    .join(', ');
}

/**
 * Convert column filters to string for display
 */
export function columnFiltersToString(filters: ColumnFiltersState): string {
  if (filters.length === 0) {
    return 'No filters applied';
  }

  return filters.map((f) => `${f.id}: ${f.value}`).join(', ');
}

/**
 * Check if data has been filtered
 */
export function isDataFiltered(
  columnFilters: ColumnFiltersState,
  globalFilter: string
): boolean {
  return columnFilters.length > 0 || (globalFilter && globalFilter.trim().length > 0);
}

/**
 * Reset query params
 */
export function resetQueryParams(): TableQueryParams {
  return {
    page: 0,
    pageSize: 10,
  };
}

/**
 * Merge query params
 */
export function mergeQueryParams(
  base: TableQueryParams,
  overrides: Partial<TableQueryParams>
): TableQueryParams {
  return {
    ...base,
    ...overrides,
  };
}

/**
 * Get selected rows from row selection record
 */
export function getSelectedRows<TData extends Record<string, any>>(
  data: TData[],
  rowSelection: Record<string, boolean>,
  getRowId?: (row: TData, index: number) => string
): TData[] {
  return data.filter((row, index) => {
    const rowId = getRowId ? getRowId(row, index) : String(index);
    return rowSelection[rowId];
  });
}

/**
 * Format pagination info for display
 */
export function formatPaginationInfo(
  pageIndex: number,
  pageSize: number,
  totalCount: number
): string {
  const startIndex = pageIndex * pageSize + 1;
  const endIndex = Math.min((pageIndex + 1) * pageSize, totalCount);
  return `Showing ${startIndex} to ${endIndex} of ${totalCount}`;
}

/**
 * Debounce function for search
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Memoize function based on input parameters
 * Useful for preventing unnecessary recalculations
 */
export function memoize<T extends (...args: any[]) => any>(func: T): T {
  const cache = new Map();

  return ((...args: any[]) => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);

    return result;
  }) as T;
}
