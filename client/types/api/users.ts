import { UserRole } from "../enums";

/**
 * ============================================================================
 * REQUEST DTOs (Data sent TO the server)
 * ============================================================================
 * These define the shape of data we send in request bodies.
 * Using DTOs (Data Transfer Objects) creates a contract between frontend and backend.
 */

/**
 * Login Request DTO
 * Used in POST /api/Users/login
 */
export interface LoginRequestDTO {
  username: string;
  password: string;
}

/**
 * Create User Request DTO
 * Used in POST /api/Users
 * Note: Password is only sent on creation. Updates use separate endpoint.
 */
export interface CreateUserRequestDTO {
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: UserRole;
}

/**
 * Update User Request DTO
 * Used in PUT /api/Users/{id}
 * Note: Cannot update username and password via this endpoint
 */
export interface UpdateUserRequestDTO {
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  isActive: boolean;
  isLocked: boolean;
}

/**
 * Change Password Request DTO
 * Used in POST /api/Users/{id}/change-password
 */
export interface ChangePasswordRequestDTO {
  currentPassword: string;
  newPassword: string;
}

/**
 * Get Users Query Parameters
 * Used in GET /api/Users with server-side pagination and filtering
 */
export interface GetUsersQueryParams {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

/**
 * ============================================================================
 * RESPONSE DTOs (Data received FROM the server)
 * ============================================================================
 * These define the shape of data returned by the API.
 */

/**
 * User Data DTO
 * Represents a single user object returned by the API
 */
export interface UserDTO {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  lastLoginDate: string | null; // ISO 8601 date string
  isActive: boolean;
  isLocked: boolean;
}

/**
 * Login Response DTO
 * Returned by POST /api/Users/login
 */
export interface LoginResponseDTO {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  token: string; // JWT or Bearer token
  federationId?: number;
  federationName?: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
}

/**
 * Paginated List Response DTO
 * Used for listing users with pagination support
 * API wraps list responses in this structure
 */
export interface PaginatedListDTO<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

/**
 * API Response Wrapper DTO
 * The API wraps all responses in this structure
 * This allows consistent error and success handling
 */
export interface ApiResponseWrapperDTO<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors?: string | Record<string, string[]>;
  timestamp: string; // ISO 8601 date string
}

/**
 * Type helpers to extract data from API responses
 * Useful for cleaner code when unwrapping responses
 */

/**
 * Extract paginated user list from API response
 * Example:
 *   const response = await get<ApiResponseWrapperDTO<PaginatedListDTO<UserDTO>>>('/api/Users?...');
 *   const { items, totalCount } = extractPaginatedData(response);
 */
export function extractPaginatedData<T>(
  response: ApiResponseWrapperDTO<PaginatedListDTO<T>>,
) {
  return response.data;
}

/**
 * Extract single entity from API response
 * Example:
 *   const response = await get<ApiResponseWrapperDTO<UserDTO>>('/api/Users/1');
 *   const user = extractData(response);
 */
export function extractData<T>(response: ApiResponseWrapperDTO<T>) {
  return response.data;
}
