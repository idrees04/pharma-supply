/**
 * User Management API Service
 *
 * This service encapsulates all user-related API calls.
 * It provides a clean, typed interface for authentication and user management.
 *
 * Architecture Benefits:
 * - Centralized API calls (single point of change)
 * - Reusable across components and hooks
 * - Type-safe: all parameters and responses are typed
 * - Separation of concerns: HTTP logic separate from React/business logic
 * - Testable: easy to mock for unit tests
 *
 * Usage:
 * - Services are typically called by React Query hooks (useUsers.ts)
 * - Hooks handle caching, loading states, and error handling
 * - Components use hooks, not this service directly
 */

import { get, post, put, deleteRequest } from "../requests";
import {
  UserDTO,
  LoginRequestDTO,
  LoginResponseDTO,
  CreateUserRequestDTO,
  UpdateUserRequestDTO,
  ChangePasswordRequestDTO,
  GetUsersQueryParams,
  PaginatedListDTO,
  ApiResponseWrapperDTO,
} from "@/types/api/users";

/**
 * User Management Service
 * All API calls for user operations
 */
class UserService {
  /**
   * Login - Authenticate user and get JWT token
   *
   * Endpoint: POST /api/Users/login
   * @param credentials - Username and password
   * @returns User info and authentication token
   *
   * @throws ApiError on login failure (invalid credentials, server error, etc.)
   *
   * Usage:
   *   const loginResponse = await userService.login({ username: 'admin', password: 'pass123' });
   *   localStorage.setItem('authToken', loginResponse.data.token);
   */
  async login(
    credentials: LoginRequestDTO,
  ): Promise<ApiResponseWrapperDTO<LoginResponseDTO>> {
    return post<ApiResponseWrapperDTO<LoginResponseDTO>, LoginRequestDTO>(
      "/api/Users/login",
      credentials,
    );
  }

  /**
   * Get All Users - Fetch paginated list of users with search and filtering
   *
   * Endpoint: GET /api/Users
   * @param params - Pagination, search, and sorting parameters
   * @returns Paginated list of users
   *
   * Query Parameters:
   * - pageNumber: 1-based page number (default: 1)
   * - pageSize: Items per page (e.g., 10, 25, 50)
   * - searchTerm: Filter users by name, email, or username
   * - sortBy: Field to sort by (e.g., 'fullName', 'email', 'lastLoginDate')
   * - sortDescending: Sort order (false=ascending, true=descending)
   *
   * @throws ApiError if request fails
   *
   * Usage:
   *   const response = await userService.getAll({
   *     pageNumber: 1,
   *     pageSize: 10,
   *     searchTerm: 'john',
   *     sortBy: 'fullName',
   *     sortDescending: false
   *   });
   *   const { items, totalCount } = response.data;
   */
  async getAll(
    params: GetUsersQueryParams,
  ): Promise<ApiResponseWrapperDTO<PaginatedListDTO<UserDTO>>> {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    ).toString();

