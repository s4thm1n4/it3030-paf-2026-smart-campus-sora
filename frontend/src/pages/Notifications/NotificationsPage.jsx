import { useState, useEffect, useCallback } from 'react';
import notificationService from '../../services/notificationService';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Icon from '../../components/common/Icon';

dayjs.extend(relativeTime);

const TYPE_CONFIG = {
  BOOKING_APPROVED: { icon: 'check_circle', color: 'text-success', bg: 'bg-success/10', label: 'Approved' },
  BOOKING_REJECTED: { icon: 'cancel', color: 'text-error', bg: 'bg-error/10', label: 'Rejected' },
  TICKET_STATUS_CHANGED: { icon: 'build', color: 'text-primary', bg: 'bg-primary/10', label: 'Ticket' },
  TICKET_ASSIGNED: { icon: 'person_add', color: 'text-accent', bg: 'bg-accent/10', label: 'Assigned' },
  NEW_COMMENT: { icon: 'chat', color: 'text-warning', bg: 'bg-warning/10', label: 'Comment' },
  SYSTEM: { icon: 'notifications', color: 'text-outline', bg: 'bg-outline/10', label: 'System' },
};

const FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'UNREAD', label: 'Unread' },
  { key: 'BOOKING', label: 'Bookings' },
  { key: 'TICKET', label: 'Tickets' },
  { key: 'SYSTEM', label: 'System' },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = filter === 'UNREAD'
        ? await notificationService.getUnread()
        : await notificationService.getAll();
      setNotifications(res.data);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Notification deleted');
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  // Apply client-side type filter
  const filtered = notifications.filter((n) => {
    if (filter === 'ALL' || filter === 'UNREAD') return true;
    if (filter === 'BOOKING') return n.type.startsWith('BOOKING');
    if (filter === 'TICKET') return n.type.startsWith('TICKET') || n.type === 'NEW_COMMENT';
    if (filter === 'SYSTEM') return n.type === 'SYSTEM';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface tracking-tight">
            Notifications
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-none hover:bg-primary/90 transition-colors"
          >
            <Icon name="verified" size={16} />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Icon name="filter_list" size={16} className="text-outline flex-shrink-0" />
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === key
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-lowest/80 border border-cell-border'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Section heading */}
      <p className="label-caps text-outline mb-3 text-xs font-semibold uppercase tracking-widest">
        {filter === 'ALL' ? 'All Notifications' : filter === 'UNREAD' ? 'Unread' : `${FILTERS.find(f => f.key === filter)?.label}`}
      </p>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest border border-cell-border rounded-none">
          <Icon name="notifications" size={48} className="text-outline mx-auto" />
          <p className="mt-4 text-on-surface text-lg font-display">No notifications</p>
          <p className="text-on-surface-variant text-sm mt-1">
            {filter !== 'ALL' ? 'Try a different filter' : "You're all caught up"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notification) => {
            const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.SYSTEM;

            return (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 border transition-colors rounded-none ${
                  notification.read
                    ? 'bg-surface-container-lowest border-cell-border'
                    : 'bg-primary-container/30 border-primary'
                }`}
              >
                {/* Type Icon */}
                <div className={`flex-shrink-0 p-2 rounded-none ${config.bg}`}>
                  <Icon name={config.icon} size={20} className={config.color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${notification.read ? 'text-on-surface-variant' : 'text-on-surface font-semibold'}`}>
                      {notification.title}
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                    {!notification.read && (
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></span>
                    )}
                  </div>
                  <p className="text-sm text-on-surface-variant mt-1">{notification.message}</p>
                  <p className="text-xs text-outline mt-2 font-mono">
                    {dayjs(notification.createdAt).fromNow()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="p-1.5 text-outline hover:text-primary hover:bg-primary/10 rounded-none transition-colors"
                      title="Mark as read"
                    >
                      <Icon name="check_circle" size={20} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="p-1.5 text-outline hover:text-error hover:bg-error/10 rounded-none transition-colors"
                    title="Delete"
                  >
                    <Icon name="delete" size={20} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
