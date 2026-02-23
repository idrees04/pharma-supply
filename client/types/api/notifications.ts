import { ApiResponse, PaginatedResponse } from './common';

// Enums
export enum NotificationType {
    Info = 1,
    Success = 2,
    Warning = 3,
    Error = 4,
    LowStock = 5,
    Expiry = 6,
    PaymentDue = 7,
    OrderStatus = 8,
}

// DTOs
export interface NotificationDto {
    id: number;
    userId: number;
    userName: string | null;
    title: string | null;
    message: string | null;
    type: NotificationType;
    createdDate: string; // ISO date
    isRead: boolean;
}

// Request DTOs
export interface CreateNotificationRequest {
    userId: number;
    title?: string | null;
    message?: string | null;
    type: NotificationType;
}

export interface MarkAsReadRequest {
    notificationIds?: number[] | null;
}

// Query parameters
export interface NotificationListQueryParams {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    sortBy?: string;
    sortDescending?: boolean;
}

// Response types
export type GetUserNotificationsResponse = ApiResponse<PaginatedResponse<NotificationDto>>;
export type GetUnreadNotificationsResponse = ApiResponse<NotificationDto[]>;
export type GetUnreadCountResponse = ApiResponse<number>;
export type CreateNotificationResponse = ApiResponse<NotificationDto>;
export type MarkAsReadResponse = ApiResponse<null>;
export type DeleteNotificationResponse = ApiResponse<null>;