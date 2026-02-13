/**
 * API Error Module
 *
 * This module defines a comprehensive error handling strategy that normalizes
 * different types of HTTP errors (network, server, client) into a consistent
 * error structure. This approach allows components and error boundaries to
 * handle errors predictably without checking multiple error types.
 *
 * Why this approach:
 * - Separates concerns: HTTP errors are distinct from runtime errors
 * - Enables recovery strategies: Network errors might trigger retry, auth errors redirect to login
 * - Provides developer experience: Clear error properties and messages for debugging
 * - Type-safe: Full TypeScript support for catching and handling specific errors
 */

export enum ApiErrorType {
  // Network level errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',

  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST', // 400
  UNAUTHORIZED = 'UNAUTHORIZED', // 401
  FORBIDDEN = 'FORBIDDEN', // 403
  NOT_FOUND = 'NOT_FOUND', // 404
  CONFLICT = 'CONFLICT', // 409
  UNPROCESSABLE_ENTITY = 'UNPROCESSABLE_ENTITY', // 422
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS', // 429

  // Server errors (5xx)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR', // 500
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE', // 503
  BAD_GATEWAY = 'BAD_GATEWAY', // 502

  // Application errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Standard API error response shape from backend
 * Customize this based on your actual API response structure
 */
export interface ApiErrorResponse {
  status: number;
  message?: string;
  error?: string;
  errors?: Record<string, string | string[]>;
  timestamp?: string;
  path?: string;
}

/**
 * Normalized API Error class
 *
 * Provides consistent error handling across the application.
 * All HTTP errors are converted to this class for consistent error handling logic.
 */
export class ApiError extends Error {
  readonly type: ApiErrorType;
  readonly statusCode: number;
  readonly isRetryable: boolean;
  readonly isAuthError: boolean;
  readonly originalResponse?: ApiErrorResponse;
  readonly timestamp: number;

  constructor(
    message: string,
    type: ApiErrorType = ApiErrorType.UNKNOWN_ERROR,
    statusCode: number = 500,
    originalResponse?: ApiErrorResponse
  ) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.statusCode = statusCode;
    this.originalResponse = originalResponse;
    this.timestamp = Date.now();

    // Determine if error is retryable:
    // - Network errors are always retryable
    // - Timeout is retryable
    // - Rate limiting (429) is retryable with backoff
    // - Server errors (5xx) are retryable with exponential backoff
    // - Client errors (4xx, except 401/403) are NOT retryable
    this.isRetryable = [
      ApiErrorType.NETWORK_ERROR,
      ApiErrorType.TIMEOUT,
      ApiErrorType.TOO_MANY_REQUESTS,
      ApiErrorType.BAD_GATEWAY,
      ApiErrorType.SERVICE_UNAVAILABLE,
      ApiErrorType.INTERNAL_SERVER_ERROR,
    ].includes(type);

    // Auth errors require user action (re-login)
    this.isAuthError = [ApiErrorType.UNAUTHORIZED, ApiErrorType.FORBIDDEN].includes(type);

    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * User-friendly error message for UI display
   * Server error messages should be preferred if available
   */
  get userMessage(): string {
    if (this.originalResponse?.message) {
      return this.originalResponse.message;
    }

    const messages: Record<ApiErrorType, string> = {
      [ApiErrorType.NETWORK_ERROR]: 'Network connection failed. Please check your internet.',
      [ApiErrorType.TIMEOUT]: 'Request timed out. Please try again.',
      [ApiErrorType.BAD_REQUEST]: 'Invalid request. Please check your input.',
      [ApiErrorType.UNAUTHORIZED]: 'Your session has expired. Please log in again.',
      [ApiErrorType.FORBIDDEN]: 'You do not have permission to perform this action.',
      [ApiErrorType.NOT_FOUND]: 'Resource not found.',
      [ApiErrorType.CONFLICT]: 'Resource conflict. Please refresh and try again.',
      [ApiErrorType.UNPROCESSABLE_ENTITY]: 'Invalid data. Please check your input.',
      [ApiErrorType.TOO_MANY_REQUESTS]: 'Too many requests. Please wait a moment.',
      [ApiErrorType.INTERNAL_SERVER_ERROR]: 'Server error. Please try again later.',
      [ApiErrorType.SERVICE_UNAVAILABLE]: 'Service unavailable. Please try again later.',
      [ApiErrorType.BAD_GATEWAY]: 'Gateway error. Please try again later.',
      [ApiErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
    };

    return messages[this.type];
  }

  /**
   * Validation errors extracted from API response
   * Useful for form validation feedback
   */
  get validationErrors(): Record<string, string | string[]> {
    return this.originalResponse?.errors || {};
  }

  /**
   * Check if this is a validation error with field-specific feedback
   */
  get hasValidationErrors(): boolean {
    return Object.keys(this.validationErrors).length > 0;
  }
}

/**
 * Type guard to check if an error is an ApiError
 * Useful in catch blocks: if (isApiError(error)) { ... }
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Type guard to check if error is retryable
 * Used in retry interceptors and request handlers
 */
export function isRetryableError(error: unknown): error is ApiError {
  return isApiError(error) && error.isRetryable;
}

/**
 * Type guard to check if error requires authentication
 * Used to trigger login redirects or token refresh
 */
export function isAuthError(error: unknown): error is ApiError {
  return isApiError(error) && error.isAuthError;
}
