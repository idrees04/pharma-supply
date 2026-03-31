import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  Bell,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Info,
  X,
  Mail,
  Archive,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUserNotifications, useMarkAsRead, useDeleteNotification } from '@/hooks/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { cn, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NotificationDto, NotificationType } from '@/types/api/notifications';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const ITEMS_PER_PAGE = 15;

type NotificationFilter = 'all' | 'unread' | 'read';

export default function NotificationCenter() {
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<number>>(
    new Set()
  );
  const [currentPage, setCurrentPage] = useState(1);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const userId = user?.id || null;

  const { data: notificationData, isLoading, error } = useUserNotifications(userId, {
    pageNumber: currentPage,
    pageSize: ITEMS_PER_PAGE,
  });

  const { mutate: markAsRead } = useMarkAsRead(userId || 0);
  const { mutate: deleteNotification } = useDeleteNotification(userId || 0);

  const notifications = notificationData?.items || [];
  const totalCount = notificationData?.totalCount || 0;

  const filteredNotifications = useMemo(() => {
    let result = notifications;

    if (filter === 'unread') {
      result = result.filter((n) => !n.isRead);
    } else if (filter === 'read') {
      result = result.filter((n) => n.isRead);
    }

    if (searchTerm) {
      result = result.filter(
        (n) =>
          n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.message?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return result;
  }, [notifications, filter, searchTerm]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const handleMarkAsRead = useCallback(
    (notificationId: number, isCurrentlyRead: boolean) => {
      markAsRead(
        { notificationIds: [notificationId], markAsRead: !isCurrentlyRead },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
            toast.success(
              isCurrentlyRead ? 'Marked as unread' : 'Marked as read'
            );
          },
        }
      );
    },
    [markAsRead, userId, queryClient]
  );

  const handleDelete = useCallback(
    (notificationId: number) => {
      deleteNotification(notificationId, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
          setSelectedNotifications(
            (prev) =>
              new Set([...prev].filter((id) => id !== notificationId))
          );
          toast.success('Notification deleted');
        },
      });
    },
    [deleteNotification, userId, queryClient]
  );

  const handleSelectAll = useCallback(() => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(
        new Set(filteredNotifications.map((n) => n.id))
      );
    }
  }, [filteredNotifications, selectedNotifications]);

  const handleToggleSelect = useCallback((notificationId: number) => {
    setSelectedNotifications((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  }, []);

  const handleBulkDelete = useCallback(() => {
    if (selectedNotifications.size === 0) return;
    Array.from(selectedNotifications).forEach((id) => {
      handleDelete(id);
    });
    setSelectedNotifications(new Set());
  }, [selectedNotifications, handleDelete]);

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 flex gap-3 items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800">Error loading notifications</h3>
            <p className="text-sm text-red-700 mt-1">
              {(error as any).userMessage || 'An error occurred'}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
              }
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">{unreadCount} New</Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your alerts and messages
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10"
            />
          </div>
          <Select value={filter} onValueChange={(value) => {
            setFilter(value as NotificationFilter);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-full sm:w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Notifications</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedNotifications.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 items-center bg-slate-50 p-3 rounded-lg"
          >
            <span className="text-sm font-medium text-muted-foreground">
              {selectedNotifications.size} selected
            </span>
            <div className="flex-1" />
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedNotifications(new Set())}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </Button>
          </motion.div>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-20 bg-slate-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-slate-100 rounded-full">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            <h3 className="font-semibold text-slate-900">No notifications</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm
                ? 'No notifications match your search'
                : 'You&apos;re all caught up!'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4 pb-4 border-b">
              <Checkbox
                checked={
                  filteredNotifications.length > 0 &&
                  selectedNotifications.size === filteredNotifications.length
                }
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium text-muted-foreground">
                Select All
              </span>
            </div>
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <NotificationCard
                  notification={notification}
                  isSelected={selectedNotifications.has(notification.id)}
                  onSelect={handleToggleSelect}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function NotificationCard({
  notification,
  isSelected,
  onSelect,
  onMarkAsRead,
  onDelete,
}: {
  notification: NotificationDto;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onMarkAsRead: (id: number, isRead: boolean) => void;
  onDelete: (id: number) => void;
}) {
  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.Success:
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case NotificationType.Warning:
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case NotificationType.Error:
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.Success:
        return 'bg-emerald-50 border-emerald-200';
      case NotificationType.Warning:
        return 'bg-amber-50 border-amber-200';
      case NotificationType.Error:
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <Card
      className={cn(
        'p-4 cursor-pointer transition-all hover:shadow-md border',
        getTypeColor(notification.type),
        notification.isRead ? 'opacity-75' : 'opacity-100'
      )}
      onClick={() => onSelect(notification.id)}
    >
      <div className="flex gap-3 items-start">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(notification.id)}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="p-2 rounded-lg bg-white flex items-center justify-center shrink-0">
          {getTypeIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 justify-between">
            <div className="flex-1">
              <h3 className={cn(
                'font-semibold truncate',
                notification.isRead
                  ? 'text-slate-600'
                  : 'text-slate-900'
              )}>
                {notification.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {notification.message}
              </p>
            </div>
            {!notification.isRead && (
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <span>{formatDate(notification.createdDate)}</span>
          </div>
        </div>
        <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onMarkAsRead(notification.id, notification.isRead)}
            className="h-8 w-8 p-0"
            title={notification.isRead ? 'Mark as unread' : 'Mark as read'}
          >
            {notification.isRead ? (
              <Mail className="w-4 h-4" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(notification.id)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
