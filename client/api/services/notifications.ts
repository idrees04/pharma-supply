import { get, post, put, deleteRequest, RequestConfig } from '@/api/requests';
import {
    NotificationDto,
    CreateNotificationRequest,
    MarkAsReadRequest,
    NotificationListQueryParams,
    GetUserNotificationsResponse,
    GetUnreadNotificationsResponse,
    GetUnreadCountResponse,
    CreateNotificationResponse,
    MarkAsReadResponse,
    DeleteNotificationResponse,
} from '@/types/api/notifications';
import { PaginatedResponse } from '@/types/api/common';

export const notificationService = {
    /**
     * Get notifications for a user with pagination
     */
    getUserNotifications: async (
        userId: number,
        params?: NotificationListQueryParams,
        config?: RequestConfig
    ): Promise<PaginatedResponse<NotificationDto>> => {
        const queryParams = new URLSearchParams();

        if (params) {
            if (params.pageNumber !== undefined) queryParams.append('PageNumber', params.pageNumber.toString());
            if (params.pageSize !== undefined) queryParams.append('PageSize', params.pageSize.toString());
            if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);
            if (params.sortBy) queryParams.append('SortBy', params.sortBy);
            if (params.sortDescending !== undefined) queryParams.append('SortDescending', params.sortDescending.toString());
        }

        const url = `/api/Notifications/user/${userId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await get<GetUserNotificationsResponse>(url, config);
        return response.data;
    },

    /**
     * Get unread notifications for a user
     */
    getUnreadNotifications: async (userId: number, config?: RequestConfig): Promise<NotificationDto[]> => {
        const response = await get<GetUnreadNotificationsResponse>(
            `/api/Notifications/user/${userId}/unread`,
            config
        );
        return response.data;
    },

    /**
     * Get unread count for a user
     */
    getUnreadCount: async (userId: number, config?: RequestConfig): Promise<number> => {
        const response = await get<GetUnreadCountResponse>(
            `/api/Notifications/user/${userId}/unread-count`,
            config
        );
        return response.data;
    },

    /**
     * Create a new notification
     */
    createNotification: async (
        data: CreateNotificationRequest,
        config?: RequestConfig
    ): Promise<NotificationDto> => {
        const response = await post<CreateNotificationResponse, CreateNotificationRequest>(
            '/api/Notifications',
            data,
            config
        );
        return response.data;
    },

    /**
     * Mark multiple notifications as read
     */
    markAsRead: async (data: MarkAsReadRequest, config?: RequestConfig): Promise<void> => {
        await put<MarkAsReadResponse, MarkAsReadRequest>('/api/Notifications/mark-as-read', data, config);
    },

    /**
     * Mark a single notification as read
     */
    markNotificationAsRead: async (id: number, config?: RequestConfig): Promise<void> => {
        await put<MarkAsReadResponse, undefined>(`/api/Notifications/${id}/mark-as-read`, undefined, config);
    },

    /**
     * Delete a notification
     */
    deleteNotification: async (id: number, config?: RequestConfig): Promise<void> => {
        await deleteRequest<DeleteNotificationResponse>(`/api/Notifications/${id}`, config);
    },
};