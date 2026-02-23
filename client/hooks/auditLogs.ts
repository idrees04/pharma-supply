import { useGetQuery } from '@/api/hooks';
import { auditLogService } from '@/api/services/auditLogs';
import { AuditLogDto, AuditLogListQueryParams } from '@/types/api/auditLogs';
import { PaginatedResponse } from '@/types/api/common';

export function useAuditLogs(params?: AuditLogListQueryParams) {
    return useGetQuery<PaginatedResponse<AuditLogDto>>(
        ['auditLogs', params],
        () => auditLogService.getAuditLogs(params),
        {
            staleTime: 2 * 60 * 1000, // 2 minutes
        }
    );
}

export function useAuditLogsByEntity(entityName: string | null, entityId: number | null) {
    return useGetQuery<AuditLogDto[]>(
        ['auditLogs', 'entity', entityName, entityId],
        () => auditLogService.getAuditLogsByEntity(entityName!, entityId!),
        {
            enabled: entityName !== null && entityId !== null,
        }
    );
}

export function useAuditLogsByUser(
    userId: number | null,
    params?: Omit<AuditLogListQueryParams, 'userId' | 'entityName' | 'action' | 'startDate' | 'endDate'>
) {
    return useGetQuery<PaginatedResponse<AuditLogDto>>(
        ['auditLogs', 'user', userId, params],
        () => auditLogService.getAuditLogsByUser(userId!, params),
        {
            enabled: userId !== null,
        }
    );
}