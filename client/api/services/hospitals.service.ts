/**
 * Hospital Management API Service
 *
 * This service encapsulates all hospital-related API calls.
 * It provides a clean, typed interface for hospital management operations.
 *
 * Architecture Benefits:
 * - Centralized API calls (single point of change)
 * - Reusable across components and hooks
 * - Type-safe: all parameters and responses are typed
 * - Separation of concerns: HTTP logic separate from React/business logic
 * - Testable: easy to mock for unit tests
 *
 * Usage:
 * - Services are typically called by React Query hooks (useHospitals.ts)
 * - Hooks handle caching, loading states, and error handling
 * - Components use hooks, not this service directly
 */

import { get, post, put, deleteRequest } from "@/api/requests";
import {
  Hospital,
  CreateHospitalRequest,
  UpdateHospitalRequest,
  HospitalListQueryParams,
  GetHospitalsListResponse,
  CreateHospitalResponse,
  GetHospitalResponse,
  UpdateHospitalResponse,
  DeleteHospitalResponse,
  GetHospitalOrdersResponse,
} from "@/types/api/hospitals";

/**
 * Hospital Management Service
 * All API calls for hospital operations
 */
class HospitalService {
  /**
   * Get All Hospitals - Fetch paginated list of hospitals with search and filtering
   *
   * Endpoint: GET /api/Hospitals
   * @param params - Pagination, search, and sorting parameters
   * @returns Paginated list of hospitals
   *
   * Query Parameters:
   * - pageNumber: 1-based page number (default: 1)
   * - pageSize: Items per page (e.g., 10, 25, 50)
   * - searchTerm: Filter hospitals by name, email, or contact
   * - sortBy: Field to sort by (e.g., 'hospitalName', 'city', 'createdDate')
   * - sortDescending: Sort order (false=ascending, true=descending)
   *
   * @throws ApiError if request fails
   *
   * Usage:
   *   const response = await hospitalService.getAll({
   *     pageNumber: 1,
   *     pageSize: 25,
   *     searchTerm: 'Aga Khan',
   *     sortBy: 'hospitalName',
   *     sortDescending: false
   *   });
   *   const { items, totalCount } = response.data;
   */
  async getAll(
    params: HospitalListQueryParams,
  ): Promise<GetHospitalsListResponse> {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    ).toString();

    return get<GetHospitalsListResponse>(`/api/Hospitals?${queryString}`);
  }

  /**
   * Get Hospital by ID - Fetch a single hospital's details
   *
   * Endpoint: GET /api/Hospitals/{id}
   * @param id - Hospital ID
   * @returns Hospital details
   *
   * @throws ApiError if hospital not found (404) or server error
   *
   * Usage:
   *   const response = await hospitalService.getById(5);
   *   const hospital = response.data;
   */
  async getById(id: number): Promise<GetHospitalResponse> {
    return get<GetHospitalResponse>(`/api/Hospitals/${id}`);
  }

  /**
   * Create Hospital - Create a new hospital customer
   *
   * Endpoint: POST /api/Hospitals
   * @param hospitalData - Hospital creation payload
   * @returns Created hospital (with ID assigned by server)
   *
   * @throws ApiError on validation failure or server error
   *
   * Usage:
   *   const response = await hospitalService.create({
   *     hospitalName: 'Aga Khan Hospital',
   *     contactPerson: 'Dr. Ahmed Khan',
   *     phoneNumber: '021-4859222',
   *     email: 'info@agakhan.pk',
   *     address: 'Stadium Road',
   *     city: 'Karachi',
   *     state: 'Sindh',
   *     postalCode: '74000',
   *     taxNumber: 'NTN123456',
   *     registrationNumber: 'REG123456',
   *     hospitalType: 1,
   *     creditTermDays: 30,
   *     creditLimit: 500000
   *   });
   *   const newHospital = response.data;
   */
  async create(
    hospitalData: CreateHospitalRequest,
  ): Promise<CreateHospitalResponse> {
    return post<CreateHospitalResponse, CreateHospitalRequest>(
      "/api/Hospitals",
      hospitalData,
    );
  }

  /**
   * Update Hospital - Update hospital information
   *
   * Endpoint: PUT /api/Hospitals/{id}
   * @param id - Hospital ID to update
   * @param hospitalData - Updated hospital data
   * @returns Updated hospital
   *
   * @throws ApiError if validation fails or hospital not found
   *
   * Usage:
   *   const response = await hospitalService.update(5, {
   *     hospitalName: 'Aga Khan Hospital - Updated',
   *     contactPerson: 'Dr. Hassan Khan',
   *     phoneNumber: '021-4859333',
   *     email: 'contact@agakhan.pk',
   *     address: 'Stadium Road',
   *     city: 'Karachi',
   *     state: 'Sindh',
   *     postalCode: '74000',
   *     taxNumber: 'NTN123456',
   *     registrationNumber: 'REG123456',
   *     hospitalType: 1,
   *     creditTermDays: 30,
   *     creditLimit: 600000,
   *     status: 1,
   *     isActive: true
   *   });
   */
  async update(
    id: number,
    hospitalData: UpdateHospitalRequest,
  ): Promise<UpdateHospitalResponse> {
    return put<UpdateHospitalResponse, UpdateHospitalRequest>(
      `/api/Hospitals/${id}`,
      hospitalData,
    );
  }

  /**
   * Delete Hospital - Delete a hospital record
   *
   * Endpoint: DELETE /api/Hospitals/{id}
   * @param id - Hospital ID to delete
   * @returns Deletion confirmation
   *
   * @throws ApiError if hospital not found or server error
   *
   * Usage:
   *   const response = await hospitalService.delete(5);
   *   console.log(response.data); // true if successful
   */
  async delete(id: number): Promise<DeleteHospitalResponse> {
    return deleteRequest<DeleteHospitalResponse>(`/api/Hospitals/${id}`);
  }

  /**
   * Get Hospital Orders - Fetch orders and invoices for a hospital
   *
   * Endpoint: GET /api/Hospitals/{id}/orders
   * @param id - Hospital ID
   * @param startDate - Optional start date for filtering (ISO 8601)
   * @param endDate - Optional end date for filtering (ISO 8601)
   * @returns Hospital orders and financial summary
   *
   * Response includes:
   * - Order statistics (total, pending, completed, cancelled)
   * - Invoice statistics and amounts
   * - List of orders with details
   * - List of invoices with payment info
   *
   * @throws ApiError if hospital not found or server error
   *
   * Usage:
   *   const response = await hospitalService.getOrders(5, {
   *     startDate: '2024-01-01T00:00:00.000Z',
   *     endDate: '2024-12-31T23:59:59.999Z'
   *   });
   *   const { totalOrders, orders, invoices } = response.data;
   */
  async getOrders(
    id: number,
    params?: { startDate?: string; endDate?: string },
  ): Promise<GetHospitalOrdersResponse> {
    const queryString = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)]),
        ).toString()
      : "";

    const url = `/api/Hospitals/${id}/orders${queryString ? `?${queryString}` : ""}`;
    return get<GetHospitalOrdersResponse>(url);
  }
}

/**
 * Export singleton instance
 * Same instance used throughout the app (no redundant API wrappers)
 */
export const hospitalService = new HospitalService();

/**
 * Type exports for convenience
 * Allow components to import types directly from this module
 */
export type {
  Hospital,
  CreateHospitalRequest,
  UpdateHospitalRequest,
  HospitalListQueryParams,
};
