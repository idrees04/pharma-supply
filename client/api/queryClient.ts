/**
 * React Query Client Configuration
 *
 * This module creates and configures the QueryClient singleton.
 * The QueryClient manages:
 * - Query cache (storing fetched data)
 * - Mutation state
 * - Request deduplication
 * - Automatic refetch strategies
 *
 * The same QueryClient instance must be used throughout the app,
 * typically provided via QueryClientProvider in the root component.
 */

import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './errors';

/**
 * Create and configure the QueryClient instance
 *
 * Default options apply to all queries/mutations unless overridden per-hook.
 * Customize these based on your app's needs.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Fail silently on error, let components handle the error state
      throwOnError: false,

      // If set to false, queries won't refetch if there's an error
      // Most errors will be retried automatically, so data will load eventually
      retry: true,

      // Network requests are retried with exponential backoff
      // Default: 3 attempts total (0ms, 100ms, 300ms delays)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Query results are considered "fresh" for this time
      // During this time, queries won't refetch even if unmounted/remounted
      staleTime: 1000 * 60 * 5, // 5 minutes

      // Cache is garbage collected if not used for this time
      // This prevents unbounded memory growth on SPAs
      gcTime: 1000 * 60 * 10, // 10 minutes

      // Network requests are deduplicated for the same key
      // If 2 components mount and request the same data, only 1 request is made
      networkMode: 'always', // 'always', 'online', 'offlineFirst'
    },
    mutations: {
      throwOnError: false,
      // Don't retry mutations by default (POST, PUT, DELETE)
      // Retrying mutations can cause side effects (duplicate creates, etc.)
      // Instead, let the app handle mutation errors explicitly
      retry: false,
    },
  },
});

/**
 * Optional: Set up global error logger
 *
 * Useful for:
 * - Sending errors to error tracking service (Sentry, LogRocket)
 * - Logging request failures in production
 * - Analytics on user-facing errors
 */
export function setupErrorLogger() {
  // Whenever a mutation fails, log it
  queryClient.getDefaultOptions().mutations!.onError = (error) => {
    if (error instanceof ApiError) {
      // Example: Send to error tracking service
      console.error('[Mutation Error]', {
        type: error.type,
        status: error.statusCode,
        message: error.message,
        timestamp: error.timestamp,
      });

      // In production:
      // Sentry.captureException(error);
      // or
      // fetch('/api/logs/errors', { method: 'POST', body: JSON.stringify(error) });
    }
  };
}

/**
 * Optional: Set up global success logger for analytics
 */
export function setupSuccessLogger() {
  queryClient.getDefaultOptions().mutations!.onSuccess = (data, variables) => {
    // Log successful mutations for analytics
    if (import.meta.env.DEV) {
      console.log('[Mutation Success]', { data, variables });
    }
  };
}

export default queryClient;
