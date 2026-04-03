import { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  CheckCheck,
  FilterX,
  RefreshCw,
  Search,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCurrentUser } from '@/hooks/useAuth';
import {
  useDeleteNotification,
  useMarkAsRead,
  useMarkNotificationAsRead,
  useUnreadCount,
  useUserNotifications,
} from '@/hooks/notifications';
import { NotificationDto, NotificationType } from '@/types/api/notifications';
import { cn } from '@/lib/utils';

const statusOptions = [
  { value: 'all', label: 'All notifications' },
  { value: 'unread', label: 'Unread only' },
  { value: 'read', label: 'Read only' },
] as const;

type StatusFilter = (typeof statusOptions)[number]['value'];

function formatNotificationType(type: NotificationType) {
  switch (type) {
    case NotificationType.Success:
      return 'Success';
    case NotificationType.Warning:
      return 'Warning';
    case NotificationType.Error:
      return 'Error';
    case NotificationType.LowStock:
      return 'Low stock';
    case NotificationType.Expiry:
      return 'Expiry';
    case NotificationType.PaymentDue:
      return 'Payment due';
    case NotificationType.OrderStatus:
      return 'Order status';
    default:
      return 'Info';
  }
}

function getTone(type: NotificationType) {
  switch (type) {
    case NotificationType.Success:
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case NotificationType.Warning:
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case NotificationType.Error:
      return 'border-rose-200 bg-rose-50 text-rose-700';
    case NotificationType.LowStock:
      return 'border-orange-200 bg-orange-50 text-orange-700';
    case NotificationType.Expiry:
      return 'border-violet-200 bg-violet-50 text-violet-700';
    case NotificationType.PaymentDue:
      return 'border-sky-200 bg-sky-50 text-sky-700';
    case NotificationType.OrderStatus:
      return 'border-cyan-200 bg-cyan-50 text-cyan-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
}

function exportNotificationsCsv(notifications: NotificationDto[]) {
  const header = ['id', 'userName', 'title', 'message', 'type', 'createdDate', 'isRead'];
  const rows = notifications.map((notification) => [
    notification.id,
    notification.userName ?? '',
    notification.title ?? '',
    (notification.message ?? '').replaceAll('"', '""'),
    formatNotificationType(notification.type),
    notification.createdDate,
    notification.isRead ? 'true' : 'false',
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((value) => `"${String(value)}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'notifications.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function NotificationRow({
  notification,
  userId,
  onOpen,
}: {
  notification: NotificationDto;
  userId: number;
  onOpen: (notification: NotificationDto) => void;
}) {
  const markReadMutation = useMarkNotificationAsRead(userId, notification.id);
  const deleteMutation = useDeleteNotification(userId);

  return (
    <TableRow
      className={cn('cursor-pointer transition-colors hover:bg-muted/40', notification.isRead ? 'opacity-75' : '')}
      onClick={() => onOpen(notification)}
    >
      <TableCell>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{notification.title || 'Notification'}</p>
            {!notification.isRead ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
          </div>
          <p className="max-w-xl text-sm text-muted-foreground line-clamp-2">
            {notification.message || 'No message available.'}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={getTone(notification.type)}>
          {formatNotificationType(notification.type)}
        </Badge>
      </TableCell>
      <TableCell>{notification.userName || 'System'}</TableCell>
      <TableCell>{formatDistanceToNow(new Date(notification.createdDate), { addSuffix: true })}</TableCell>
      <TableCell>
        <Badge variant={notification.isRead ? 'secondary' : 'default'}>
          {notification.isRead ? 'Read' : 'Unread'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {!notification.isRead ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={(event) => {
                event.stopPropagation();
                markReadMutation.mutate(undefined, {
                  onSuccess: () => {
                    toast.success('Notification marked as read.');
                  },
                });
              }}
            >
              <CheckCheck className="h-4 w-4" />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={(event) => {
              event.stopPropagation();
              deleteMutation.mutate(notification.id, {
                onSuccess: () => {
                  toast.success('Notification deleted.');
                },
              });
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function NotificationsPage() {
  const user = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedNotification, setSelectedNotification] = useState<NotificationDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NotificationDto | null>(null);

  const userId = user?.id ?? null;
  const queryParams = useMemo(
    () => ({
      pageNumber: 1,
      pageSize: 100,
      searchTerm: searchTerm.trim() || undefined,
      sortBy: 'createdDate',
      sortDescending: true,
    }),
    [searchTerm],
  );

  const { data, isPending, error, refetch, isRefetching } = useUserNotifications(userId, queryParams);
  const { data: unreadCount = 0 } = useUnreadCount(userId);
  const markAllReadMutation = useMarkAsRead(userId ?? 0);
  const deleteNotificationMutation = useDeleteNotification(userId ?? 0);

  useEffect(() => {
    if (!selectedNotification && data?.items?.length) {
      return;
    }
  }, [data, selectedNotification]);

  const notifications = data?.items ?? [];
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (statusFilter === 'unread' && notification.isRead) {
        return false;
      }

      if (statusFilter === 'read' && !notification.isRead) {
        return false;
      }

      return true;
    });
  }, [notifications, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: notifications.length,
      unread: notifications.filter((notification) => !notification.isRead).length,
      read: notifications.filter((notification) => notification.isRead).length,
      alerts: notifications.filter((notification) =>
        [NotificationType.Error, NotificationType.Warning, NotificationType.LowStock, NotificationType.Expiry].includes(notification.type),
      ).length,
    };
  }, [notifications]);

  const handleMarkAllRead = () => {
    const unreadIds = filteredNotifications.filter((notification) => !notification.isRead).map((notification) => notification.id);

    if (unreadIds.length === 0) {
      return;
    }

    markAllReadMutation.mutate(
      { notificationIds: unreadIds },
      {
        onSuccess: () => {
          toast.success('Notifications marked as read.');
          refetch();
        },
      },
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  if (!userId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Bell className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <h1 className="mt-4 text-2xl font-semibold">Notifications center</h1>
          <p className="mt-2 text-muted-foreground">Sign in to view your notification feed.</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <TriangleAlert className="h-10 w-10 text-destructive" />
          <div>
            <h1 className="text-2xl font-semibold">Unable to load notifications</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error.userMessage || 'Notification feed unavailable.'}</p>
          </div>
          <Button onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live system updates, operational alerts, and workflow notifications.
          </p>
        </div>
        <div className="flex gap-2 self-start">
          <Button variant="outline" onClick={() => refetch()} disabled={isRefetching} className="gap-2">
            <RefreshCw className={cn('h-4 w-4', isRefetching && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => exportNotificationsCsv(filteredNotifications)} className="gap-2">
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Unread</CardDescription>
            <CardTitle className="text-3xl">{unreadCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Read</CardDescription>
            <CardTitle className="text-3xl">{stats.read}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Alerts</CardDescription>
            <CardTitle className="text-3xl">{stats.alerts}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Filter notifications</CardTitle>
            <CardDescription>Search by title or message and review items by read state.</CardDescription>
          </div>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search notifications"
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={clearFilters} className="gap-2">
              <FilterX className="h-4 w-4" />
              Clear filters
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Notification feed</CardTitle>
            <CardDescription>
              {filteredNotifications.length} of {notifications.length} notifications shown.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={handleMarkAllRead} className="gap-2">
            <CheckCheck className="h-4 w-4" />
            Mark visible as read
          </Button>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-xl bg-muted/50" />
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-6 py-14 text-center">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h2 className="mt-4 text-xl font-semibold">No notifications match this filter</h2>
              <p className="mt-2 text-sm text-muted-foreground">Try a different search term or clear the filters.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Notification</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotifications.map((notification) => (
                    <NotificationRow
                      key={notification.id}
                      notification={notification}
                      userId={userId}
                      onOpen={setSelectedNotification}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={selectedNotification !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedNotification(null);
          }
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selectedNotification ? (
            <>
              <SheetHeader>
                <SheetTitle>{selectedNotification.title || 'Notification details'}</SheetTitle>
                <SheetDescription>
                  Review the event metadata and full message payload.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={cn('border', getTone(selectedNotification.type))}>
                    {formatNotificationType(selectedNotification.type)}
                  </Badge>
                  <Badge variant={selectedNotification.isRead ? 'secondary' : 'default'}>
                    {selectedNotification.isRead ? 'Read' : 'Unread'}
                  </Badge>
                </div>

                <Card>
                  <CardContent className="space-y-4 pt-6">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Message</div>
                      <p className="mt-2 text-sm leading-6">
                        {selectedNotification.message || 'No message content provided.'}
                      </p>
                    </div>
                    <Separator />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">User</div>
                        <div className="mt-1 text-sm">{selectedNotification.userName || 'System'}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Created</div>
                        <div className="mt-1 text-sm">
                          {formatDistanceToNow(new Date(selectedNotification.createdDate), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  {!selectedNotification.isRead ? (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        setSelectedNotification(null);
                        markAllReadMutation.mutate(
                          { notificationIds: [selectedNotification.id] },
                          {
                            onSuccess: () => {
                              toast.success('Notification marked as read.');
                              refetch();
                            },
                          },
                        );
                      }}
                    >
                      <CheckCheck className="h-4 w-4" />
                      Mark read
                    </Button>
                  ) : null}
                  <Button
                    variant="destructive"
                    className="gap-2"
                    onClick={() => setDeleteTarget(selectedNotification)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete notification"
        description={deleteTarget ? `Delete the notification "${deleteTarget.title || 'Untitled'}"?` : 'This cannot be undone.'}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => {
          if (!deleteTarget) {
            return;
          }

          deleteNotificationMutation.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success('Notification deleted.');
              setDeleteTarget(null);
              setSelectedNotification(null);
              refetch();
            },
          });
        }}
      />
    </div>
  );
}
