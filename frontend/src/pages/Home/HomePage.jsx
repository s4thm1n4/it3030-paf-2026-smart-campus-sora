import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiOutlineWrenchScrewdriver,
  HiOutlineBell,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useAuth } from '../../context/AuthContext';
import facilityService from '../../services/facilityService';
import bookingService from '../../services/bookingService';
import ticketService from '../../services/ticketService';
import notificationService from '../../services/notificationService';

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
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Facilities',
      value: stats.facilities,
      icon: HiOutlineBuildingOffice2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    {
      label: 'My Bookings',
      value: stats.bookings,
      icon: HiOutlineCalendarDays,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
    },
    {
      label: 'My Tickets',
      value: stats.tickets,
      icon: HiOutlineWrenchScrewdriver,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
    },
    {
      label: 'Unread Notifications',
      value: stats.unreadNotifications,
      icon: HiOutlineBell,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white shadow-lg">
        {user?.profilePictureUrl ? (
          <img
            src={user.profilePictureUrl}
            alt={user.name}
            className="h-16 w-16 rounded-full border-2 border-white/50 object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">
            {user?.name?.charAt(0) ?? '?'}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.name ?? 'User'}!</h1>
          <p className="text-indigo-100">Here is an overview of your Smart Campus activity.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border ${card.border} ${card.bg} p-5 shadow-sm transition hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p className={`mt-1 text-3xl font-bold ${card.color}`}>{card.value}</p>
              </div>
              <card.icon className={`h-10 w-10 ${card.color} opacity-70`} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-700">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/facilities"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            <HiOutlineBuildingOffice2 className="h-5 w-5" />
            Browse Facilities
          </Link>
          <Link
            to="/bookings"
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-green-700"
          >
            <HiOutlineCalendarDays className="h-5 w-5" />
            My Bookings
          </Link>
          <Link
            to="/tickets"
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-orange-700"
          >
            <HiOutlineWrenchScrewdriver className="h-5 w-5" />
            Report an Issue
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-700">Recent Activity</h2>
        {recentNotifications.length === 0 ? (
          <p className="rounded-lg bg-gray-50 p-6 text-center text-gray-400">
            No recent activity to show.
          </p>
        ) : (
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
            {recentNotifications.map((notif) => (
              <div key={notif.id} className="flex items-start gap-3 px-5 py-4">
                <HiOutlineBell
                  className={`mt-0.5 h-5 w-5 shrink-0 ${notif.read ? 'text-gray-300' : 'text-red-500'}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800">{notif.title ?? 'Notification'}</p>
                  <p className="truncate text-sm text-gray-500">{notif.message}</p>
                </div>
                <span className="shrink-0 text-xs text-gray-400">
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
