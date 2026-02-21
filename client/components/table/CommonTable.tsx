/**
 * CommonTable Component
 *
 * A fully-featured, reusable table component for React applications.
 *
 * Features:
 * - Server-side pagination, sorting, filtering
 * - Row selection (single/multi)
 * - Column visibility toggle
 * - Column resizing
 * - Sticky headers
 * - Loading, empty, error states
 * - Row actions
 * - Toolbar actions
 * - Keyboard navigation
 * - Accessibility (ARIA)
 * - Responsive design
 *
 * Architecture:
 * - Modular: Breaks down into smaller subcomponents
 * - Composable: Can be extended with custom behaviors
 * - Performance: Uses React.memo, useMemo, useCallback
 * - Type-safe: Full TypeScript support
 * - Headless-friendly: Works with any UI library
 */

import React, { useMemo, useCallback, useState, ReactNode } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  Table as TanstackTable,
  Row as TanstackRow,
} from '@tanstack/react-table';
import { CommonTableProps, CommonTableColumn } from './types';
import {
  TableToolbar,
  TableContent,
  TablePagination,
  TableLoadingState,
  TableEmptyState,
  TableErrorState,
} from './subcomponents';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Main CommonTable component
 *
 * Type parameter TData: The shape of your data
 *
 * Example:
 *   const table = useReactTable<Product>({ ... });
 *   <CommonTable<Product> columns={columns} data={data} ... />
 */
