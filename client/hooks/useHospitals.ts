/**
 * Hospital Management React Query Hooks
 *
 * Provides a clean, type-safe interface for hospital operations.
 * Handles caching, loading states, mutations, and error handling.
 *
 * Philosophy:
 * - Components use hooks, never call the service directly
 * - Hooks handle all data-fetching concerns (caching, loading, errors)
 * - Service handles only HTTP concerns (requests, responses)
 *
 * Usage in Components:
 *   const { data, isPending, error } = useGetHospitals({ pageNumber: 1, pageSize: 25 });
 *   const { mutate: createHospital } = useCreateHospital();
 *
 * All hooks are built on React Query (TanStack Query) for:
 * - Automatic caching and stale-while-revalidate
 * - Background refetching
 * - Optimistic updates
 * - Error retry logic
 * - Dev tools integration
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import {
  hospitalService,
  Hospital,
  CreateHospitalRequest,
  UpdateHospitalRequest,
  HospitalListQueryParams,
} from "@/api/services/hospitals.service";
import {
  GetHospitalsListResponse,
  GetHospitalResponse,
  HospitalOrdersData,
} from "@/types/api/hospitals";
import { ApiError } from "@/api/errors";

/**
 * Query Keys for React Query
 * Centralized query key factory prevents key mismatches
 * Enables easy invalidation of related queries
 *
 * Usage:
 *   queryClient.invalidateQueries({ queryKey: hospitalKeys.lists() });
 *   queryClient.invalidateQueries({ queryKey: hospitalKeys.detail(5) });
 *   queryClient.invalidateQueries({ queryKey: hospitalKeys.orders(5) });
 */
const hospitalKeys = {
  all: ["hospitals"] as const,
  lists: () => [...hospitalKeys.all, "list"] as const,
  list: (filters: HospitalListQueryParams) =>
    [...hospitalKeys.lists(), filters] as const,
  details: () => [...hospitalKeys.all, "detail"] as const,
  detail: (id: number) => [...hospitalKeys.details(), id] as const,
  orders: () => [...hospitalKeys.all, "orders"] as const,
  order: (id: number) => [...hospitalKeys.orders(), id] as const,
};

/**
 * ============================================================================
 * QUERY HOOKS (Data Fetching - GET requests)
 * ============================================================================
 */

/**
 * useGetHospitals - Fetch paginated list of hospitals with search and filtering
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
 * - data: Full API response including paginated hospitals
 * - isPending: Boolean loading state
 * - error: ApiError if request failed
 * - refetch: Function to manually refetch data
 * - isError: Whether an error occurred
 *
 * @example
 * ```typescript
 * const { data, isPending, error } = useGetHospitals({
 *   pageNumber: 1,
 *   pageSize: 25,
 *   searchTerm: 'Aga Khan',
 *   sortBy: 'hospitalName',
 *   sortDescending: false
 * });
 *
 * if (isPending) return <Skeleton />;
 * if (error) return <ErrorAlert error={error} />;
 *
 * const { items, totalCount } = data?.data || { items: [], totalCount: 0 };
 * return <HospitalTable hospitals={items} totalCount={totalCount} />;
 * ```
 */
export function useGetHospitals(
  params: HospitalListQueryParams,
  options?: Omit<UseQueryOptions<GetHospitalsListResponse, ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: hospitalKeys.list(params),
    queryFn: () => hospitalService.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection time)
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (except timeout/network)
      if (
        error instanceof ApiError &&
        error.statusCode < 500 &&
        !error.isRetryable
      ) {
        return false;
      }
      return failureCount < 3;
    },
    ...options,
  });
}

/**
 * useGetHospitalById - Fetch a single hospital's details
 *
 * Used when editing a hospital or displaying full details.
 * Automatically disabled if no valid ID is provided.
 *
 * @param id - Hospital ID to fetch
 * @param options - Optional React Query options
 *
 * @returns Object with hospital data, loading state, and error
 *
 * @example
 * ```typescript
 * const { data: response, isPending } = useGetHospitalById(hospitalId);
 * const hospital = response?.data;
 *
 * return (
 *   <HospitalForm
 *     hospital={hospital}
 *     isLoading={isPending}
 *   />
 * );
 * ```
 */
export function useGetHospitalById(
  id: number | null | undefined,
  options?: Omit<UseQueryOptions<GetHospitalResponse, ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: hospitalKeys.detail(id || 0),
    queryFn: () => hospitalService.getById(id!),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: id != null && id > 0, // Only fetch if valid ID provided
    ...options,
  });
}

/**
 * useGetHospitalOrders - Fetch orders and invoices for a hospital
 *
 * Returns comprehensive order and financial data for a specific hospital.
 * Includes statistics, order list, and invoice list.
 *
 * @param id - Hospital ID
 * @param params - Optional date range filters (startDate, endDate)
 * @param options - Optional React Query options
 *
 * @returns Object with hospital orders data and state
 *
 * @example
 * ```typescript
 * const { data: response, isPending } = useGetHospitalOrders(hospitalId, {
 *   startDate: '2024-01-01T00:00:00.000Z',
 *   endDate: '2024-12-31T23:59:59.999Z'
 * });
 *
 * if (isPending) return <LoadingSpinner />;
 *
 * const ordersData = response?.data;
 * return (
 *   <>
 *     <OrderStats totalOrders={ordersData?.totalOrders} />
 *     <OrderList orders={ordersData?.orders} />
 *     <InvoiceList invoices={ordersData?.invoices} />
 *   </>
 * );
 * ```
 */
