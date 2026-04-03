import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCheck, MessageSquareMore, RefreshCw, TriangleAlert } from 'lucide-react';

import { useCurrentUser } from '@/hooks/useAuth';
import {
  useMarkAsRead,
  useUnreadCount,
  useUnreadNotifications,
} from '@/hooks/notifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { NotificationType } from '@/types/api/notifications';

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

function getNotificationTone(type: NotificationType) {
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

export function NotificationBell() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const userId = user?.id ?? null;
  const { data: unreadCount = 0 } = useUnreadCount(userId);
  const {
    data: unreadNotifications = [],
    isPending,
    refetch,
    isRefetching,
  } = useUnreadNotifications(userId);
  const markAllReadMutation = useMarkAsRead(userId ?? 0);

  const notifications = useMemo(() => unreadNotifications.slice(0, 6), [unreadNotifications]);

  if (!userId) {
    return null;
  }

  const handleMarkAllRead = () => {
    if (unreadNotifications.length === 0) {
      return;
    }

    markAllReadMutation.mutate(
      { notificationIds: unreadNotifications.map((notification) => notification.id) },
      {
        onSuccess: () => {
          refetch();
        },
      },
    );
  };

  const handleNavigateToCenter = () => {
    setOpen(false);
    navigate('/notifications');
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Open notifications">
          <span className="relative inline-flex">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full p-0 sm:max-w-xl">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b px-6 py-5 text-left">
            <div className="flex items-start justify-between gap-4">
              <div>
                <SheetTitle>Notifications center</SheetTitle>
                <SheetDescription>
                  Review unread activity and keep the team aligned in real time.
                </SheetDescription>
              </div>
              <Badge variant="outline" className="shrink-0">
                {unreadCount} unread
              </Badge>
            </div>
          </SheetHeader>

          <div className="flex items-center justify-between gap-2 border-b px-6 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={unreadNotifications.length === 0 || markAllReadMutation.isPending}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
              <RefreshCw className={cn('mr-2 h-4 w-4', isRefetching && 'animate-spin')} />
              Refresh
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-3 p-6">
              {isPending ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-24 animate-pulse rounded-xl border bg-muted/40" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed px-6 py-14 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground/40" />
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">You're all caught up</h3>
                    <p className="text-sm text-muted-foreground">
                      New notifications will appear here automatically as they arrive.
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleNavigateToCenter}>
                    Open notifications center
                  </Button>
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={handleNavigateToCenter}
                    className={cn(
                      'w-full rounded-2xl border p-4 text-left transition-colors hover:bg-muted/50',
                      getNotificationTone(notification.type),
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-background/80 p-2 shadow-sm">
                        <MessageSquareMore className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium leading-tight text-foreground">
                              {notification.title || 'Notification'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatNotificationType(notification.type)} •{' '}
                              {formatDistanceToNow(new Date(notification.createdDate), { addSuffix: true })}
                            </p>
                          </div>
                          <TriangleAlert className="h-4 w-4 shrink-0 opacity-60" />
                        </div>
                        <p className="text-sm text-foreground/80 line-clamp-2">
                          {notification.message || 'Open the notification center to review this item.'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="flex items-center justify-between gap-2 border-t px-6 py-4">
            <p className="text-sm text-muted-foreground">
              {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
            </p>
            <Button onClick={handleNavigateToCenter}>View full center</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
