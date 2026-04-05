import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { 
  Bell, 
  CheckCheck, 
  MessageSquareMore, 
  RefreshCw, 
  TriangleAlert,
  X,
  Search,
  Filter,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  BellRing,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import { useCurrentUser } from '@/hooks/useAuth';
import {
  useCreateNotification,
  useDeleteNotification,
  useMarkAsRead,
  useMarkNotificationAsRead,
  useUnreadCount,
  useUnreadNotifications,
  useUserNotifications,
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
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { NotificationType, NotificationDto } from '@/types/api/notifications';

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

// Animation variants for Framer Motion
const notificationVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.95 }
};

const bellVariants = {
  idle: { rotate: 0 },
  ring: { 
    rotate: [0, -15, 15, -10, 10, -5, 5, 0],
    transition: { duration: 0.5 }
  }
};

// Notification item component with animations
function NotificationItem({ 
  notification, 
  userId,
  onMarkAsRead,
  onDelete,
  onViewDetails
}: { 
  notification: NotificationDto;
  userId: number;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
  onViewDetails: (notification: NotificationDto) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const markReadMutation = useMarkNotificationAsRead(userId, notification.id);
  const deleteMutation = useDeleteNotification(userId);

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markReadMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Notification marked as read');
        onMarkAsRead(notification.id);
      }
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMutation.mutate(notification.id, {
      onSuccess: () => {
        toast.success('Notification deleted');
        onDelete(notification.id);
      }
    });
  };

  const handleClick = () => {
    onViewDetails(notification);
  };

  return (
    <motion.div
      variants={notificationVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      className="relative"
    >
      <div
        className={cn(
          'group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 cursor-pointer',
          'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]',
          'backdrop-blur-sm bg-white/95 dark:bg-gray-900/95',
          getNotificationTone(notification.type),
          notification.isRead ? 'opacity-80' : 'opacity-100'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        {/* Animated background effect */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent',
          'translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000',
          isHovered ? 'opacity-100' : 'opacity-0'
        )} />
        
        {/* Unread indicator */}
        {!notification.isRead && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -left-2 top-1/2 -translate-y-1/2"
          >
            <div className="h-3 w-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
            <div className="absolute inset-0 animate-ping rounded-full bg-blue-400" />
          </motion.div>
        )}

        <div className="relative flex items-start gap-3">
          {/* Animated icon */}
          <motion.div
            animate={{ 
              rotate: isHovered ? [0, 10, -10, 0] : 0,
              scale: isHovered ? 1.1 : 1
            }}
            transition={{ duration: 0.3 }}
            className={cn(
              'rounded-full p-2.5 shadow-lg transition-all duration-300',
              'bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900'
            )}
          >
            <MessageSquareMore className="h-4 w-4" />
          </motion.div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <motion.p 
                  className="font-semibold leading-tight text-foreground"
                  animate={{ x: isHovered ? 2 : 0 }}
                >
                  {notification.title || 'Notification'}
                </motion.p>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      'text-xs font-medium transition-all duration-300',
                      isHovered ? 'scale-105' : 'scale-100'
                    )}
                  >
                    {formatNotificationType(notification.type)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdDate), { addSuffix: true })}
                  </span>
                </div>
              </div>
              
              {/* Action buttons that appear on hover */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!notification.isRead && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-emerald-100 hover:text-emerald-700"
                              onClick={handleMarkAsRead}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Mark as read</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-rose-100 hover:text-rose-700"
                            onClick={handleDelete}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.p 
              className="text-sm text-foreground/80 line-clamp-2"
              animate={{ y: isHovered ? -1 : 0 }}
            >
              {notification.message || 'No message content'}
            </motion.p>

            {/* Progress bar for time since creation */}
            <div className="pt-2">
              <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                <motion.div
                  className={cn(
                    'h-full rounded-full',
                    notification.isRead ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-500 to-purple-500'
                  )}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 30, ease: 'linear' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function NotificationBell() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('unread');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: NotificationType.Info as NotificationType
  });

  const userId = user?.id ?? null;
  
  // All 7 hooks integrated
  const { data: unreadCount = 0 } = useUnreadCount(userId);
  const { data: unreadNotifications = [], refetch: refetchUnread, isPending: unreadPending } = useUnreadNotifications(userId);
  const { data: allNotificationsData, refetch: refetchAll, isPending: allPending } = useUserNotifications(userId, {
    pageNumber: 1,
    pageSize: 20,
    searchTerm: searchTerm || undefined,
    sortBy: 'createdDate',
    sortDescending: true
  });
  
  const markAllReadMutation = useMarkAsRead(userId ?? 0);
  const createNotificationMutation = useCreateNotification();
  const markNotificationAsReadMutation = useMarkNotificationAsRead(userId ?? 0, 0); // ID will be overridden
  const deleteNotificationMutation = useDeleteNotification(userId ?? 0);

  const [bellRinging, setBellRinging] = useState(false);

  // Trigger bell animation when new notifications arrive
  useEffect(() => {
    if (unreadCount > 0 && !open) {
      setBellRinging(true);
      const timer = setTimeout(() => setBellRinging(false), 500);
      return () => clearTimeout(timer);
    }
  }, [unreadCount, open]);

  if (!userId) {
    return null;
  }

  const allNotifications = allNotificationsData?.items || [];
  
  const filteredNotifications = useMemo(() => {
    const notifications = activeTab === 'unread' 
      ? unreadNotifications 
      : allNotifications.filter(n => activeTab === 'all' || n.isRead === (activeTab === 'read'));
    
    return notifications.filter(notification => 
      notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activeTab, unreadNotifications, allNotifications, searchTerm]);

  const handleMarkAllRead = () => {
    if (unreadNotifications.length === 0) return;
    
    markAllReadMutation.mutate(
      { notificationIds: unreadNotifications.map(n => n.id) },
      {
        onSuccess: () => {
          toast.success('All notifications marked as read');
          refetchUnread();
          refetchAll();
        }
      }
    );
  };

  const handleCreateNotification = () => {
    if (!newNotification.title.trim() || !newNotification.message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    createNotificationMutation.mutate(
      {
        userId,
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type
      },
      {
        onSuccess: () => {
          toast.success('Notification created successfully!');
          setNewNotification({ title: '', message: '', type: NotificationType.Info });
          setShowCreateForm(false);
          refetchUnread();
          refetchAll();
        },
        onError: (error) => {
          toast.error(`Failed to create notification: ${error.userMessage || 'Unknown error'}`);
        }
      }
    );
  };

  const handleNotificationAction = (action: 'read' | 'delete', id: number) => {
    if (action === 'read') {
      refetchUnread();
      refetchAll();
    } else if (action === 'delete') {
      refetchUnread();
      refetchAll();
    }
  };

  const handleViewDetails = (notification: NotificationDto) => {
    // In a real implementation, this would open a detail view
    // For now, we'll just mark it as read if it's unread
    if (!notification.isRead) {
      markNotificationAsReadMutation.mutate(undefined, {
        onSuccess: () => {
          refetchUnread();
          refetchAll();
        }
      });
    }
  };

  const isPending = unreadPending || allPending;
  const notificationsToShow = filteredNotifications.slice(0, 10);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <motion.div
          animate={bellRinging ? 'ring' : 'idle'}
          variants={bellVariants}
        >
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative group" 
            aria-label="Open notifications"
          >
            <motion.span 
              className="relative inline-flex"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Bell className="h-5 w-5 transition-all duration-300 group-hover:text-blue-500" />
              {unreadCount > 0 ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-500 px-1 text-[10px] font-bold text-white shadow-lg"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </motion.span>
              ) : null}
            </motion.span>
          </Button>
        </motion.div>
      </SheetTrigger>

      <SheetContent side="right" className="w-full p-0 sm:max-w-xl lg:max-w-2xl">
        <div className="flex h-full flex-col bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <BellRing className="h-6 w-6 text-white" />
                  </motion.div>
                  <SheetTitle className="text-2xl font-bold text-white">
                    Notification Center
                  </SheetTitle>
                </div>
                <SheetDescription className="text-blue-100">
                  Stay updated with real-time alerts and system notifications
                </SheetDescription>
              </div>
            </div>
          </div>

          {/* Search and filter bar */}
          <div className="border-b bg-white/50 dark:bg-gray-900/50 px-6 py-4 backdrop-blur-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-white/80 dark:bg-gray-800/80"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllRead}
                  disabled={unreadNotifications.length === 0 || markAllReadMutation.isPending}
                  className="gap-2"
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark all read
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { refetchUnread(); refetchAll(); }}
                  disabled={isPending}
                  className="gap-2"
                >
                  <RefreshCw className={cn('h-4 w-4', isPending && 'animate-spin')} />
                  Refresh
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  <Plus className="h-4 w-4" />
                  New
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="unread" className="gap-2">
                    <Zap className="h-4 w-4" />
                    Unread ({unreadCount})
                  </TabsTrigger>
                  <TabsTrigger value="all" className="gap-2">
                    <Bell className="h-4 w-4" />
                    All
                  </TabsTrigger>
                  <TabsTrigger value="read" className="gap-2">
                    <Eye className="h-4 w-4" />
                    Read
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Create notification form */}
          <AnimatePresence>
            {showCreateForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30"
              >
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Create New Notification</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowCreateForm(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Notification title"
                      value={newNotification.title}
                      onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                      className="bg-white dark:bg-gray-800"
                    />
                    <Input
                      placeholder="Notification message"
                      value={newNotification.message}
                      onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                      className="bg-white dark:bg-gray-800"
                    />
                    <div className="flex gap-2">
                      {Object.values(NotificationType).filter(v => typeof v === 'number').map((type) => (
                        <Button
                          key={type}
                          variant={newNotification.type === type ? "default" : "outline"}
                          size="sm"
                          onClick={() => setNewNotification(prev => ({ ...prev, type: type as NotificationType }))}
                          className={cn(
                            newNotification.type === type && 
                            'bg-gradient-to-r from-blue-500 to-purple-500'
                          )}
                        >
                          {formatNotificationType(type as NotificationType)}
                        </Button>
                      ))}
                    </div>
                    <Button
                      onClick={handleCreateNotification}
                      disabled={createNotificationMutation.isPending}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      {createNotificationMutation.isPending ? 'Creating...' : 'Create Notification'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notifications list */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              <AnimatePresence mode="wait">
                {isPending ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="h-32 animate-pulse rounded-2xl bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700" />
                    ))}
                  </motion.div>
                ) : notificationsToShow.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-6 rounded-2xl border border-dashed p-12 text-center"
                  >
                    <div className="relative">
                      <Bell className="h-16 w-16 text-muted-foreground/40" />
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0"
                      >
                        <Sparkles className="h-6 w-6 text-blue-500" />
                      </motion.div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">All caught up! 🎉</h3>
                      <p className="text-sm text-muted-foreground">
                        {searchTerm ? 'No notifications match your search' : 'No notifications to display'}
                      </p>
                    </div>
                    {!searchTerm && (
                      <Button 
                        variant="outline" 
                        onClick={() => setShowCreateForm(true)}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Create your first notification
                      </Button>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <AnimatePresence>
                      {notificationsToShow.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          userId={userId}
                          onMarkAsRead={(id) => handleNotificationAction('read', id)}
                          onDelete={(id) => handleNotificationAction('delete', id)}
                          onViewDetails={handleViewDetails}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t bg-white/50 dark:bg-gray-900/50 px-6 py-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {notificationsToShow.length} of {filteredNotifications.length} notifications
                </p>
                <p className="text-xs text-muted-foreground">
                  Real-time updates • Auto-refresh every 15s
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
