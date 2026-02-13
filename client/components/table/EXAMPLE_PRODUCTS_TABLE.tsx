/**
 * Example: Products Table with CommonTable
 *
 * This example demonstrates how to use the CommonTable component
 * with the HTTP layer for fetching and managing data.
 *
 * Key patterns:
 * 1. Use useTableState hook for table state management
 * 2. Use useTableQuery hook to fetch data from server
 * 3. Define typed columns with CommonTableColumn
 * 4. Integrate with React Query for caching and refetching
 * 5. Handle row actions (edit, delete)
 * 6. Handle toolbar actions (bulk operations)
 */

import React, { useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { Edit2, Trash2, Plus } from 'lucide-react';

import { CommonTable } from './CommonTable';
import { useTableState } from './hooks/useTableState';
import { useTableQuery } from './hooks/useTableQuery';
import { CommonTableColumn, RowAction, ToolbarAction, TableQueryParams } from './types';

// Import types from your HTTP layer
import { Product, productService } from '@/api/services/products';
import { useDeleteProduct } from '@/api/services/products';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Define your table columns
 * These are fully typed and extend TanStack React Table ColumnDef
 */
function getProductColumns(): CommonTableColumn<Product>[] {
  return [
    {
      accessorKey: 'name',
      label: 'Product Name',
      header: 'Product Name',
      sortable: true,
      filterable: true,
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'sku',
      label: 'SKU',
      header: 'SKU',
      sortable: true,
      filterable: true,
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'price',
      label: 'Price',
      header: 'Price',
      sortable: true,
      cell: (info) => {
        const value = info.getValue() as number;
        return `$${value.toFixed(2)}`;
      },
    },
    {
      accessorKey: 'quantity',
      label: 'Stock Quantity',
      header: 'Stock Quantity',
      sortable: true,
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'createdAt',
      label: 'Created Date',
      header: 'Created Date',
      sortable: true,
      cell: (info) => {
        const date = info.getValue() as string;
        return new Date(date).toLocaleDateString();
      },
    },
  ];
}

/**
 * Products Table Component
 * Shows complete example of using CommonTable with data fetching
 */
export function ProductsTable() {
  // 1. Manage table state
  const tableState = useTableState({
    initialPagination: { pageIndex: 0, pageSize: 10 },
  });

  // 2. Fetch data from server using React Query
  // This automatically refetches when filters, sorting, or pagination changes
  const tableQuery = useTableQuery({
    queryKey: ['products', 'table'],
    queryFn: (params: TableQueryParams) => productService.getProducts({
      page: params.page,
      pageSize: params.pageSize,
      search: params.globalFilter,
      sortBy: params.sorting?.[0]?.id as any,
      sortOrder: params.sorting?.[0]?.desc ? 'desc' : 'asc',
    }),
    pagination: tableState.pagination,
    sorting: tableState.sorting,
    columnFilters: tableState.columnFilters,
    globalFilter: tableState.globalFilter,
  });

  // 3. Manage mutations (edit, delete)
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct('');
  const queryClient = useQueryClient();

  // 4. Define row actions
  const rowActions = useMemo((): RowAction<Product>[] => [
    {
      id: 'edit',
      label: 'Edit',
      icon: <Edit2 className="h-4 w-4" />,
      onClick: ({ row }) => {
        // Handle edit - e.g., open dialog
        toast.info(`Edit product: ${row.name}`);
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
      onClick: ({ row }) => {
        if (confirm(`Delete product "${row.name}"?`)) {
          deleteProduct(undefined, {
            onSuccess: () => {
              toast.success('Product deleted');
              // Refetch table data
              queryClient.invalidateQueries({ queryKey: ['products', 'table'] });
            },
            onError: (error) => {
              toast.error(error.userMessage);
            },
          });
        }
      },
    },
  ], [deleteProduct, queryClient]);

  // 5. Define toolbar actions (bulk operations)
  const toolbarActions = useMemo((): ToolbarAction<Product>[] => [
    {
      id: 'delete-selected',
      label: 'Delete Selected',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
      showOnlyWhenSelected: true,
      onClick: async (selectedRows) => {
        if (confirm(`Delete ${selectedRows.length} products?`)) {
          // Implement bulk delete
          toast.success(`Deleted ${selectedRows.length} products`);
          queryClient.invalidateQueries({ queryKey: ['products', 'table'] });
        }
      },
    },
  ], [queryClient]);

  // 6. Get column definitions
  const columns = getProductColumns();

  // 7. Render table
  return (
    <CommonTable<Product>
      // Data
      columns={columns}
      data={tableQuery.data}
      totalCount={tableQuery.totalCount}

      // Loading/Error states
      isLoading={tableQuery.isPending}
      error={tableQuery.error}
      onRetry={() => tableQuery.refetch()}

      // Pagination
      pagination={tableState.pagination}
      onPaginationChange={tableState.setPageIndex}

      // Sorting
      sorting={tableState.sorting}
      onSortingChange={tableState.setSorting}

      // Filtering
      globalFilter={tableState.globalFilter}
      onGlobalFilterChange={tableState.setGlobalFilter}
      columnFilters={tableState.columnFilters}
      onColumnFiltersChange={tableState.setColumnFilters}

      // Row selection
      enableRowSelection={true}
      enableMultiSelect={true}
      rowSelection={tableState.rowSelection}
      onRowSelectionChange={tableState.setRowSelection}

      // Column management
      enableColumnVisibility={true}
      columnVisibility={tableState.columnVisibility}
      onColumnVisibilityChange={tableState.setColumnVisibility}

      // Actions
      rowActions={rowActions}
      toolbarActions={toolbarActions}

      // Display options
      showToolbar={true}
      enableStickyHeader={true}
      striped={true}
      enableHover={true}
      dense={false}

      // Empty state
      emptyStateMessage="No products found. Create your first product to get started."

      // Pagination options
      pageSize={10}
      pageSizeOptions={[5, 10, 25, 50]}
    />
  );
}

/**
 * Example: Client-side filtering version
 * If you want to fetch all data and filter/sort client-side
 */
export function ProductsTableClientSide() {
  const tableState = useTableState();
  const queryClient = useQueryClient();

  // Fetch all data (less efficient for large datasets)
  const { data: products = [], isPending, error } = useTableQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => {
      const result = await productService.getProducts({ pageSize: 1000 });
      return result;
    },
    pagination: tableState.pagination,
    sorting: tableState.sorting,
    columnFilters: tableState.columnFilters,
    globalFilter: tableState.globalFilter,
  });

  const columns = getProductColumns();

  return (
    <CommonTable<Product>
      columns={columns}
      data={products}
      isLoading={isPending}
      error={error}
      onRetry={() => queryClient.invalidateQueries({ queryKey: ['products', 'all'] })}
      pagination={tableState.pagination}
      onPaginationChange={tableState.setPageIndex}
      sorting={tableState.sorting}
      onSortingChange={tableState.setSorting}
      globalFilter={tableState.globalFilter}
      onGlobalFilterChange={tableState.setGlobalFilter}
      enableRowSelection={true}
      rowSelection={tableState.rowSelection}
      onRowSelectionChange={tableState.setRowSelection}
      enableColumnVisibility={true}
      columnVisibility={tableState.columnVisibility}
      onColumnVisibilityChange={tableState.setColumnVisibility}
      pageSize={10}
      pageSizeOptions={[5, 10, 25]}
    />
  );
}

export default ProductsTable;