    return get<ApiResponseWrapperDTO<PaginatedListDTO<UserDTO>>>(
      `/api/Users?${queryString}`,
    );
  }

  /**
   * Get User by ID - Fetch a single user's details
   *
   * Endpoint: GET /api/Users/{id}
   * @param id - User ID
   * @returns User details
   *
   * @throws ApiError if user not found (404) or server error
   *
   * Usage:
   *   const response = await userService.getById(5);
   *   const user = response.data;
   */
  async getById(id: number): Promise<ApiResponseWrapperDTO<UserDTO>> {
    return get<ApiResponseWrapperDTO<UserDTO>>(`/api/Users/${id}`);
  }

  /**
   * Create User - Create a new user account
   *
   * Endpoint: POST /api/Users
   * @param userData - User creation payload
   * @returns Created user (with ID assigned by server)
   *
   * Note: Only admins can create new users. Verify permissions before calling.
   *
   * @throws ApiError on validation failure or permission denied
   *
   * Usage:
   *   const response = await userService.create({
   *     username: 'jdoe',
   *     fullName: 'John Doe',
   *     email: 'john@example.com',
   *     phoneNumber: '555-0123',
   *     password: 'securePassword123!',
   *     role: UserRole.Manager
   *   });
   *   const newUser = response.data;
   */
  async create(
    userData: CreateUserRequestDTO,
  ): Promise<ApiResponseWrapperDTO<UserDTO>> {
    return post<ApiResponseWrapperDTO<UserDTO>, CreateUserRequestDTO>(
      "/api/Users",
      userData,
    );
  }

  /**
   * Update User - Update user information
   *
   * Endpoint: PUT /api/Users/{id}
   * @param id - User ID to update
   * @param userData - Updated user data (cannot change username or password)
   * @returns Updated user
   *
   * Note: To change password, use changePassword() method instead.
   * Note: Only admins or the user themselves can update. Verify permissions.
   *
   * @throws ApiError if validation fails or permission denied
   *
   * Usage:
   *   const response = await userService.update(5, {
   *     fullName: 'Jane Doe',
   *     email: 'jane@example.com',
   *     phoneNumber: '555-9876',
   *     role: UserRole.Manager,
   *     isActive: true,
   *     isLocked: false
   *   });
   */
  async update(
    id: number,
    userData: UpdateUserRequestDTO,
  ): Promise<ApiResponseWrapperDTO<UserDTO>> {
    return put<ApiResponseWrapperDTO<UserDTO>, UpdateUserRequestDTO>(
      `/api/Users/${id}`,
      userData,
    );
  }

  /**
   * Delete User - Soft or hard delete a user account
   *
   * Endpoint: DELETE /api/Users/{id}
   * @param id - User ID to delete
   * @returns Deletion confirmation message
   *
   * Note: Only admins can delete users.
   * Note: API may use soft delete (isActive=false) or hard delete.
   *
   * @throws ApiError if user not found or permission denied
   *
   * Usage:
   *   const response = await userService.delete(5);
   *   console.log(response.message); // Success message from server
   */
  async delete(id: number): Promise<ApiResponseWrapperDTO<string>> {
    return deleteRequest<ApiResponseWrapperDTO<string>>(`/api/Users/${id}`);
  }

  /**
   * Change Password - Change the current user's password
   *
   * Endpoint: POST /api/Users/{id}/change-password
   * @param id - User ID
   * @param passwordData - Current and new password
   * @returns Success confirmation
   *
   * Security Note:
   * - Current password must be provided for verification
   * - Only the authenticated user can change their own password
   * - New password should be hashed by API server (HTTPS required)
   *
   * @throws ApiError if current password is wrong or validation fails
   *
   * Usage:
   *   const response = await userService.changePassword(5, {
   *     currentPassword: 'oldPassword123!',
   *     newPassword: 'newPassword456!'
   *   });
   */
  async changePassword(
    id: number,
    passwordData: ChangePasswordRequestDTO,
  ): Promise<ApiResponseWrapperDTO<string>> {
    return post<ApiResponseWrapperDTO<string>, ChangePasswordRequestDTO>(
      `/api/Users/${id}/change-password`,
      passwordData,
    );
  }

  /**
   * Get Users by Role - Fetch all users with a specific role
   *
   * Endpoint: GET /api/Users/by-role/{role}
   * @param role - Role ID (e.g., UserRole.Manager = 2)
   * @returns Array of users with that role
   *
   * Useful for:
   * - Filtering users by department/responsibility
   * - Assigning tasks to specific roles
   * - Populating role-specific dropdowns
   *
   * @throws ApiError if role not found or server error
   *
   * Usage:
   *   const response = await userService.getByRole(UserRole.Manager);
   *   const managers = response.data;
   */
  async getByRole(role: number): Promise<ApiResponseWrapperDTO<UserDTO[]>> {
    return get<ApiResponseWrapperDTO<UserDTO[]>>(`/api/Users/by-role/${role}`);
  }
}

/**
 * Export singleton instance
 * Same instance used throughout the app (no redundant API wrappers)
 */
export const userService = new UserService();

/**
 * Type exports for convenience
 * Allow components to import types directly from this module
 */
export type {
  UserDTO,
  LoginResponseDTO,
  GetUsersQueryParams,
  PaginatedListDTO,
};
