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
  ChevronLast,
  ChevronDown,
  ChevronUp,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
  id?: string;
  mobileHidden?: boolean;
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
  onRowClick?: (item: T) => void;
  renderExpandedRow?: (item: T) => React.ReactNode;
  resetSortTrigger?: number;
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
  onRowClick,
  renderExpandedRow,
  resetSortTrigger,
}: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [expandedRows, setExpandedRows] = React.useState<Record<string | number, boolean>>({});

  React.useEffect(() => {
    if (resetSortTrigger && resetSortTrigger > 0) {
      setSorting([]);
    }
  }, [resetSortTrigger]);

  const toggleRowExpansion = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Memoize columns for TanStack Table
  const columns = React.useMemo<ColumnDef<T, unknown>[]>(() => {
    const cols: ColumnDef<T>[] = userColumns.map((col, index) => {
      const id = col.id || (typeof col.accessor === 'string' ? col.accessor : `col-${index}`);

      return {
        id,
        meta: {
          label: col.header,
        } satisfies { label: string },
        header: ({ column }) => {
          return (
            <div
              className={cn(
                "flex items-center gap-1 cursor-pointer select-none group",
                col.className,
                col.mobileHidden && "hidden md:flex"
              )}
              onClick={() => column.toggleSorting()}
            >
              {col.header}
              <ArrowUpDown className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
            </div>
          );
        },
        accessorFn: typeof col.accessor === 'function' ? col.accessor : (row) => row[col.accessor as keyof T],
        cell: ({ row, getValue }) => {
          const value = getValue();
          const content = typeof col.accessor === 'function'
            ? col.accessor(row.original)
            : (value as React.ReactNode) || '-';

          return (
            <div className={cn(
              "transition-all duration-200",
              col.mobileHidden && "hidden md:block"
            )}>
              {typeof content === 'string' && content.length > 30 ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="max-w-[200px] truncate cursor-help">
                        {content}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{content}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                content
              )}
            </div>
          );
        },
      };
    });

    // Add expansion trigger if there are hidden columns or custom renderer
    const hasHiddenColumns = userColumns.some(c => c.mobileHidden);
    if (hasHiddenColumns || renderExpandedRow) {
      cols.unshift({
        id: 'expander',
        header: () => <div className="w-8 md:hidden" />,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            onClick={(e) => toggleRowExpansion(row.original.id!, e)}
          >
            {expandedRows[row.original.id!] ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        ),
      });
    }

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
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(row.original);
                }}
                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(row.original);
                }}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ),
      });
    }

    return cols;
  }, [userColumns, onEdit, onDelete, expandedRows, renderExpandedRow]);


  // Default client-side sorting by ID descending (latest first)
  const sortedData = React.useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    // Create a shallow copy to avoid mutating the original prop
    const copy = [...data];

    // Only apply default sort if no explicit sorting state is set in the table
    if (sorting.length === 0) {
      copy.sort((a, b) => {
        // If both objects have an 'id' property of type number
        if (typeof a.id === 'number' && typeof b.id === 'number') {
          return b.id - a.id;
        }
        return 0; // Fallback if no numeric ID
      });
    }
    return copy;
  }, [data, sorting]);

  const table = useReactTable({
    data: sortedData,
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
                    const columnTitle =
                      (column.columnDef.meta as { label?: string })?.label ?? column.id;

                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {columnTitle}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      <div className="border border-border rounded-xl overflow-x-auto overflow-y-hidden bg-background shadow-sm w-full relative group/table-wrapper">
        <Table className="w-full min-w-[600px] md:min-w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/30 hover:bg-muted/30 border-b">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-11 font-bold text-foreground whitespace-nowrap min-w-[120px] px-4 sticky top-0 bg-muted/90 backdrop-blur-sm z-10 before:absolute before:inset-0 before:-z-10 before:bg-background/50">
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
                <React.Fragment key={row.id}>
                  <TableRow
                    data-state={row.getIsSelected() && 'selected'}
                    className={cn(
                      "hover:bg-muted/50 transition-colors border-b last:border-0 group/row",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3 px-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Expanded Content for Mobile */}
                  <AnimatePresence>
                    {expandedRows[row.original.id!] && (
                      <TableRow className="bg-muted/20 border-b">
                        <TableCell colSpan={columns.length} className="p-0">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 space-y-3">
                              {/* Hidden columns display */}
                              <div className="grid grid-cols-1 gap-2 md:hidden">
                                {userColumns
                                  .filter(col => col.mobileHidden)
                                  .map((col, idx) => {
                                    const val = typeof col.accessor === 'function'
                                      ? col.accessor(row.original)
                                      : (row.original[col.accessor as keyof T] as React.ReactNode);

                                    return (
                                      <div key={idx} className="flex justify-between items-start border-b border-border/40 pb-2 last:border-0">
                                        <span className="text-xs font-bold text-muted-foreground uppercase">{col.header}</span>
                                        <div className="text-sm font-medium">{val || '-'}</div>
                                      </div>
                                    );
                                  })}
                              </div>
                              {/* Custom expanded content */}
                              {renderExpandedRow && renderExpandedRow(row.original)}
                            </div>
                          </motion.div>
                        </TableCell>
                      </TableRow>
                    )}
                  </AnimatePresence>
                </React.Fragment>
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
