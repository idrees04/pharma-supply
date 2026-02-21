import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Settings2,
  Search,
  ChevronFirst,
  ChevronLast
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
  id?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  isLoading?: boolean;
  itemsPerPage?: number;
  emptyMessage?: string;
  showToolbar?: boolean;
  showSearch?: boolean;
  showColumnVisibility?: boolean;
}

export function DataTable<T extends { id?: string | number }>({
  columns: userColumns,
  data,
  onEdit,
  onDelete,
  isLoading = false,
  itemsPerPage = 10,
  emptyMessage = 'No data available',
  showToolbar = true,
  showSearch = true,
  showColumnVisibility = true,
}: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  // Memoize columns for TanStack Table
  const columns = React.useMemo<ColumnDef<T>[]>(() => {
    const cols: ColumnDef<T>[] = userColumns.map((col, index) => {
      const id = col.id || (typeof col.accessor === 'string' ? col.accessor : `col-${index}`);

      return {
        id,
        header: ({ column }) => {
          return (
            <div className={cn("flex items-center gap-1 cursor-pointer select-none", col.className)} onClick={() => column.toggleSorting()}>
              {col.header}
              <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
            </div>
          );
        },
        accessorFn: typeof col.accessor === 'function' ? col.accessor : (row) => row[col.accessor as keyof T],
        cell: ({ row, getValue }) => {
          const value = getValue();
          if (typeof col.accessor === 'function') {
            // If it's a function, we re-execute it with the row data to preserve original behavior
            return col.accessor(row.original);
          }
          return (value as React.ReactNode) || '-';
        },
      };
    });

    // Add Actions column if onEdit or onDelete is provided
    if (onEdit || onDelete) {
      cols.push({
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(row.original)}
                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(row.original)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ),
      });
    }

    return cols;
  }, [userColumns, onEdit, onDelete]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: itemsPerPage,
      },
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading data records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showToolbar && (showSearch || showColumnVisibility) && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
          {showSearch ? (
            <div className="relative w-full sm:max-w-sm group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Filter results..."
                value={globalFilter ?? ''}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-9 h-10 bg-muted/20 border-muted-foreground/20 focus:bg-background transition-all"
              />
            </div>
          ) : <div />}

          {showColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 ml-auto flex gap-2">
                  <Settings2 className="w-4 h-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px]">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      <div className="border border-border rounded-xl overflow-hidden bg-background shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/30 hover:bg-muted/30 border-b">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-11 font-bold text-foreground">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="hover:bg-muted/50 transition-colors border-b last:border-0"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Search className="w-8 h-8 opacity-20" />
                    <p>{emptyMessage}</p>
                    {globalFilter && (
                      <Button variant="link" onClick={() => setGlobalFilter('')} className="text-xs h-auto p-0">
                        Clear filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
        <div className="text-sm text-muted-foreground font-medium">
          Showing <span className="text-foreground">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span> - {' '}
          <span className="text-foreground">
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}
          </span> of {' '}
          <span className="text-foreground">{table.getFilteredRowModel().rows.length}</span> results
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronFirst className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center justify-center text-xs font-bold bg-muted h-8 px-3 rounded-md">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronLast className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
