/**
 * User Management React Query Hooks
 *
 * Provides a clean, type-safe interface for user operations.
 * Handles caching, loading states, mutations, and error handling.
 *
 * Philosophy:
 * - Components use hooks, never call the service directly
 * - Hooks handle all data-fetching concerns (caching, loading, errors)
 * - Service handles only HTTP concerns (requests, responses)
 *
 * Usage in Components:
 *   const { data, isPending, error } = useGetUsers({ pageNumber: 1, pageSize: 10 });
 *   const { mutate: createUser } = useCreateUser();
 *
 * All hooks are built on React Query (TanStack Query) for:
 * - Automatic caching and stale-while-revalidate
 * - Background refetching
 * - Optimistic updates
 * - Error retry logic
 * - Dev tools integration
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { userService, UserDTO, GetUsersQueryParams, PaginatedListDTO } from '@/api/services/users.service';
import { LoginRequestDTO, LoginResponseDTO, CreateUserRequestDTO, UpdateUserRequestDTO, ChangePasswordRequestDTO } from '@/types/api/users';
import { ApiError } from '@/api/errors';

/**
 * Query Keys for React Query
 * Centralized query key factory prevents key mismatches
 * Enables easy invalidation of related queries
 *
 * Usage:
 *   queryClient.invalidateQueries({ queryKey: userKeys.lists() });
 *   queryClient.invalidateQueries({ queryKey: userKeys.detail(5) });
 */
const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: GetUsersQueryParams) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
  byRole: (role: number) => [...userKeys.all, 'byRole', role] as const,
};

/**
 * ============================================================================
 * QUERY HOOKS (Data Fetching - GET requests)
 * ============================================================================
 */

/**
 * useGetUsers - Fetch paginated list of users with search and filtering
 *
 * Features:
 * - Server-side pagination and filtering
 * - Automatic caching and stale time management
 * - Manual refetch capabilities
 * - Loading and error states
 * - Type-safe parameters and responses
 *
 * @param params - Pagination, search, and sorting parameters
 * @param options - Optional React Query options for customization
 *
 * @returns Object with:
 * - data: Paginated list of users
 * - isPending: Boolean loading state
 * - error: ApiError if request failed
 * - refetch: Function to manually refetch data
 *
 * @example
 * ```typescript
 * const { data, isPending, error } = useGetUsers({
 *   pageNumber: 1,
 *   pageSize: 25,
 *   searchTerm: 'john',
 *   sortBy: 'fullName',
 *   sortDescending: false
 * });
 *
 * if (isPending) return <Skeleton />;
 * if (error) return <ErrorAlert error={error} />;
 *
 * return (
 *   <UserTable
 *     users={data?.data.items || []}
 *     totalCount={data?.data.totalCount || 0}
 *   />
 * );
 * ```
 */
export function useGetUsers(
  params: GetUsersQueryParams,
  options?: Omit<UseQueryOptions<any, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => userService.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (except timeout/network)
      if (error instanceof ApiError && error.statusCode < 500 && !error.isRetryable) {
        return false;
      }
      return failureCount < 3;
    },
    ...options,
  });
}

/**
 * useGetUserById - Fetch a single user's details
 *
 * @param id - User ID to fetch
 * @param options - Optional React Query options
 *
 * @returns Object with user details, loading state, and error
 *
 * @example
 * ```typescript
 * const { data: userResponse } = useGetUserById(5);
 * const user = userResponse?.data;
 * ```
 */
export function useGetUserById(
  id: number,
  options?: Omit<UseQueryOptions<any, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userService.getById(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: id > 0, // Only fetch if valid ID provided
    ...options,
  });
}

/**
 * useGetUsersByRole - Fetch all users with a specific role
 *
 * Useful for filtering users by department or responsibility.
 *
 * @param role - Role ID (e.g., UserRole.Manager = 2)
 * @param options - Optional React Query options
 *
 * @returns Object with array of users in that role
 *
 * @example
 * ```typescript
 * const { data: response } = useGetUsersByRole(UserRole.Manager);
 * const managers = response?.data || [];
 * ```
 */
export function useGetUsersByRole(
  role: number,
  options?: Omit<UseQueryOptions<any, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: userKeys.byRole(role),
    queryFn: () => userService.getByRole(role),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    ...options,
  });
}

/**
 * ============================================================================
 * MUTATION HOOKS (Data Modification - POST/PUT/DELETE requests)
 * ============================================================================
 */

/**
 * useLogin - Authenticate user and obtain JWT token
 *
 * Features:
 * - Handles login request and response
 * - Automatic token storage after successful login
 * - Error handling for invalid credentials
 * - Loading state management
 *
 * @param options - Optional callbacks (onSuccess, onError)
 *
 * @returns Mutation object with:
 * - mutate: Function to trigger login
 * - isPending: Boolean loading state
 * - error: ApiError if login failed
 * - data: Login response with token
 *
 * @example
 * ```typescript
 * const { mutate: login, isPending, error } = useLogin({
 *   onSuccess: (response) => {
 *     localStorage.setItem('authToken', response.data.token);
 *     localStorage.setItem('currentUser', JSON.stringify(response.data));
 *     navigate('/dashboard');
 *   },
 *   onError: (error) => {
 *     toast.error(error.userMessage);
 *   }
 * });
 *
 * const handleLoginSubmit = (username: string, password: string) => {
 *   login({ username, password });
 * };
 * ```
 */
