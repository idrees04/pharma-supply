/**
 * Hospital API Types
 *
 * Type definitions for all Hospital API endpoints.
 * These types are used for request/response type safety.
 *
 * API Base: https://mds.vtoxi.com/api/Hospitals
 */

/**
 * Hospital entity from the API
 * Core data structure for hospital master records
 */
export interface Hospital {
  id: number;
  hospitalName: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  taxNumber: string;
  registrationNumber: string;
  hospitalType: number;
  creditTermDays: number;
  creditLimit: number;
  outstandingBalance: number;
  status: number;
  isActive: boolean;
}

/**
 * Request body for creating a hospital (POST /api/Hospitals)
 * Only includes fields that should be set during creation
 */
export interface CreateHospitalRequest {
  hospitalName: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  taxNumber: string;
  registrationNumber: string;
  hospitalType: number;
  creditTermDays: number;
  creditLimit: number;
}

/**
 * Request body for updating a hospital (PUT /api/Hospitals/:id)
 * Includes all updatable fields
 */
export interface UpdateHospitalRequest {
  hospitalName: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  taxNumber: string;
  registrationNumber: string;
  hospitalType: number;
  creditTermDays: number;
  creditLimit: number;
  status: number;
  isActive: boolean;
}

/**
 * Query parameters for hospital list API
 */
export interface HospitalListQueryParams {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

/**
 * Paginated list response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

/**
 * API response wrapper structure
 * All API responses follow this structure
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string | null;
  timestamp: string;
}

/**
 * Hospital Orders Summary
 * Data returned by GET /api/Hospitals/:id/orders
 */
export interface HospitalOrder {
  id: number;
  orderNumber: string;
  orderDate: string; // ISO 8601 date string
  status: string;
  totalAmount: number;
}

/**
 * Hospital Invoice
 * Includes in hospital orders summary response
 */
export interface HospitalInvoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string; // ISO 8601 date string
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
}

/**
 * Hospital Orders Response
 * Complete data structure for hospital orders endpoint
 */
export interface HospitalOrdersData {
  hospitalId: number;
  hospitalName: string;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalInvoices: number;
  totalInvoiceAmount: number;
  totalPaidAmount: number;
  totalOutstandingAmount: number;
  orders: HospitalOrder[];
  invoices: HospitalInvoice[];
}

/**
 * GET /api/Hospitals response
 */
export type GetHospitalsListResponse = ApiResponse<PaginatedResponse<Hospital>>;

/**
 * POST /api/Hospitals response
 */
export type CreateHospitalResponse = ApiResponse<Hospital>;

/**
 * GET /api/Hospitals/:id response
 */
export type GetHospitalResponse = ApiResponse<Hospital>;

/**
 * PUT /api/Hospitals/:id response
 */
export type UpdateHospitalResponse = ApiResponse<Hospital>;

/**
 * DELETE /api/Hospitals/:id response
 */
export type DeleteHospitalResponse = ApiResponse<boolean>;

/**
 * GET /api/Hospitals/:id/orders response
 */
export type GetHospitalOrdersResponse = ApiResponse<HospitalOrdersData>;
