import { useState, useEffect, useCallback } from 'react';
import notificationService from '../../services/notificationService';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineWrenchScrewdriver,
  HiOutlineUserPlus,
  HiOutlineChatBubbleLeft,
  HiOutlineBell,
  HiOutlineTrash,
  HiOutlineCheckBadge,
  HiOutlineFunnel,
} from 'react-icons/hi2';

dayjs.extend(relativeTime);

const TYPE_CONFIG = {
  BOOKING_APPROVED: { icon: HiOutlineCheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Approved' },
  BOOKING_REJECTED: { icon: HiOutlineXCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Rejected' },
  TICKET_STATUS_CHANGED: { icon: HiOutlineWrenchScrewdriver, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Ticket' },
  TICKET_ASSIGNED: { icon: HiOutlineUserPlus, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Assigned' },
  NEW_COMMENT: { icon: HiOutlineChatBubbleLeft, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Comment' },
  SYSTEM: { icon: HiOutlineBell, color: 'text-gray-600', bg: 'bg-gray-50', label: 'System' },
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <HiOutlineCheckBadge className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <HiOutlineFunnel className="w-4 h-4 text-gray-400 flex-shrink-0" />
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === key
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <HiOutlineBell className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500 text-lg">No notifications</p>
          <p className="text-gray-400 text-sm mt-1">
            {filter !== 'ALL' ? 'Try a different filter' : "You're all caught up"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((notification) => {
            const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.SYSTEM;
            const Icon = config.icon;

            return (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                  notification.read
                    ? 'bg-white border-gray-200'
                    : 'bg-indigo-50/50 border-indigo-200'
                }`}
              >
                {/* Type Icon */}
                <div className={`flex-shrink-0 p-2 rounded-lg ${config.bg}`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${notification.read ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                      {notification.title}
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                    {!notification.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {dayjs(notification.createdAt).fromNow()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      title="Mark as read"
                    >
                      <HiOutlineCheckCircle className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete"
                  >
                    <HiOutlineTrash className="w-5 h-5" />
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
