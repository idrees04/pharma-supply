/**
 * Table Component Types
 *
 * Comprehensive type definitions for the reusable CommonTable component.
 * These types provide type safety across all table operations.
 */

import { ReactNode } from 'react';
import { ColumnDef, SortingState, ColumnFiltersState, VisibilityState } from '@tanstack/react-table';

/**
 * Table data response format (from API)
 * Standard pagination structure for server-side responses
 */
export interface TableDataResponse<TData> {
  items: TData[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Table pagination state
 */
export interface TablePaginationState {
  pageIndex: number;
  pageSize: number;
}

/**
 * Table filter state
 */
export interface TableFilterState {
  globalFilter?: string;
  columnFilters?: ColumnFiltersState;
}

/**
 * Table state (controlled)
 * Used when you want to manage table state outside the component
 */
export interface TableState {
  pagination: TablePaginationState;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
  columnVisibility: VisibilityState;
  rowSelection: Record<string, boolean>;
}

/**
 * Table query state
 * Parameters sent to server for fetching data
 */
export interface TableQueryParams {
  page: number;
  pageSize: number;
  sorting?: Array<{ id: string; desc: boolean }>;
  columnFilters?: Record<string, unknown>;
  globalFilter?: string;
}

/**
 * Row action context (info passed to action callbacks)
 */
export interface RowActionContext<TData> {
  row: TData;
  rowIndex: number;
  selectedRows: TData[];
}

/**
 * Column configuration for table
 * Extends @tanstack/react-table ColumnDef with custom properties
 */
export type CommonTableColumn<TData> = ColumnDef<TData> & {
  /**
   * Column header label
   */
  label?: string;

  /**
   * Enable filtering on this column
   */
  filterable?: boolean;

  /**
   * Enable sorting on this column
   */
  sortable?: boolean;

  /**
   * Minimum width for column
   */
  minWidth?: number;

  /**
   * Maximum width for column
   */
  maxWidth?: number;

  /**
   * Enable resizing on this column
   */
  enableResizing?: boolean;

  /**
   * Hide this column by default
   */
  hidden?: boolean;

  /**
   * Custom CSS class for header
   */
  headerClassName?: string;

  /**
   * Custom CSS class for cell
   */
  cellClassName?: string;

  /**
   * Custom filter component
   */
  filterComponent?: (value: unknown, onChange: (value: unknown) => void) => ReactNode;
};

/**
 * Row action definition
 */
export interface RowAction<TData> {
  /**
   * Unique action ID
   */
  id: string;

  /**
   * Action label (for tooltip)
   */
  label: string;

  /**
   * Action icon
   */
  icon: ReactNode;

  /**
   * Callback when action is triggered
   */
  onClick: (context: RowActionContext<TData>) => void | Promise<void>;

  /**
   * Determine if action should be enabled for row
   */
  isDisabled?: (row: TData, selectedCount: number) => boolean;

  /**
   * Determine if action should be visible for row
   */
  isVisible?: (row: TData, selectedCount: number) => boolean;

  /**
   * CSS class for the action button
   */
  className?: string;

  /**
   * Button variant
   */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
}

/**
 * Toolbar action definition
 * Actions that appear in table toolbar (usually for bulk operations)
 */
export interface ToolbarAction<TData> {
  /**
   * Unique action ID
   */
  id: string;

  /**
   * Action label
   */
  label: string;

  /**
   * Action icon
   */
  icon: ReactNode;

  /**
   * Callback when action is triggered
   */
  onClick: (selectedRows: TData[]) => void | Promise<void>;

  /**
   * Only show when rows are selected
   */
  showOnlyWhenSelected?: boolean;

  /**
   * CSS class for the button
   */
  className?: string;

  /**
   * Button variant
   */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
}

/**
 * Common table props
 * Props accepted by the CommonTable component
 */
export interface CommonTableProps<TData> {
  /**
   * Column definitions
   */
  columns: CommonTableColumn<TData>[];

  /**
   * Data to display
   * Can be static array or from React Query
   */
  data: TData[];

  /**
   * Total count of items (for pagination)
   */
  totalCount?: number;

  /**
   * Is data currently loading
   */
  isLoading?: boolean;

  /**
   * Error occurred while loading
   */
  error?: Error | null;

  /**
   * Callback to retry loading (for error states)
   */
  onRetry?: () => void;

  /**
   * Current pagination state
   */
  pagination?: TablePaginationState;

  /**
   * Callback when pagination changes
   */
  onPaginationChange?: (pagination: TablePaginationState) => void;

  /**
   * Current sorting state
   */
  sorting?: SortingState;

  /**
   * Callback when sorting changes
   */
  onSortingChange?: (sorting: SortingState) => void;

  /**
   * Current filter state
   */
  columnFilters?: ColumnFiltersState;

  /**
   * Callback when filters change
   */
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;

  /**
   * Global filter text
   */
  globalFilter?: string;

  /**
   * Callback when global filter changes
   */
  onGlobalFilterChange?: (filter: string) => void;

  /**
   * Row selection state
   */
  rowSelection?: Record<string, boolean>;

  /**
   * Callback when row selection changes
   */
  onRowSelectionChange?: (selection: Record<string, boolean>) => void;

  /**
   * Enable row selection
   */
  enableRowSelection?: boolean;

  /**
   * Enable multi-select (vs single select)
   */
  enableMultiSelect?: boolean;

  /**
   * Enable column visibility toggle
   */
  enableColumnVisibility?: boolean;

  /**
   * Column visibility state
   */
  columnVisibility?: VisibilityState;

  /**
   * Callback when column visibility changes
   */
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;

  /**
   * Enable column resizing
   */
  enableColumnResizing?: boolean;

  /**
   * Row actions (edit, delete, etc.)
   */
  rowActions?: RowAction<TData>[];

  /**
   * Position of the row actions column
   * @default 'end'
   */
  actionsPosition?: 'start' | 'end';

  /**
   * Toolbar actions (bulk operations)
   */
  toolbarActions?: ToolbarAction<TData>[];

  /**
   * Show toolbar
   */
  showToolbar?: boolean;

  /**
   * Show column filters
   */
  showColumnFilters?: boolean;

  /**
   * Show pagination info
   */
  showPaginationInfo?: boolean;

  /**
   * Enable sticky header
   */
  enableStickyHeader?: boolean;

  /**
   * Sticky header height (for calculating scroll)
   */
  stickyHeaderHeight?: number;

  /**
   * Items per page options for pagination
   */
  pageSize?: number;

  /**
   * Available page sizes
   */
  pageSizeOptions?: number[];

  /**
   * Custom empty state message
   */
  emptyStateMessage?: string;

  /**
   * Custom empty state icon
   */
  emptyStateIcon?: ReactNode;

  /**
   * Custom error message prefix
   */
  errorMessagePrefix?: string;

  /**
   * Enable keyboard navigation
   */
  enableKeyboardNavigation?: boolean;

  /**
   * Table caption (for accessibility)
   */
  caption?: string;

  /**
   * CSS class for table container
   */
  className?: string;

  /**
   * CSS class for table element
   */
  tableClassName?: string;

  /**
   * Enable dense mode (compact rows)
   */
  dense?: boolean;

  /**
   * Enable striped rows
   */
  striped?: boolean;

  /**
   * Enable hover highlight
   */
  enableHover?: boolean;

  /**
   * Row height in dense mode (pixels)
   */
  denseRowHeight?: number;

  /**
   * Callback when row is clicked
   */
  onRowClick?: (row: TData, rowIndex: number) => void;

  /**
   * Expandable rows configuration
   */
  expandableRows?: {
    /**
     * Render expanded row content
     */
    renderContent: (row: TData, rowIndex: number) => ReactNode;
    /**
     * Which rows are expanded
     */
    expandedRows?: Record<string, boolean>;
    /**
     * Callback when expanded rows change
     */
    onExpandedRowsChange?: (expanded: Record<string, boolean>) => void;
  };
}

/**
 * Table state context
 * Passed down to table components
 */
export interface TableContextType<TData> {
  data: TData[];
  columns: CommonTableColumn<TData>[];
  pagination: TablePaginationState;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
  columnVisibility: VisibilityState;
  rowSelection: Record<string, boolean>;
  isLoading: boolean;
  error: Error | null;
  totalCount?: number;
  selectedRows: TData[];
}

/**
 * Filter value type
 * Used for column filters
 */
export type FilterValue = string | number | boolean | Date | undefined | null;

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc' | false;

/**
 * Column alignment
 */
export type ColumnAlignment = 'left' | 'center' | 'right';