const CommonTableComponent = React.forwardRef(
  <TData extends any>(
    {
      columns,
      data,
      totalCount,
      isLoading = false,
      error = null,
      onRetry,

      // Pagination
      pagination,
      onPaginationChange,

      // Sorting
      sorting,
      onSortingChange,

      // Filtering
      columnFilters,
      onColumnFiltersChange,
      globalFilter,
      onGlobalFilterChange,

      // Selection
      rowSelection,
      onRowSelectionChange,
      enableRowSelection = false,
      enableMultiSelect = true,

      // Column management
      enableColumnVisibility = true,
      columnVisibility,
      onColumnVisibilityChange,
      enableColumnResizing = false,

      // Actions
      rowActions,
      actionsPosition = 'end',
      toolbarActions,
      showToolbar = true,

      // Display options
      showColumnFilters = false,
      showPaginationInfo = true,
      enableStickyHeader = false,
      stickyHeaderHeight = 0,
      pageSize = 10,
      pageSizeOptions = [5, 10, 25, 50, 100],

      // Empty/Error states
      emptyStateMessage = 'No data found',
      emptyStateIcon,
      errorMessagePrefix = 'Failed to load data',

      // Behavior
      enableKeyboardNavigation = true,

      // Styling
      caption,
      className,
      tableClassName,
      dense = false,
      striped = false,
      enableHover = true,
      denseRowHeight = 40,

      // Events
      onRowClick,
      expandableRows,
    }: CommonTableProps<TData>,
    ref: React.ForwardedRef<HTMLDivElement>
  ) => {
    // State for uncontrolled mode
    const [internalPagination, setInternalPagination] = React.useState({
      pageIndex: 0,
      pageSize: pageSize,
    });
    const [internalSorting, setInternalSorting] = React.useState(sorting || []);
    const [internalColumnFilters, setInternalColumnFilters] = React.useState(columnFilters || []);
    const [internalGlobalFilter, setInternalGlobalFilter] = React.useState(globalFilter || '');
    const [internalColumnVisibility, setInternalColumnVisibility] = React.useState(columnVisibility || {});
    const [internalRowSelection, setInternalRowSelection] = React.useState(rowSelection || {});
    const [expandedRows, setExpandedRows] = React.useState(expandableRows?.expandedRows || {});

    // Use provided state or internal state (controlled vs uncontrolled)
    const paginationState = pagination || internalPagination;
    const sortingState = sorting !== undefined ? sorting : internalSorting;
    const columnFiltersState = columnFilters !== undefined ? columnFilters : internalColumnFilters;
    const globalFilterState = globalFilter !== undefined ? globalFilter : internalGlobalFilter;
    const columnVisibilityState = columnVisibility !== undefined ? columnVisibility : internalColumnVisibility;
    const rowSelectionState = rowSelection !== undefined ? rowSelection : internalRowSelection;

    // Handlers for state changes
    const handlePaginationChange = useCallback(
      (newPagination) => {
        onPaginationChange ? onPaginationChange(newPagination) : setInternalPagination(newPagination);
      },
      [onPaginationChange]
    );

    const handleSortingChange = useCallback(
      (updater) => {
        const newSorting = typeof updater === 'function' ? updater(sortingState) : updater;
        onSortingChange ? onSortingChange(newSorting) : setInternalSorting(newSorting);
      },
      [sortingState, onSortingChange]
    );

    const handleColumnFiltersChange = useCallback(
      (updater) => {
        const newFilters = typeof updater === 'function' ? updater(columnFiltersState) : updater;
        onColumnFiltersChange ? onColumnFiltersChange(newFilters) : setInternalColumnFilters(newFilters);
      },
      [columnFiltersState, onColumnFiltersChange]
    );

    const handleGlobalFilterChange = useCallback(
      (updater) => {
        const newFilter = typeof updater === 'function' ? updater(globalFilterState) : updater;
        onGlobalFilterChange ? onGlobalFilterChange(newFilter) : setInternalGlobalFilter(newFilter);
      },
      [globalFilterState, onGlobalFilterChange]
    );

    const handleColumnVisibilityChange = useCallback(
      (updater) => {
        const newVisibility =
          typeof updater === 'function' ? updater(columnVisibilityState) : updater;
        onColumnVisibilityChange ? onColumnVisibilityChange(newVisibility) : setInternalColumnVisibility(newVisibility);
      },
      [columnVisibilityState, onColumnVisibilityChange]
    );

    const handleRowSelectionChange = useCallback(
      (updater) => {
        const newSelection = typeof updater === 'function' ? updater(rowSelectionState) : updater;
        onRowSelectionChange ? onRowSelectionChange(newSelection) : setInternalRowSelection(newSelection);
      },
      [rowSelectionState, onRowSelectionChange]
    );

    // Build columns with selection column if enabled
    const tableColumns = useMemo(() => {
      const cols: ColumnDef<any>[] = [];

      if (enableRowSelection) {
        cols.push({
          id: 'select',
          header: ({ table }) => (
            <IndeterminateCheckbox
              checked={table.getIsAllRowsSelected()}
              indeterminate={table.getIsSomeRowsSelected()}
              onChange={table.getToggleAllRowsSelectedHandler()}
              aria-label="Select all rows"
            />
          ),
          cell: ({ row }) => (
            <IndeterminateCheckbox
              type={enableMultiSelect ? 'checkbox' : 'radio'}
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
              aria-label={`Select row ${row.index + 1}`}
            />
          ),
          size: 40,
          enableHiding: false,
          enableSorting: false,
          enableColumnFilter: false,
        });
      }

      if (expandableRows) {
        cols.push({
          id: 'expand',
          header: '',
          cell: ({ row }) => (
            <button
              onClick={() => {
                setExpandedRows((prev) => ({
                  ...prev,
                  [row.id]: !prev[row.id],
                }));
              }}
              className="cursor-pointer p-1"
              aria-label={`Toggle row ${row.index + 1}`}
            >
              {expandedRows[row.id] ? '▼' : '▶'}
            </button>
          ),
          size: 40,
          enableHiding: false,
          enableSorting: false,
          enableColumnFilter: false,
        });
      }

      cols.push(...(columns as ColumnDef<any>[]));

      const actionsCol: ColumnDef<any> = {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <TableRowActions
            row={row}
            rowActions={rowActions}
            selectedRowCount={Object.values(rowSelectionState).filter(Boolean).length}
          />
        ),
        size: 50,
        enableHiding: false,
        enableSorting: false,
        enableColumnFilter: false,
      };

      if (rowActions && rowActions.length > 0) {
        if (actionsPosition === 'start') {
          cols.splice(0, 0, actionsCol);
        } else {
          cols.push(actionsCol);
        }
      }

      return cols;
    }, [columns, enableRowSelection, enableMultiSelect, rowActions, rowSelectionState, expandableRows, expandedRows]);

    // Create table instance
    const table = useReactTable({
      data,
      columns: tableColumns,
      state: {
        pagination: paginationState,
        sorting: sortingState,
        columnFilters: columnFiltersState,
        globalFilter: globalFilterState,
        columnVisibility: columnVisibilityState,
        rowSelection: rowSelectionState,
      },
      onPaginationChange: handlePaginationChange,
      onSortingChange: handleSortingChange,
      onColumnFiltersChange: handleColumnFiltersChange,
      onGlobalFilterChange: handleGlobalFilterChange,
      onColumnVisibilityChange: handleColumnVisibilityChange,
      onRowSelectionChange: handleRowSelectionChange,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      enableRowSelection,
      enableMultiRowSelection: enableMultiSelect,
      manualPagination: !!onPaginationChange, // Server-side pagination
    });

    // Get selected rows
    const selectedRows = useMemo(() => {
      return table.getSelectedRowModel().rows.map((row) => row.original);
    }, [table]);

    // Render error state
    if (error) {
      return (
        <div ref={ref} className={cn('space-y-4', className)}>
          <TableErrorState
            error={error}
            onRetry={onRetry}
            errorMessagePrefix={errorMessagePrefix}
          />
        </div>
      );
    }

    // Render loading state
    if (isLoading) {
      return (
        <div ref={ref} className={cn('space-y-4', className)}>
          <TableLoadingState />
        </div>
      );
    }

    // Render empty state
    if (data.length === 0) {
      return (
        <div ref={ref} className={cn('space-y-4', className)}>
          <TableEmptyState message={emptyStateMessage} icon={emptyStateIcon} />
        </div>
      );
    }

    return (
      <div ref={ref} className={cn('space-y-4', className)}>
        {/* Toolbar */}
        {showToolbar && (
          <TableToolbar
            table={table}
            globalFilter={globalFilterState}
            onGlobalFilterChange={handleGlobalFilterChange}
            toolbarActions={toolbarActions}
            selectedRows={selectedRows}
            enableColumnVisibility={enableColumnVisibility}
          />
        )}

        {/* Table Content */}
        <TableContent
          table={table}
          dense={dense}
          striped={striped}
          enableHover={enableHover}
          enableStickyHeader={enableStickyHeader}
          stickyHeaderHeight={stickyHeaderHeight}
          denseRowHeight={denseRowHeight}
          tableClassName={tableClassName}
          caption={caption}
          onRowClick={onRowClick}
          expandableRows={expandableRows}
          expandedRows={expandedRows}
        />

        {/* Pagination */}
        <TablePagination
          table={table}
          totalCount={totalCount || data.length}
          showPaginationInfo={showPaginationInfo}
          pageSizeOptions={pageSizeOptions}
        />
      </div>
    );
  }
);

