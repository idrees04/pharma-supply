/**
 * TablePagination Component
 *
 * Renders pagination controls with:
 * - Previous/Next buttons
 * - Page numbers
 * - Page size selector
 * - Pagination info
 */

import React, { useMemo } from 'react';
import { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPageNumbers, formatPaginationInfo } from '../utils';

interface TablePaginationProps<TData> {
  table: Table<TData>;
  totalCount?: number;
  showPaginationInfo?: boolean;
  pageSizeOptions?: number[];
}

export function TablePagination<TData>({
  table,
  totalCount,
  showPaginationInfo = true,
  pageSizeOptions = [5, 10, 25, 50, 100],
}: TablePaginationProps<TData>) {
  const { pagination } = table.getState();
  const pageIndex = pagination.pageIndex;
  const pageSize = pagination.pageSize;

  // Calculate total pages
  const dataLength = table.getRowModel().rows.length;
  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : Math.ceil(dataLength / pageSize);

  // Get page numbers for display
  const pageNumbers = useMemo(() => {
    return getPageNumbers(pageIndex, totalPages, 5);
  }, [pageIndex, totalPages]);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      {/* Page Size Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Rows per page:</span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => table.setPageSize(parseInt(value))}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pagination Info */}
      {showPaginationInfo && totalCount && (
        <span className="text-sm text-muted-foreground">
          {formatPaginationInfo(pageIndex, pageSize, totalCount)}
        </span>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((pageNum, idx) => {
            if (pageNum === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                  ...
                </span>
              );
            }

            const isCurrentPage = pageNum === pageIndex;

            return (
              <Button
                key={pageNum}
                variant={isCurrentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => table.setPageIndex(pageNum as number)}
                className={cn('h-8 w-8 p-0', isCurrentPage && 'cursor-default')}
                aria-label={`Go to page ${(pageNum as number) + 1}`}
                aria-current={isCurrentPage ? 'page' : undefined}
              >
                {(pageNum as number) + 1}
              </Button>
            );
          })}
        </div>

        {/* Next Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="gap-1"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

TablePagination.displayName = 'TablePagination';
