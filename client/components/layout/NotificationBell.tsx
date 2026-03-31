import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUnreadCount } from '@/hooks/notifications';
import { motion } from 'framer-motion';

export function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || null;

  const { data: unreadCount = 0 } = useUnreadCount(userId);

  const handleClick = () => {
    navigate('/notifications');
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className="relative h-9 w-9"
        title="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1"
          >
            <Badge
              variant="destructive"
              className="h-5 w-5 p-0 flex items-center justify-center text-xs font-bold"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          </motion.div>
        )}
      </Button>
    </motion.div>
  );
}
