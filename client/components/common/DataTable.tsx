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
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
  id?: string;
  mobileHidden?: boolean;
  /** Explicit min column width (e.g. '80px'). Falls back to an auto-estimate from the header length. */
  minWidth?: string;
  /** Explicit max column width (e.g. '320px'). Only constrains growth; content can still wrap/truncate. */
  maxWidth?: string;
  /** Text alignment for both header and cell content. Defaults to 'left'. */
  align?: 'left' | 'center' | 'right';
}

/** Enterprise-standard page size choices; itemsPerPage is always included even if not in this list. */
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 150, 200];

/** Rough content-aware width estimate so short columns (e.g. "Status") don't reserve as much space as long ones. */
function estimateMinWidth(header: string): string {
  const px = Math.min(220, Math.max(88, header.length * 9 + 48));
  return `${px}px`;
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
  /** Keep API row order; disable client-side default ID sort and header sort toggles (use with server-side sorting). */
  preserveServerOrder?: boolean;
  /** Hide built-in pagination footer (use server-driven pagination outside the table). */
  hidePaginationFooter?: boolean;
  /**
   * Column to sort by before the user interacts with any header.
   * Direction defaults to ascending (`desc: false`) unless overridden, per
   * the standardized table convention used across the app.
   */
  defaultSort?: { id: string; desc?: boolean };
  /** Show a "Rows" page-size selector in the pagination footer. Defaults to true (ignored if hidePaginationFooter is set). */
  showPageSizeSelector?: boolean;
  /** Options for the page-size selector. Defaults to [10, 20, 50, 100, 150, 200]. */
  pageSizeOptions?: number[];
  /** Called when the user changes the page size via the selector. */
  onPageSizeChange?: (size: number) => void;
  /** Error message to display instead of the table body. When set (and isLoading is false), the table renders an error state. */
  error?: string | null;
  /** Retry handler shown alongside the error state, when provided. */
  onRetry?: () => void;
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
  preserveServerOrder = false,
  hidePaginationFooter = false,
  defaultSort,
  showPageSizeSelector = true,
  pageSizeOptions,
  onPageSizeChange,
  error = null,
  onRetry,
}: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>(() =>
    defaultSort ? [{ id: defaultSort.id, desc: defaultSort.desc ?? false }] : [],
  );
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [expandedRows, setExpandedRows] = React.useState<Record<string | number, boolean>>({});

  const resolvedPageSizeOptions = React.useMemo(() => {
    const opts = pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS;
    return opts.includes(itemsPerPage) ? opts : [...opts, itemsPerPage].sort((a, b) => a - b);
  }, [pageSizeOptions, itemsPerPage]);

  React.useEffect(() => {
    if (resetSortTrigger && resetSortTrigger > 0) {
      setSorting(defaultSort ? [{ id: defaultSort.id, desc: defaultSort.desc ?? false }] : []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          minWidth: col.minWidth ?? estimateMinWidth(col.header),
          maxWidth: col.maxWidth,
          align: col.align ?? 'left',
        } satisfies { label: string; minWidth: string; maxWidth?: string; align: 'left' | 'center' | 'right' },
        header: ({ column }) => {
          return (
            <div
              className={cn(
                'flex items-center gap-1 select-none group',
                preserveServerOrder ? 'cursor-default' : 'cursor-pointer',
                col.align === 'right' && 'justify-end',
                col.align === 'center' && 'justify-center',
                col.className,
                col.mobileHidden && 'hidden md:flex',
              )}
              onClick={preserveServerOrder ? undefined : () => column.toggleSorting()}
            >
              {col.header}
              {!preserveServerOrder ? (
                <ArrowUpDown className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
              ) : null}
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

    // Add expansion trigger only if custom renderer is provided
    if (renderExpandedRow) {
      cols.unshift({
        id: 'expander',
        meta: { label: '', minWidth: '48px', maxWidth: '48px' } satisfies { label: string; minWidth: string; maxWidth?: string },
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
        meta: {
          label: 'Actions',
          minWidth: onEdit && onDelete ? '96px' : '64px',
          maxWidth: onEdit && onDelete ? '96px' : '64px',
        } satisfies { label: string; minWidth: string; maxWidth?: string },
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
  }, [userColumns, onEdit, onDelete, expandedRows, renderExpandedRow, preserveServerOrder]);


  // Default client-side sorting by ID descending (latest first); skip when server supplies order
  const sortedData = React.useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    if (preserveServerOrder) return [...data];

    const copy = [...data];

    if (sorting.length === 0) {
      copy.sort((a, b) => {
        if (typeof a.id === 'number' && typeof b.id === 'number') {
          return b.id - a.id;
        }
        return 0;
      });
    }
    return copy;
  }, [data, sorting, preserveServerOrder]);

  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: itemsPerPage });

  const table = useReactTable({
    data: sortedData,
    columns,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    enableSorting: !preserveServerOrder,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handlePageSizeChange = (size: number) => {
    table.setPageSize(size);
    onPageSizeChange?.(size);
  };

  const columnCount = columns.length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="border border-border rounded-xl overflow-hidden bg-background shadow-sm w-full">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30 border-b">
                {Array.from({ length: columnCount }).map((_, i) => (
                  <TableHead key={i} className="h-11 px-4">
                    <Skeleton className="h-4 w-16" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 8 }).map((_, rowIdx) => (
                <TableRow key={rowIdx} className="border-b last:border-0">
                  {Array.from({ length: columnCount }).map((_, colIdx) => (
                    <TableCell key={colIdx} className="py-3 px-4">
                      <Skeleton
                        className="h-4"
                        style={{ width: colIdx === 0 ? '60%' : `${70 - (rowIdx % 3) * 10}%` }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-center text-sm text-muted-foreground animate-pulse">Loading data records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
            <RefreshCcw className="h-3.5 w-3.5" />
            Retry
          </Button>
        )}
      </Alert>
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
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as
                    | { label?: string; minWidth?: string; maxWidth?: string }
                    | undefined;
                  return (
                    <TableHead
                      key={header.id}
                      className="h-11 font-bold text-foreground whitespace-nowrap px-4 sticky top-0 bg-muted/90 backdrop-blur-sm z-10 before:absolute before:inset-0 before:-z-10 before:bg-background/50"
                      style={{ minWidth: meta?.minWidth, maxWidth: meta?.maxWidth }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
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
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta as
                        | { align?: 'left' | 'center' | 'right' }
                        | undefined;
                      return (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            'py-3 px-4',
                            meta?.align === 'right' && 'text-right',
                            meta?.align === 'center' && 'text-center',
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
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

      {!hidePaginationFooter ? (
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
        <div className="flex items-center gap-4">
          {showPageSizeSelector && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase text-muted-foreground hidden sm:inline">
                Rows
              </span>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium"
                value={table.getState().pagination.pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                aria-label="Rows per page"
              >
                {resolvedPageSizeOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          )}
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
      ) : null}
    </div>
  );
}