export function useLogin(options?: Omit<UseMutationOptions<any, ApiError, LoginRequestDTO>, 'mutationFn'>) {
  return useMutation({
    mutationFn: (credentials: LoginRequestDTO) => userService.login(credentials),
    ...options,
  });
}

/**
 * useCreateUser - Create a new user account
 *
 * Features:
 * - Form validation feedback through error.validationErrors
 * - Automatic cache invalidation after successful creation
 * - Optimistic updates available via onSuccess
 *
 * @param options - Optional callbacks (onSuccess, onError)
 *
 * @returns Mutation object with mutate function and state
 *
 * @example
 * ```typescript
 * const { mutate: createUser, isPending } = useCreateUser({
 *   onSuccess: (response) => {
 *     queryClient.invalidateQueries({ queryKey: userKeys.lists() });
 *     toast.success('User created successfully');
 *     closeDialog();
 *   },
 *   onError: (error) => {
 *     if (error.hasValidationErrors) {
 *       // Display field-level validation errors
 *       Object.entries(error.validationErrors).forEach(([field, messages]) => {
 *         setFieldError(field, Array.isArray(messages) ? messages[0] : messages);
 *       });
 *     } else {
 *       toast.error(error.userMessage);
 *     }
 *   }
 * });
 *
 * createUser({
 *   username: 'jdoe',
 *   fullName: 'John Doe',
 *   email: 'john@example.com',
 *   phoneNumber: '555-0123',
 *   password: 'Pass123!',
 *   role: UserRole.Manager
 * });
 * ```
 */
export function useCreateUser(
  options?: Omit<UseMutationOptions<any, ApiError, CreateUserRequestDTO>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: CreateUserRequestDTO) => userService.create(userData),
    onSuccess: (data, variables, context) => {
      // Invalidate user lists to refetch with new user
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * useUpdateUser - Update an existing user's information
 *
 * Features:
 * - Update user details (name, email, role, etc.)
 * - Automatic cache updates
 * - Field-level validation error feedback
 *
 * @param id - User ID to update
 * @param options - Optional callbacks
 *
 * @returns Mutation object
 *
 * @example
 * ```typescript
 * const { mutate: updateUser, isPending } = useUpdateUser(5, {
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: userKeys.detail(5) });
 *     toast.success('User updated');
 *   }
 * });
 *
 * updateUser({
 *   fullName: 'Jane Doe',
 *   email: 'jane@example.com',
 *   phoneNumber: '555-9876',
 *   role: UserRole.Manager,
 *   isActive: true,
 *   isLocked: false
 * });
 * ```
 */
export function useUpdateUser(
  id: number,
  options?: Omit<UseMutationOptions<any, ApiError, UpdateUserRequestDTO>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: UpdateUserRequestDTO) => userService.update(id, userData),
    onSuccess: (data, variables, context) => {
      // Update both the specific user and list queries
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * useDeleteUser - Delete a user account
 *
 * @param id - User ID to delete
 * @param options - Optional callbacks
 *
 * @returns Mutation object
 *
 * @example
 * ```typescript
 * const { mutate: deleteUser } = useDeleteUser(5, {
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: userKeys.lists() });
 *     toast.success('User deleted');
 *   }
 * });
 *
 * const handleDelete = () => {
 *   if (confirm('Are you sure?')) {
 *     deleteUser();
 *   }
 * };
 * ```
 */
export function useDeleteUser(
  id: number,
  options?: Omit<UseMutationOptions<any, ApiError, void>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => userService.delete(id),
    onSuccess: (data, variables, context) => {
      // Remove from detail cache and invalidate lists
      queryClient.removeQueries({ queryKey: userKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * useChangePassword - Change user's password
 *
 * Security Notes:
 * - Requires current password for verification
 * - Only authenticated users can change their own password
 * - Should only be called over HTTPS
 *
 * @param id - User ID (typically current user's ID)
 * @param options - Optional callbacks
 *
 * @returns Mutation object
 *
 * @example
 * ```typescript
 * const { mutate: changePassword } = useChangePassword(currentUserId, {
 *   onSuccess: () => {
 *     toast.success('Password changed successfully');
 *     closePasswordDialog();
 *   },
 *   onError: (error) => {
 *     if (error.message.includes('current password')) {
 *       setFieldError('currentPassword', 'Incorrect password');
 *     } else {
 *       toast.error(error.userMessage);
 *     }
 *   }
 * });
 *
 * changePassword({
 *   currentPassword: 'oldPass123',
 *   newPassword: 'newPass456'
 * });
 * ```
 */
export function useChangePassword(
  id: number,
  options?: Omit<UseMutationOptions<any, ApiError, ChangePasswordRequestDTO>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: (passwordData: ChangePasswordRequestDTO) => userService.changePassword(id, passwordData),
    ...options,
  });
}

/**
 * Export query key factory for manual cache management
 * Allows components to invalidate specific queries when needed
 */
export { userKeys };
