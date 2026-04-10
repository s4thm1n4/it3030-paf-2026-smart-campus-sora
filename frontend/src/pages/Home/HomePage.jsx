import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useAuth } from '../../context/AuthContext';
import facilityService from '../../services/facilityService';
import bookingService from '../../services/bookingService';
import ticketService from '../../services/ticketService';
import notificationService from '../../services/notificationService';
import adminService from '../../services/adminService';
import Icon from '../../components/common/Icon';
import { StatusDonut, StatusBarChart } from './DashboardCharts';
import {
  computeBookingStats,
  computeTicketStats,
  computePriorityStats,
  computeCategoryStats,
  computeFacilityTypeStats,
  computeRoleStats,
} from './dashboardUtils';

dayjs.extend(relativeTime);

export default function HomePage() {
  const { user, isAdmin } = useAuth();
  const admin = isAdmin();

  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const calls = [
          facilityService.getAll(),
          admin ? bookingService.getAll() : bookingService.getMyBookings(),
          admin ? ticketService.getAll() : ticketService.getMyTickets(),
          notificationService.getUnreadCount(),
          notificationService.getAll(),
        ];
        if (admin) calls.push(adminService.getUsers());

        const results = await Promise.allSettled(calls);
        const [facilitiesRes, bookingsRes, ticketsRes, unreadRes, notifsRes] = results;
        const usersRes = admin ? results[5] : null;

        const extract = (res) =>
          res?.status === 'fulfilled' ? (Array.isArray(res.value.data) ? res.value.data : []) : [];

        setFacilities(extract(facilitiesRes));
        setBookings(extract(bookingsRes));
        setTickets(extract(ticketsRes));
        if (usersRes) setUsers(extract(usersRes));

        if (unreadRes?.status === 'fulfilled') {
          const d = unreadRes.value.data;
          setUnreadCount(typeof d === 'number' ? d : d?.count ?? 0);
        }
        if (notifsRes?.status === 'fulfilled') {
          const all = Array.isArray(notifsRes.value.data) ? notifsRes.value.data : [];
          setRecentNotifications(all.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [admin]);

  /* ── Derived chart data ── */
  const bookingChartData = useMemo(() => computeBookingStats(bookings), [bookings]);
  const ticketChartData = useMemo(() => computeTicketStats(tickets), [tickets]);
  const facilityChartData = useMemo(() => computeFacilityTypeStats(facilities), [facilities]);
  const priorityChartData = useMemo(() => computePriorityStats(tickets), [tickets]);
  const categoryChartData = useMemo(() => computeCategoryStats(tickets), [tickets]);
  const roleChartData = useMemo(() => computeRoleStats(users), [users]);

  const pendingBookings = useMemo(() => bookings.filter((b) => b.status === 'PENDING').length, [bookings]);
  const openTickets = useMemo(() => tickets.filter((t) => t.status === 'OPEN').length, [tickets]);

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
      value: facilities.length,
      icon: 'apartment',
      accent: 'text-primary',
      accentBg: 'bg-primary-container',
    },
    {
      label: admin ? 'All Bookings' : 'My Bookings',
      value: bookings.length,
      icon: 'calendar_month',
      accent: 'text-primary',
      accentBg: 'bg-primary-container',
    },
    {
      label: admin ? 'All Tickets' : 'My Tickets',
      value: tickets.length,
      icon: 'confirmation_number',
      accent: 'text-accent',
      accentBg: 'bg-accent/10',
    },
    {
      label: 'Unread Alerts',
      value: unreadCount,
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
          <span
            className={`label-caps text-xs px-3 py-1 font-semibold ${
              admin
                ? 'bg-error/10 text-error'
                : 'bg-primary/10 text-primary'
            }`}
          >
            {user?.role ?? 'USER'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Online
          </span>
        </div>
      </div>

      {/* ── Admin Alert Banner ── */}
      {admin && (pendingBookings > 0 || openTickets > 0) && (
        <div className="cell-border bg-accent/5 p-4 flex items-center gap-4">
          <div className="bg-accent/10 p-2.5">
            <Icon name="pending_actions" className="text-accent" size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-on-surface">Action Required</p>
            <p className="text-xs text-on-surface-variant">
              {pendingBookings > 0 && <>{pendingBookings} booking{pendingBookings !== 1 && 's'} pending approval</>}
              {pendingBookings > 0 && openTickets > 0 && ' \u00B7 '}
              {openTickets > 0 && <>{openTickets} open ticket{openTickets !== 1 && 's'}</>}
            </p>
          </div>
          <Link
            to="/bookings"
            className="cell-border bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent/90"
          >
            Review
          </Link>
        </div>
      )}

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
              <p className={`font-display text-4xl font-bold ${card.accent}`}>{card.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts ── */}
      {admin ? (
        <>
          {/* Admin: Status bar charts */}
          <div>
            <h2 className="label-caps text-on-surface-variant text-xs mb-3">Status Overview</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <StatusBarChart data={bookingChartData} title="Booking Status" />
              <StatusBarChart data={ticketChartData} title="Ticket Status" />
            </div>
          </div>
          {/* Admin: Breakdown donuts */}
          <div>
            <h2 className="label-caps text-on-surface-variant text-xs mb-3">Analytics Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              <StatusDonut data={priorityChartData} title="Ticket Priority" />
              <StatusBarChart data={categoryChartData} title="Top Categories" />
              <StatusDonut data={roleChartData} title="Users by Role" />
            </div>
          </div>
        </>
      ) : (
        <div>
          <h2 className="label-caps text-on-surface-variant text-xs mb-3">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            <StatusDonut data={bookingChartData} title="Booking Status" />
            <StatusDonut data={ticketChartData} title="Ticket Status" />
            <StatusDonut data={facilityChartData} title="Facility Types" />
          </div>
        </div>
      )}

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
            {admin ? 'Review Bookings' : 'My Bookings'}
            <Icon name="arrow_forward" size={16} />
          </Link>
          {admin ? (
            <>
              <Link
                to="/admin"
                className="cell-border inline-flex items-center gap-2 bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
              >
                <Icon name="confirmation_number" size={18} />
                Manage Tickets
                <Icon name="arrow_forward" size={16} />
              </Link>
              <Link
                to="/admin/users"
                className="cell-border inline-flex items-center gap-2 bg-surface px-5 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low"
              >
                <Icon name="group" size={18} />
                User Management
                <Icon name="arrow_forward" size={16} />
              </Link>
            </>
          ) : (
            <Link
              to="/tickets"
              className="cell-border inline-flex items-center gap-2 bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
            >
              <Icon name="confirmation_number" size={18} />
              Report an Issue
              <Icon name="arrow_forward" size={16} />
            </Link>
          )}
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