CommonTableComponent.displayName = 'CommonTable';

/**
 * TableRowActions Component
 * Renders action buttons for each row
 */
const TableRowActions = React.memo(
  ({ row, rowActions, selectedRowCount }: any) => {
    const visibleActions = rowActions.filter((action: any) => {
      if (action.isVisible) {
        return action.isVisible(row.original, selectedRowCount);
      }
      return true;
    });

    if (visibleActions.length === 0) {
      return null;
    }

    return (
      <div className="flex items-center gap-2">
        {visibleActions.map((action: any) => {
          const isDisabled = action.isDisabled ? action.isDisabled(row.original, selectedRowCount) : false;

          return (
            <button
              key={action.id}
              onClick={() => action.onClick({ row: row.original, rowIndex: row.index, selectedRows: [row.original] })}
              disabled={isDisabled}
              title={action.label}
              className={cn(
                'inline-flex items-center justify-center rounded-md transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                action.className
              )}
              aria-label={action.label}
            >
              {action.icon}
            </button>
          );
        })}
      </div>
    );
  }
);

/**
 * Indeterminate Checkbox Component
 */
function IndeterminateCheckbox({
  indeterminate,
  className = '',
  ...rest
}: { indeterminate?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  const ref = React.useRef<HTMLInputElement>(null!);

  React.useEffect(() => {
    if (typeof indeterminate === 'boolean') {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [ref, indeterminate, rest.checked]);

  return (
    <input
      type="checkbox"
      ref={ref}
      className={className + ' cursor-pointer'}
      {...rest}
    />
  );
}

// @ts-ignore - To support generic forwardRef
export const CommonTable = CommonTableComponent as <TData>(props: CommonTableProps<TData> & { ref?: React.ForwardedRef<HTMLDivElement> }) => React.ReactElement;

export default CommonTable;
