/**
 * Unit API Types
 *
 * Type definitions for all Unit API endpoints.
 * Base URL: https://mds.vtoxi.com/api/Units
 */

/**
 * Unit entity from the API
 */
export interface Unit {
  id: number;
  name: string;
  quantity: number;
  isActive: boolean;
}

/**
 * Request body for creating a Unit (POST /api/Units)
 */
export interface CreateUnitRequest {
  name: string;
  quantity: number;
}

/**
 * Request body for updating a Unit (PUT /api/Units/:id)
 */
export interface UpdateUnitRequest {
  name: string;
  quantity: number;
  isActive: boolean;
}

/**
 * API response wrapper structure
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string | null;
  timestamp: string;
}

/**
 * GET /api/Units response
 */
export type GetUnitsListResponse = ApiResponse<Unit[]>;

/**
 * POST /api/Units response
 */
export type CreateUnitResponse = ApiResponse<Unit>;

/**
 * GET /api/Units/:id response
 */
export type GetUnitResponse = ApiResponse<Unit>;

/**
 * PUT /api/Units/:id response
 */
export type UpdateUnitResponse = ApiResponse<Unit>;

/**
 * DELETE /api/Units/:id response
 */
export type DeleteUnitResponse = ApiResponse<string>;
