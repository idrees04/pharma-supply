/**
 * API Request Functions Module
 *
 * This module provides type-safe, generic request functions for all HTTP methods.
 * These functions are the foundation of the HTTP layer:
 *
 * - All functions are fully typed with TypeScript generics
 * - Consistent error handling through ApiError
 * - No business logic - just HTTP concerns
 * - Used by the hooks and service layers
 *
 * Architecture:
 * Component/Hook -> usePostMutation/useGetQuery -> post<T>() -> Axios -> Server
 *
 * Never call these directly in components. Always go through hooks.
 */

import { AxiosHeaders, AxiosRequestConfig, AxiosResponse } from 'axios';
import { apiClient } from './axios';
import { ApiError } from './errors';

/**
 * Generic request options
 * Allows overriding default behavior per request (headers, timeout, etc.)
 */
export interface RequestConfig extends AxiosRequestConfig {
  // Custom options can be added here
}

/**
 * GET Request
 *
 * Generic type parameters:
 * @param T - The response data type
 *
 * Example:
 *   const data = await get<Product>('/products/123');
 *   const items = await get<Product[]>('/products');
 */
export async function get<T>(url: string, config?: RequestConfig): Promise<T> {
  try {
    const response: AxiosResponse<T> = await apiClient.get(url, config);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      'An unexpected error occurred during GET request',
      'UNKNOWN_ERROR' as any,
      500
    );
  }
}

/**
 * POST Request
 *
 * Generic type parameters:
 * @param T - The response data type
 * @param D - The request body type (defaults to any)
 *
 * Example:
 *   const newProduct = await post<Product, CreateProductDTO>('/products', { name: 'Widget' });
 */
export async function post<T, D = any>(url: string, data?: D, config?: RequestConfig): Promise<T> {
  try {
    const response: AxiosResponse<T> = await apiClient.post(url, data, config);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      'An unexpected error occurred during POST request',
      'UNKNOWN_ERROR' as any,
      500
    );
  }
}

/**
 * PUT Request (full replacement)
 *
 * PUT typically means: "Replace this entire resource"
 * Use PATCH for partial updates.
 *
 * Generic type parameters:
 * @param T - The response data type
 * @param D - The request body type (defaults to any)
 *
 * Example:
 *   const updated = await put<Product, UpdateProductDTO>('/products/123', { ...product });
 */
export async function put<T, D = any>(url: string, data?: D, config?: RequestConfig): Promise<T> {
  try {
    const response: AxiosResponse<T> = await apiClient.put(url, data, config);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      'An unexpected error occurred during PUT request',
      'UNKNOWN_ERROR' as any,
      500
    );
  }
}

/**
 * PATCH Request (partial update)
 *
 * PATCH typically means: "Apply these changes to the resource"
 * Safer than PUT because only specified fields are updated.
 *
 * Generic type parameters:
 * @param T - The response data type
 * @param D - The request body type (defaults to any)
 *
 * Example:
 *   const updated = await patch<Product, Partial<UpdateProductDTO>>('/products/123', { name: 'NewName' });
 */
export async function patch<T, D = any>(url: string, data?: D, config?: RequestConfig): Promise<T> {
  try {
    const response: AxiosResponse<T> = await apiClient.patch(url, data, config);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      'An unexpected error occurred during PATCH request',
      'UNKNOWN_ERROR' as any,
      500
    );
  }
}

/**
 * DELETE Request
 *
 * Generic type parameters:
 * @param T - The response data type (often void or a success message)
 *
 * Example:
 *   await delete<void>('/products/123');
 *   const result = await delete<{ message: string }>('/products/123');
 */
export async function deleteRequest<T = void>(url: string, config?: RequestConfig): Promise<T> {
  try {
    const response: AxiosResponse<T> = await apiClient.delete(url, config);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      'An unexpected error occurred during DELETE request',
      'UNKNOWN_ERROR' as any,
      500
    );
  }
}

/**
 * GET binary response (e.g. Excel export). Does not parse JSON.
 */
export async function getBlob(url: string, config?: RequestConfig): Promise<Blob> {
  try {
    const response = await apiClient.get<Blob>(url, {
      ...config,
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      'An unexpected error occurred during binary download',
      'UNKNOWN_ERROR' as any,
      500
    );
  }
}

export async function postMultipart<T>(url: string, formData: FormData, config?: RequestConfig): Promise<T> {
  try {
    // apiClient defaults to Content-Type: application/json. Axios then runs transformRequest which,
    // when it sees FormData + JSON content type, serializes the body as JSON instead of multipart
    // (see axios defaults). ASP.NET [FromForm] IFormFile never binds → "The file field is required."
    const headers = AxiosHeaders.from(config?.headers ?? {});
    headers.setContentType(null);

    const response = await apiClient.post<T>(url, formData, {
      ...config,
      headers,
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      'An unexpected error occurred during upload',
      'UNKNOWN_ERROR' as any,
      500
    );
  }
}

/**
 * Type-safe request function factory
 *
 * For more complex scenarios where you need additional options,
 * this factory allows you to create custom request functions:
 *
 * Example:
 *   const fetchProducts = createRequest<Product[]>({
 *     method: 'GET',
 *     url: '/products',
 *     timeout: 5000, // Custom timeout for this endpoint
 *   });
 */
export function createRequest<T>(config: RequestConfig) {
  return async (data?: any): Promise<T> => {
    try {
      const response: AxiosResponse<T> = await apiClient.request<T>({
        ...config,
        data,
      });
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        'An unexpected error occurred',
        'UNKNOWN_ERROR' as any,
        500
      );
    }
  };
}
