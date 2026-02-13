/**
 * Table State Components
 *
 * Components for displaying table states:
 * - Loading
 * - Empty
 * - Error
 */

import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Loader2, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * TableLoadingState
 * Shows loading skeleton or spinner while data is being fetched
 */
export function TableLoadingState() {
  return (
    <Card className="p-8">
      <div className="flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading data...</p>
      </div>
    </Card>
  );
}

TableLoadingState.displayName = 'TableLoadingState';

/**
 * TableEmptyState
 * Shows message when there's no data
 */
interface TableEmptyStateProps {
  message?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function TableEmptyState({
  message = 'No data found',
  icon = <Database className="h-12 w-12" />,
  action,
}: TableEmptyStateProps) {
  return (
    <Card className="p-8">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="text-muted-foreground">{icon}</div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">No data available</h3>
          <p className="text-muted-foreground">{message}</p>
        </div>
        {action && (
          <Button onClick={action.onClick} variant="outline" className="mt-4">
            {action.label}
          </Button>
        )}
      </div>
    </Card>
  );
}

TableEmptyState.displayName = 'TableEmptyState';

/**
 * TableErrorState
 * Shows error message with retry option
 */
interface TableErrorStateProps {
  error?: Error | null;
  onRetry?: () => void;
  errorMessagePrefix?: string;
}

export function TableErrorState({
  error,
  onRetry,
  errorMessagePrefix = 'Failed to load data',
}: TableErrorStateProps) {
  const errorMessage = error?.message || 'An unknown error occurred';

  return (
    <Card className="border-red-200 bg-red-50 p-8">
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <AlertCircle className="h-6 w-6 flex-shrink-0 text-red-600 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900">
              {errorMessagePrefix}
            </h3>
            <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
          </div>
        </div>
        {onRetry && (
          <div className="mt-2">
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Try again
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

TableErrorState.displayName = 'TableErrorState';

// Export as named exports and from index
export const TableLoadingState_ = TableLoadingState;
export const TableEmptyState_ = TableEmptyState;
export const TableErrorState_ = TableErrorState;
