import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useAuth } from '../../context/AuthContext';
import facilityService from '../../services/facilityService';
import bookingService from '../../services/bookingService';
import ticketService from '../../services/ticketService';
import notificationService from '../../services/notificationService';
import Icon from '../../components/common/Icon';

dayjs.extend(relativeTime);

export default function HomePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    facilities: 0,
    bookings: 0,
    tickets: 0,
    unreadNotifications: 0,
  });
  const [recentNotifications, setRecentNotifications] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [facilitiesRes, bookingsRes, ticketsRes, unreadCountRes, notificationsRes] =
          await Promise.all([
            facilityService.getAll(),
            bookingService.getMyBookings(),
            ticketService.getMyTickets(),
            notificationService.getUnreadCount(),
            notificationService.getAll(),
          ]);

        setStats({
          facilities: facilitiesRes.data?.length ?? 0,
          bookings: bookingsRes.data?.length ?? 0,
          tickets: ticketsRes.data?.length ?? 0,
          unreadNotifications: typeof unreadCountRes.data === 'number' ? unreadCountRes.data : unreadCountRes.data?.count ?? 0,
        });

        const allNotifs = Array.isArray(notificationsRes.data) ? notificationsRes.data : [];
        setRecentNotifications(allNotifs.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-10 w-10 animate-spin rounded-none border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Facilities',
      value: stats.facilities,
      icon: 'apartment',
      accent: 'text-primary',
      accentBg: 'bg-primary-container',
    },
    {
      label: 'My Bookings',
      value: stats.bookings,
      icon: 'calendar_month',
      accent: 'text-primary',
      accentBg: 'bg-primary-container',
    },
    {
      label: 'My Tickets',
      value: stats.tickets,
      icon: 'confirmation_number',
      accent: 'text-accent',
      accentBg: 'bg-accent/10',
    },
    {
      label: 'Unread Alerts',
      value: stats.unreadNotifications,
      icon: 'notifications',
      accent: 'text-accent',
      accentBg: 'bg-accent/10',
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── Welcome Banner ── */}
      <div className="cell-border bg-surface-container p-6 flex items-center gap-5">
        {user?.profilePictureUrl ? (
          <img
            src={user.profilePictureUrl}
            alt={user.name}
            className="h-16 w-16 rounded-full border-2 border-primary object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-on-primary font-display text-2xl font-bold">
            {user?.name?.charAt(0) ?? '?'}
          </div>
        )}
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">
            Welcome back, {user?.name?.split(' ')[0] ?? 'User'}
          </h1>
          <p className="mt-0.5 text-sm text-on-surface-variant font-mono">
            // sora-ums overview &mdash; {dayjs().format('YYYY-MM-DD')}
          </p>
        </div>
        <div className="ml-auto hidden sm:flex items-center gap-2">
          <span className="label-caps text-on-surface-variant text-xs">Status</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Online
          </span>
        </div>
      </div>

      {/* ── Stat Cards — Bento Grid ── */}
      <div>
        <h2 className="label-caps text-on-surface-variant text-xs mb-3">Dashboard Metrics</h2>
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="cell-border bg-surface p-5 flex flex-col justify-between gap-4 transition hover:bg-surface-container-low"
            >
              <div className="flex items-center justify-between">
                <span className="label-caps text-on-surface-variant text-xs">{card.label}</span>
                <div className={`${card.accentBg} p-2`}>
                  <Icon name={card.icon} className={card.accent} size={20} />
                </div>
              </div>
              <p className={`font-display text-4xl font-bold ${card.accent}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="label-caps text-on-surface-variant text-xs mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/facilities"
            className="cell-border inline-flex items-center gap-2 bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary/90"
          >
            <Icon name="apartment" size={18} />
            Browse Facilities
            <Icon name="arrow_forward" size={16} />
          </Link>
          <Link
            to="/bookings"
            className="cell-border inline-flex items-center gap-2 bg-surface px-5 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low"
          >
            <Icon name="calendar_month" size={18} />
            My Bookings
            <Icon name="arrow_forward" size={16} />
          </Link>
          <Link
            to="/tickets"
            className="cell-border inline-flex items-center gap-2 bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
          >
            <Icon name="confirmation_number" size={18} />
            Report an Issue
            <Icon name="arrow_forward" size={16} />
          </Link>
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div>
        <h2 className="label-caps text-on-surface-variant text-xs mb-3">Recent Activity</h2>
        {recentNotifications.length === 0 ? (
          <div className="cell-border bg-surface-container-low p-8 text-center">
            <Icon name="notifications" className="text-outline mx-auto mb-2" size={32} />
            <p className="text-sm text-on-surface-variant font-mono">
              No recent activity to display.
            </p>
          </div>
        ) : (
          <div className="cell-border bg-surface overflow-hidden">
            {recentNotifications.map((notif, idx) => (
              <div
                key={notif.id}
                className={`flex items-start gap-3 px-5 py-4 transition hover:bg-surface-container-low ${
                  idx < recentNotifications.length - 1 ? 'border-b border-cell-border' : ''
                }`}
              >
                <Icon
                  name="notifications"
                  className={`mt-0.5 shrink-0 ${notif.read ? 'text-outline' : 'text-accent'}`}
                  size={20}
                  filled={!notif.read}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-on-surface">
                    {notif.title ?? 'Notification'}
                  </p>
                  <p className="truncate text-sm text-on-surface-variant">{notif.message}</p>
                </div>
                <span className="shrink-0 text-xs font-mono text-outline">
                  {notif.createdAt ? dayjs(notif.createdAt).fromNow() : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
