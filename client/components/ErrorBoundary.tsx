/**
 * Error Boundary Component
 *
 * This component catches errors in child components and displays a fallback UI.
 * It's a critical safety net for production apps.
 *
 * React Error Boundaries:
 * - Only catch errors during render, not in event handlers or async code
 * - DO catch errors from lifecycle methods and constructors
 * - Must be class components (React limitation)
 * - Provide a graceful degradation instead of crashing the entire app
 *
 * This boundary specifically handles ApiErrors and shows appropriate messages.
 */

import React, { ReactNode, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ApiError, isApiError } from '@/api/errors';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state
    this.setState({
      error,
      errorInfo,
    });

    // Call optional handler (for logging to error tracking service)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  retry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.retry);
      }

      return <DefaultErrorFallback error={this.state.error!} retry={this.retry} />;
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI
 * Shows different messages based on error type
 */
function DefaultErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  const isApiError = error instanceof ApiError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg">
        <div className="p-8 text-center">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-red-100 p-3">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          {/* Error Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h1>

          {/* Error Message */}
          <p className="text-gray-600 mb-4">
            {isApiError ? error.userMessage : error.message}
          </p>

          {/* Additional Details (Development only) */}
          {import.meta.env.DEV && (
            <details className="mt-4 bg-gray-100 rounded p-3 text-left text-sm">
              <summary className="font-mono cursor-pointer text-gray-700">
                Error Details
              </summary>
              <pre className="mt-2 overflow-auto max-h-40 font-mono text-xs text-gray-600">
                {error.toString()}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}

          {/* API Error Details (if available) */}
          {isApiError && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3 text-left text-sm">
              <p className="text-blue-900">
                <strong>Error Type:</strong> {error.type}
              </p>
              {error.statusCode && (
                <p className="text-blue-900">
                  <strong>Status Code:</strong> {error.statusCode}
                </p>
              )}
              {error.hasValidationErrors && (
                <div className="mt-2">
                  <p className="text-blue-900 font-semibold mb-1">Validation Errors:</p>
                  <ul className="list-disc list-inside text-blue-900">
                    {Object.entries(error.validationErrors).map(([field, message]) => (
                      <li key={field}>
                        <strong>{field}:</strong>{' '}
                        {Array.isArray(message) ? message.join(', ') : message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <Button
              onClick={retry}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="flex-1"
            >
              Go Home
            </Button>
          </div>

          {/* Error ID for support */}
          {isApiError && (
            <p className="mt-4 text-xs text-gray-500">
              Error ID: {error.timestamp}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

export default ErrorBoundary;