export function useGetHospitalOrders(
  id: number | null | undefined,
  params?: { startDate?: string; endDate?: string },
  options?: Omit<UseQueryOptions<HospitalOrdersData, ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: [hospitalKeys.order(id || 0), params],
    queryFn: () => hospitalService.getOrders(id!, params),
    staleTime: 10 * 60 * 1000, // 10 minutes (financial data changes less frequently)
    gcTime: 15 * 60 * 1000,
    enabled: id != null && id > 0,
    ...options,
  });
}

/**
 * ============================================================================
 * MUTATION HOOKS (Data Modification - POST/PUT/DELETE requests)
 * ============================================================================
 */

/**
 * useCreateHospital - Create a new hospital customer
 *
 * Features:
 * - Form validation feedback through error.validationErrors
 * - Automatic cache invalidation after successful creation
 * - Optimistic updates available via onSuccess
 * - Type-safe request and response
 *
 * @param options - Optional callbacks (onSuccess, onError)
 *
 * @returns Mutation object with mutate function and state
 *
 * @example
 * ```typescript
 * const { mutate: createHospital, isPending, error } = useCreateHospital({
 *   onSuccess: (response) => {
 *     // response.data contains the created hospital with ID
 *     queryClient.invalidateQueries({ queryKey: hospitalKeys.lists() });
 *     toast.success('Hospital created successfully');
 *     closeDialog();
 *   },
 *   onError: (error) => {
 *     if (error.hasValidationErrors) {
 *       Object.entries(error.validationErrors).forEach(([field, messages]) => {
 *         setFieldError(field, Array.isArray(messages) ? messages[0] : messages);
 *       });
 *     } else {
 *       toast.error(error.userMessage);
 *     }
 *   }
 * });
 *
 * const handleSubmit = (data: CreateHospitalRequest) => {
 *   createHospital(data);
 * };
 * ```
 */
export function useCreateHospital(
  options?: Omit<
    UseMutationOptions<any, ApiError, CreateHospitalRequest>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (hospitalData: CreateHospitalRequest) =>
      hospitalService.create(hospitalData),
    onSuccess: (data, variables, context) => {
      // Invalidate hospital lists to refetch with new hospital
      queryClient.invalidateQueries({ queryKey: hospitalKeys.lists() });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * useUpdateHospital - Update an existing hospital's information
 *
 * Features:
 * - Update hospital details (name, contact, credit terms, etc.)
 * - Automatic cache updates for both list and detail queries
 * - Field-level validation error feedback
 * - Type-safe update operations
 *
 * @param id - Hospital ID to update
 * @param options - Optional callbacks
 *
 * @returns Mutation object with mutate function and state
 *
 * @example
 * ```typescript
 * const { mutate: updateHospital, isPending } = useUpdateHospital(hospitalId, {
 *   onSuccess: (response) => {
 *     queryClient.invalidateQueries({ queryKey: hospitalKeys.detail(hospitalId) });
 *     queryClient.invalidateQueries({ queryKey: hospitalKeys.lists() });
 *     toast.success('Hospital updated successfully');
 *     closeDialog();
 *   },
 *   onError: (error) => {
 *     toast.error(error.userMessage);
 *   }
 * });
 *
 * const handleUpdate = (data: UpdateHospitalRequest) => {
 *   updateHospital(data);
 * };
 * ```
 */
export function useUpdateHospital(
  id: number,
  options?: Omit<
    UseMutationOptions<any, ApiError, UpdateHospitalRequest>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (hospitalData: UpdateHospitalRequest) =>
      hospitalService.update(id, hospitalData),
    onSuccess: (data, variables, context) => {
      // Update both the specific hospital detail and list queries
      queryClient.invalidateQueries({ queryKey: hospitalKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: hospitalKeys.lists() });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * useDeleteHospital - Delete a hospital record
 *
 * Features:
 * - Soft or hard delete (depends on API)
 * - Automatic cache cleanup after deletion
 * - Confirmation handling supported
 * - Type-safe deletion with no parameters required
 *
 * @param id - Hospital ID to delete
 * @param options - Optional callbacks (onSuccess, onError)
 *
 * @returns Mutation object with mutate function and state
 *
 * @example
 * ```typescript
 * const { mutate: deleteHospital, isPending } = useDeleteHospital(hospitalId, {
 *   onSuccess: () => {
 *     // Hospital successfully deleted
 *     queryClient.removeQueries({ queryKey: hospitalKeys.detail(hospitalId) });
 *     queryClient.invalidateQueries({ queryKey: hospitalKeys.lists() });
 *     toast.success('Hospital deleted successfully');
 *     navigateToList();
 *   },
 *   onError: (error) => {
 *     toast.error(error.userMessage);
 *   }
 * });
 *
 * const handleDelete = () => {
 *   if (confirm('Are you sure you want to delete this hospital?')) {
 *     deleteHospital();
 *   }
 * };
 * ```
 */
export function useDeleteHospital(
  id: number,
  options?: Omit<UseMutationOptions<any, ApiError, void>, "mutationFn">,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => hospitalService.delete(id),
    onSuccess: (data, variables, context) => {
      // Remove from detail cache and invalidate lists
      queryClient.removeQueries({ queryKey: hospitalKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: hospitalKeys.lists() });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Export query key factory for manual cache management
 * Allows components to invalidate specific queries when needed
 */
export { hospitalKeys };
