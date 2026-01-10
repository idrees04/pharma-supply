/**
 * Axios Instance Module
 *
 * This module creates and configures a centralized Axios instance with
 * request and response interceptors. This approach:
 *
 * 1. Ensures consistent HTTP configuration across the app
 * 2. Handles token injection automatically (no manual token passing)
 * 3. Normalizes errors consistently (all errors become ApiError)
 * 4. Enables global error handling and logging
 * 5. Makes testing easier by mocking a single instance
 *
 * Why Axios over Fetch:
 * - Request/response interceptors for cross-cutting concerns (auth, logging, error handling)
 * - Automatic JSON serialization/deserialization
 * - Request cancellation out of the box
 * - Better TypeScript integration
 * - Timeout handling
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError, ApiErrorType, ApiErrorResponse } from './errors';

/**
 * Configuration constants
 * In production, use environment variables instead of hardcoding
 * Example: baseURL: import.meta.env.VITE_API_BASE_URL || 'https://mds.vtoxi.com'
 */
const API_CONFIG = {
  // External API endpoint: https://mds.vtoxi.com
  // For development with local backend, use '/api' instead
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://mds.vtoxi.com',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // milliseconds
};

/**
 * Create and configure the Axios instance
 * This is called once at app startup
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 *
 * Runs before every request. Used for:
 * - Attaching authentication tokens
 * - Adding request metadata (correlation IDs, timestamps)
 * - Logging outgoing requests
 * - Validating request data
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Attach authentication token if available
    // This keeps components unaware of token handling
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add correlation ID for request tracing (helpful for debugging and server logs)
    config.headers['X-Request-ID'] = generateRequestId();

    // Optional: Log requests in development
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    // Request setup failed (should rarely happen)
    return Promise.reject(
      new ApiError(
        'Failed to prepare request',
        ApiErrorType.UNKNOWN_ERROR,
        0
      )
    );
  }
);

/**
 * Response Interceptor
 *
 * Runs after every response. Used for:
 * - Normalizing successful responses
 * - Converting HTTP errors to ApiError instances
 * - Handling token refresh on 401
 * - Global error logging
 * - Extracting data from response wrapper (if using one)
 */
apiClient.interceptors.response.use(
  (response) => {
    // Success path: extract and return data
    // If your API wraps responses (e.g., { success: true, data: {...} }),
    // you can unwrap here for consistent shape
    if (import.meta.env.DEV) {
      console.log(
        `[API Response] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`
      );
    }

    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    // Error path: convert all errors to ApiError

    // Network error (no response from server)
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return Promise.reject(
          new ApiError('Request timeout', ApiErrorType.TIMEOUT, 0)
        );
      }

      if (import.meta.env.DEV) {
        console.error('[API Network Error]', error.message);
      }

      return Promise.reject(
        new ApiError('Network connection failed', ApiErrorType.NETWORK_ERROR, 0)
      );
    }

    // Response error (server responded with error status)
    const status = error.response.status;
    const data = error.response.data;

    // Map HTTP status codes to ApiErrorType
    let errorType = ApiErrorType.UNKNOWN_ERROR;

    if (status === 400) {
      errorType = ApiErrorType.BAD_REQUEST;
    } else if (status === 401) {
      errorType = ApiErrorType.UNAUTHORIZED;
      // Trigger logout/token refresh here if needed
      handleAuthError();
    } else if (status === 403) {
      errorType = ApiErrorType.FORBIDDEN;
    } else if (status === 404) {
      errorType = ApiErrorType.NOT_FOUND;
    } else if (status === 409) {
      errorType = ApiErrorType.CONFLICT;
    } else if (status === 422) {
      errorType = ApiErrorType.UNPROCESSABLE_ENTITY;
    } else if (status === 429) {
      errorType = ApiErrorType.TOO_MANY_REQUESTS;
    } else if (status >= 500) {
      if (status === 502) {
        errorType = ApiErrorType.BAD_GATEWAY;
      } else if (status === 503) {
        errorType = ApiErrorType.SERVICE_UNAVAILABLE;
      } else {
        errorType = ApiErrorType.INTERNAL_SERVER_ERROR;
      }
    }

    const apiError = new ApiError(
      data?.message || error.message,
      errorType,
      status,
      data
    );

    if (import.meta.env.DEV) {
      console.error('[API Error]', apiError);
    }

    return Promise.reject(apiError);
  }
);

/**
 * Get authentication token from storage
 *
 * Customize this based on your auth implementation:
 * - localStorage.getItem('token')
 * - sessionStorage
 * - Zustand store
 * - Context API
 */
function getAuthToken(): string | null {
  // TODO: Replace with your actual token retrieval logic
  // Example with localStorage:
  try {
    return localStorage.getItem('authToken');
  } catch {
    return null;
  }
}

/**
 * Handle authentication errors
 *
 * Called when API returns 401 Unauthorized.
 * This is where you'd typically:
 * - Clear stored tokens
 * - Redirect to login page
 * - Emit auth state update
 */
function handleAuthError(): void {
  // TODO: Implement auth error handling
  // Example:
  // localStorage.removeItem('authToken');
  // window.location.href = '/login';
  // Or dispatch to auth store/context
}

/**
 * Generate unique request ID for tracing
 * Useful for correlating logs across client and server
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Export axios instance for direct use if needed
 * (Though it's better to use the typed request functions below)
 */
export default apiClient;
