/**
 * TableContent Component
 *
 * Renders the main table element with rows and cells.
 * Handles:
 * - Table rendering
 * - Row styling
 * - Expandable rows
 * - Sticky headers
 */

import React from 'react';
import { Table as TanstackTable, flexRender } from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface TableContentProps<TData> {
  table: TanstackTable<TData>;
  dense?: boolean;
  striped?: boolean;
  enableHover?: boolean;
  enableStickyHeader?: boolean;
  stickyHeaderHeight?: number;
  denseRowHeight?: number;
  tableClassName?: string;
  caption?: string;
  onRowClick?: (row: TData, rowIndex: number) => void;
  expandableRows?: {
    renderContent: (row: TData, rowIndex: number) => React.ReactNode;
    expandedRows?: Record<string, boolean>;
    onExpandedRowsChange?: (expanded: Record<string, boolean>) => void;
  };
  expandedRows?: Record<string, boolean>;
}

export function TableContent<TData>({
  table,
  dense = false,
  striped = false,
  enableHover = true,
  enableStickyHeader = false,
  stickyHeaderHeight = 0,
  denseRowHeight = 40,
  tableClassName,
  caption,
  onRowClick,
  expandableRows,
  expandedRows = {},
}: TableContentProps<TData>) {
  const { getHeaderGroups, getRowModel } = table;
  const rows = getRowModel().rows;

  return (
    <div
      className={cn(
        'relative overflow-auto rounded-lg border',
        enableStickyHeader && 'max-h-[600px]'
      )}
    >
      <Table className={tableClassName}>
        {caption && <caption className="sr-only">{caption}</caption>}

        {/* Table Header */}
        <TableHeader
          className={cn(
            enableStickyHeader && 'sticky top-0 z-10 bg-background'
          )}
        >
          {getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-b">
              {headerGroup.headers.map((header) => {
                const columnDef = header.column.columnDef as any;
                const label = columnDef.label || columnDef.header;

                return (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      'font-semibold',
                      columnDef.headerClassName,
                      // Sorting indicator
                      header.column.getCanSort() && 'cursor-pointer select-none'
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                    role={header.column.getCanSort() ? 'button' : undefined}
                    tabIndex={header.column.getCanSort() ? 0 : undefined}
                    onKeyDown={
                      header.column.getCanSort()
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              header.column.getToggleSortingHandler()?.({} as any);
                            }
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}

                      {/* Sort indicator */}
                      {header.column.getCanSort() && (
                        <span className="text-muted-foreground text-xs">
                          {header.column.getIsSorted() === 'asc' && ' ▲'}
                          {header.column.getIsSorted() === 'desc' && ' ▼'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        {/* Table Body */}
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="h-24 text-center text-muted-foreground"
              >
                No data available
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, rowIndex) => {
              const isExpanded = expandedRows[row.id];

              return (
                <React.Fragment key={row.id}>
                  {/* Main Row */}
                  <TableRow
                    className={cn(
                      enableHover && 'hover:bg-muted/50 transition-colors',
                      striped && rowIndex % 2 === 1 && 'bg-muted/20',
                      onRowClick && 'cursor-pointer',
                      dense && 'h-[' + denseRowHeight + 'px]'
                    )}
                    onClick={() => onRowClick?.(row.original, rowIndex)}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const columnDef = cell.column.columnDef as any;

                      return (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            columnDef.cellClassName,
                            dense && 'py-2'
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* Expanded Row Content */}
                  {expandableRows && isExpanded && (
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={table.getAllColumns().length} className="p-4">
                        {expandableRows.renderContent(row.original, rowIndex)}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

TableContent.displayName = 'TableContent';
