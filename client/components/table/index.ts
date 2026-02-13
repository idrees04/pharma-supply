/**
 * Table Component Library
 *
 * Main entry point for the reusable table component system.
 * Exports all components, hooks, types, and utilities.
 */

// Main Component
export { CommonTable } from './CommonTable';

// Hooks
export { useTableState } from './hooks/useTableState';
export { useTableQuery } from './hooks/useTableQuery';

// Types
export type {
  TableDataResponse,
  TablePaginationState,
  TableFilterState,
  TableState,
  TableQueryParams,
  RowActionContext,
  CommonTableColumn,
  RowAction,
  ToolbarAction,
  CommonTableProps,
  TableContextType,
  FilterValue,
  SortDirection,
  ColumnAlignment,
} from './types';

// Subcomponents (for advanced customization)
export {
  TableToolbar,
  TableContent,
  TablePagination,
  TableLoadingState,
  TableEmptyState,
  TableErrorState,
} from './subcomponents';

// Utilities
export {
  filterDataGlobally,
  filterByColumnValue,
  filterByColumnRange,
  sortData,
  paginateData,
  getPageNumbers,
  sortingStateToString,
  columnFiltersToString,
  isDataFiltered,
  resetQueryParams,
  mergeQueryParams,
  getSelectedRows,
  formatPaginationInfo,
  debounce,
  memoize,
} from './utils';
