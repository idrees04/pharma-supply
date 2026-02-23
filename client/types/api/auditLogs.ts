import { ApiResponse, PaginatedResponse } from './common';

// DTOs
export interface AuditLogDto {
    id: number;
    userId: number;
    userName: string | null;
    action: string | null;
    entityName: string | null;
    entityId: number | null;
    oldValues: string | null;
    newValues: string | null;
    timestamp: string; // ISO date
    ipAddress: string | null;
}

// Query parameters
export interface AuditLogListQueryParams {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    sortBy?: string;
    sortDescending?: boolean;
    startDate?: string; // ISO date
    endDate?: string;
    userId?: number;
    entityName?: string;
    action?: string;
}

// Response types
export type GetAuditLogsResponse = ApiResponse<PaginatedResponse<AuditLogDto>>;
export type GetAuditLogsByEntityResponse = ApiResponse<AuditLogDto[]>;
export type GetAuditLogsByUserResponse = ApiResponse<PaginatedResponse<AuditLogDto>>;