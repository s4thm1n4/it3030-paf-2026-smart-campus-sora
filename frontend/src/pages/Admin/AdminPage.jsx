import { useState, useEffect } from 'react';
import {
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiOutlineWrenchScrewdriver,
  HiOutlineUsers,
  HiOutlineCheck,
  HiOutlineXMark,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import facilityService from '../../services/facilityService';
import bookingService from '../../services/bookingService';
import ticketService from '../../services/ticketService';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'approvals', label: 'Pending Approvals' },
  { key: 'users', label: 'User Management' },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    facilities: 0,
    bookings: 0,
    tickets: 0,
  });
  const [pendingBookings, setPendingBookings] = useState([]);
  const [remarks, setRemarks] = useState({});
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [facilitiesRes, bookingsRes, ticketsRes] = await Promise.all([
        facilityService.getAll(),
        bookingService.getAll(),
        ticketService.getAll(),
      ]);

      const allBookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
      const allFacilities = Array.isArray(facilitiesRes.data) ? facilitiesRes.data : [];
      const allTickets = Array.isArray(ticketsRes.data) ? ticketsRes.data : [];

      setStats({
        facilities: allFacilities.length,
        bookings: allBookings.length,
        tickets: allTickets.length,
      });

      setPendingBookings(allBookings.filter((b) => b.status === 'PENDING'));
    } catch (err) {
      console.error('Failed to load admin data:', err);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await bookingService.approve(id, remarks[id] || '');
      toast.success('Booking approved');
      setPendingBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error('Approve failed:', err);
      toast.error('Failed to approve booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      await bookingService.reject(id, remarks[id] || '');
      toast.success('Booking rejected');
      setPendingBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error('Reject failed:', err);
      toast.error('Failed to reject booking');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const overviewCards = [
    {
      label: 'Total Facilities',
      value: stats.facilities,
      icon: HiOutlineBuildingOffice2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    {
      label: 'All Bookings',
      value: stats.bookings,
      icon: HiOutlineCalendarDays,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
    },
    {
      label: 'All Tickets',
      value: stats.tickets,
      icon: HiOutlineWrenchScrewdriver,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
    },
    {
      label: 'Pending Approvals',
      value: pendingBookings.length,
      icon: HiOutlineCalendarDays,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {overviewCards.map((card) => (
              <div
                key={card.label}
                className={`rounded-xl border ${card.border} ${card.bg} p-5 shadow-sm`}
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
        </div>
      )}

      {/* Pending Approvals Tab */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {pendingBookings.length === 0 ? (
            <p className="rounded-lg bg-gray-50 p-8 text-center text-gray-400">
              No pending bookings to review.
            </p>
          ) : (
            pendingBookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-800">
                      {booking.userName || booking.userEmail || 'Unknown User'}
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Facility:</span>{' '}
                      {booking.facilityName || booking.facilityId}
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Date:</span>{' '}
                      {booking.date
                        ? dayjs(booking.date).format('MMM D, YYYY')
                        : booking.startTime
                          ? dayjs(booking.startTime).format('MMM D, YYYY h:mm A')
                          : 'N/A'}
                      {booking.endTime && (
                        <> &mdash; {dayjs(booking.endTime).format('h:mm A')}</>
                      )}
                    </p>
                    {booking.purpose && (
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Purpose:</span> {booking.purpose}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end">
                    <input
                      type="text"
                      placeholder="Remarks (optional)"
                      value={remarks[booking.id] || ''}
                      onChange={(e) =>
                        setRemarks((prev) => ({ ...prev, [booking.id]: e.target.value }))
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none sm:w-56"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(booking.id)}
                        disabled={actionLoading === booking.id}
                        className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
                      >
                        <HiOutlineCheck className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(booking.id)}
                        disabled={actionLoading === booking.id}
                        className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                      >
                        <HiOutlineXMark className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <HiOutlineUsers className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-3 text-lg font-medium text-gray-700">User Management</h3>
          <p className="mt-1 text-sm text-gray-400">
            User management coming soon. This feature is under development.
          </p>
        </div>
      )}
    </div>
  );
}
