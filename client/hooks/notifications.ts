import { useQueryClient } from '@tanstack/react-query';
import { useGetQuery, usePostMutation, usePutMutation, useDeleteMutation } from '@/api/hooks';
import { notificationService } from '@/api/services/notifications';
import {
    NotificationDto,
    CreateNotificationRequest,
    MarkAsReadRequest,
    NotificationListQueryParams,
} from '@/types/api/notifications';
import { PaginatedResponse } from '@/types/api/common';

export function useUserNotifications(userId: number | null, params?: NotificationListQueryParams) {
    return useGetQuery<PaginatedResponse<NotificationDto>>(
        ['notifications', userId, params],
        () => notificationService.getUserNotifications(userId!, params),
        {
            enabled: userId !== null,
        }
    );
}

export function useUnreadNotifications(userId: number | null) {
    return useGetQuery<NotificationDto[]>(
        ['notifications', userId, 'unread'],
        () => notificationService.getUnreadNotifications(userId!),
        {
            enabled: userId !== null,
            refetchInterval: 60 * 1000, // refetch every minute
        }
    );
}

export function useUnreadCount(userId: number | null) {
    return useGetQuery<number>(
        ['notifications', userId, 'unreadCount'],
        () => notificationService.getUnreadCount(userId!),
        {
            enabled: userId !== null,
            refetchInterval: 60 * 1000,
        }
    );
}

export function useCreateNotification() {
    const queryClient = useQueryClient();

    return usePostMutation<NotificationDto, CreateNotificationRequest>(
        (data) => notificationService.createNotification(data),
        {
            onSuccess: (_, variables) => {
                queryClient.invalidateQueries({ queryKey: ['notifications', variables.userId] });
                queryClient.invalidateQueries({ queryKey: ['notifications', variables.userId, 'unread'] });
                queryClient.invalidateQueries({ queryKey: ['notifications', variables.userId, 'unreadCount'] });
            },
        }
    );
}

export function useMarkAsRead(userId: number) {
    const queryClient = useQueryClient();

    return usePutMutation<void, MarkAsReadRequest>(
        (data) => notificationService.markAsRead(data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
                queryClient.invalidateQueries({ queryKey: ['notifications', userId, 'unread'] });
                queryClient.invalidateQueries({ queryKey: ['notifications', userId, 'unreadCount'] });
            },
        }
    );
}

export function useMarkNotificationAsRead(userId: number, notificationId: number) {
    const queryClient = useQueryClient();

    return usePutMutation<void, undefined>(
        () => notificationService.markNotificationAsRead(notificationId),
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
                queryClient.invalidateQueries({ queryKey: ['notifications', userId, 'unread'] });
                queryClient.invalidateQueries({ queryKey: ['notifications', userId, 'unreadCount'] });
            },
        }
    );
}

export function useDeleteNotification(userId: number) {
    const queryClient = useQueryClient();

    return useDeleteMutation(
        (id: number) => notificationService.deleteNotification(id),
        {
            onSuccess: (_, id) => {
                queryClient.removeQueries({ queryKey: ['notifications', userId, id] });
                queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
                queryClient.invalidateQueries({ queryKey: ['notifications', userId, 'unread'] });
                queryClient.invalidateQueries({ queryKey: ['notifications', userId, 'unreadCount'] });
            },
        }
    );
}