import { get, RequestConfig } from '@/api/requests';
import {
    AuditLogDto,
    AuditLogListQueryParams,
    GetAuditLogsResponse,
    GetAuditLogsByEntityResponse,
    GetAuditLogsByUserResponse,
} from '@/types/api/auditLogs';
import { PaginatedResponse } from '@/types/api/common';

export const auditLogService = {
    /**
     * Get audit logs with filtering and pagination
     */
    getAuditLogs: async (
        params?: AuditLogListQueryParams,
        config?: RequestConfig
    ): Promise<PaginatedResponse<AuditLogDto>> => {
        const queryParams = new URLSearchParams();

        if (params) {
            if (params.pageNumber !== undefined) queryParams.append('PageNumber', params.pageNumber.toString());
            if (params.pageSize !== undefined) queryParams.append('PageSize', params.pageSize.toString());
            if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);
            if (params.sortBy) queryParams.append('SortBy', params.sortBy);
            if (params.sortDescending !== undefined) queryParams.append('SortDescending', params.sortDescending.toString());
            if (params.startDate) queryParams.append('StartDate', params.startDate);
            if (params.endDate) queryParams.append('EndDate', params.endDate);
            if (params.userId !== undefined) queryParams.append('UserId', params.userId.toString());
            if (params.entityName) queryParams.append('EntityName', params.entityName);
            if (params.action) queryParams.append('Action', params.action);
        }

        const url = `/api/AuditLogs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await get<GetAuditLogsResponse>(url, config);
        return response.data;
    },

    /**
     * Get audit logs by entity
     */
    getAuditLogsByEntity: async (
        entityName: string,
        entityId: number,
        config?: RequestConfig
    ): Promise<AuditLogDto[]> => {
        const response = await get<GetAuditLogsByEntityResponse>(
            `/api/AuditLogs/by-entity/${entityName}/${entityId}`,
            config
        );
        return response.data;
    },

    /**
     * Get audit logs by user with pagination
     */
    getAuditLogsByUser: async (
        userId: number,
        params?: Omit<AuditLogListQueryParams, 'userId' | 'entityName' | 'action' | 'startDate' | 'endDate'>,
        config?: RequestConfig
    ): Promise<PaginatedResponse<AuditLogDto>> => {
        const queryParams = new URLSearchParams();

        if (params) {
            if (params.pageNumber !== undefined) queryParams.append('PageNumber', params.pageNumber.toString());
            if (params.pageSize !== undefined) queryParams.append('PageSize', params.pageSize.toString());
            if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);
            if (params.sortBy) queryParams.append('SortBy', params.sortBy);
            if (params.sortDescending !== undefined) queryParams.append('SortDescending', params.sortDescending.toString());
        }

        const url = `/api/AuditLogs/by-user/${userId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await get<GetAuditLogsByUserResponse>(url, config);
        return response.data;
    },
};