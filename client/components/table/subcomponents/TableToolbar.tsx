/**
 * TableToolbar Component
 * 
 * Displays toolbar with:
 * - Global search/filter
 * - Column visibility toggle
 * - Bulk actions
 */

import React, { useCallback } from 'react';
import { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Search, Settings2, X } from 'lucide-react';
import { ToolbarAction } from '../types';
import { cn } from '@/lib/utils';

interface TableToolbarProps<TData> {
  table: Table<TData>;
  globalFilter: string;
  onGlobalFilterChange: (filter: string) => void;
  toolbarActions?: ToolbarAction<TData>[];
  selectedRows: TData[];
  enableColumnVisibility: boolean;
}

export function TableToolbar<TData>({
  table,
  globalFilter,
  onGlobalFilterChange,
  toolbarActions,
  selectedRows,
  enableColumnVisibility,
}: TableToolbarProps<TData>) {
  const handleClearFilter = useCallback(() => {
    onGlobalFilterChange('');
  }, [onGlobalFilterChange]);

  const visibleToolbarActions = toolbarActions?.filter(
    (action) => !action.showOnlyWhenSelected || selectedRows.length > 0
  ) || [];

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={globalFilter}
          onChange={(e) => onGlobalFilterChange(e.target.value)}
          className="pl-10"
          aria-label="Filter table"
        />
        {globalFilter && (
          <button
            onClick={handleClearFilter}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Toolbar Actions */}
      {visibleToolbarActions.length > 0 && (
        <div className="flex items-center gap-2">
          {visibleToolbarActions.map((action) => (
            <Button
              key={action.id}
              onClick={() => action.onClick(selectedRows)}
              variant={action.variant || 'outline'}
              size="sm"
              className={cn(action.className)}
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Column Visibility Dropdown */}
      {enableColumnVisibility && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Columns</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {table.getAllLeafColumns().map((column) => {
              const columnDef = column.columnDef as any;
              const label = columnDef.label || columnDef.header || column.id;

              return (
                <DropdownMenuItem
                  key={column.id}
                  onClick={() => column.toggleVisibility()}
                  className="cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={column.getIsVisible()}
                    onChange={() => column.toggleVisibility()}
                    className="mr-2 cursor-pointer"
                    aria-label={`Toggle ${label} column`}
                  />
                  <span>{label}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

TableToolbar.displayName = 'TableToolbar';
