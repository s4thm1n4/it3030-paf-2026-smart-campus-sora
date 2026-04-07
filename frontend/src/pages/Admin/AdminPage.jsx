import { useState, useEffect } from 'react';
import Icon from '../../components/common/Icon';
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
        <div className="h-10 w-10 animate-spin rounded-none border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const overviewCards = [
    {
      label: 'Total Facilities',
      value: stats.facilities,
      icon: 'apartment',
      containerBg: 'bg-primary-container',
    },
    {
      label: 'All Bookings',
      value: stats.bookings,
      icon: 'calendar_month',
      containerBg: 'bg-accent-container',
    },
    {
      label: 'All Tickets',
      value: stats.tickets,
      icon: 'build',
      containerBg: 'bg-primary-container',
    },
    {
      label: 'Pending Approvals',
      value: pendingBookings.length,
      icon: 'calendar_month',
      containerBg: 'bg-accent-container',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-on-surface">Admin Dashboard</h1>

      {/* Tab Navigation */}
      <div className="flex gap-6 border-b border-outline">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-2 text-sm font-medium transition border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <p className="label-caps text-on-surface-variant">Statistics</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {overviewCards.map((card) => (
              <div
                key={card.label}
                className="border border-cell-border bg-surface p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-on-surface-variant">{card.label}</p>
                    <p className="mt-1 font-display text-3xl font-bold text-on-surface">{card.value}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center ${card.containerBg}`}>
                    <Icon name={card.icon} size={24} className="text-on-surface" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Approvals Tab */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <p className="label-caps text-on-surface-variant">Pending Reviews</p>
          {pendingBookings.length === 0 ? (
            <p className="border border-cell-border bg-surface-container-lowest p-8 text-center text-on-surface-variant">
              No pending bookings to review.
            </p>
          ) : (
            pendingBookings.map((booking) => (
              <div
                key={booking.id}
                className="border border-cell-border bg-surface p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-display font-semibold text-on-surface">
                      {booking.userName || booking.userEmail || 'Unknown User'}
                    </p>
                    <p className="text-sm text-on-surface-variant">
                      <span className="font-medium text-on-surface">Facility:</span>{' '}
                      {booking.facilityName || booking.facilityId}
                    </p>
                    <p className="text-sm text-on-surface-variant">
                      <span className="font-medium text-on-surface">Date:</span>{' '}
                      <span className="font-mono">
                        {booking.date
                          ? dayjs(booking.date).format('MMM D, YYYY')
                          : booking.startTime
                            ? dayjs(booking.startTime).format('MMM D, YYYY h:mm A')
                            : 'N/A'}
                        {booking.endTime && (
                          <> &mdash; {dayjs(booking.endTime).format('h:mm A')}</>
                        )}
                      </span>
                    </p>
                    {booking.purpose && (
                      <p className="text-sm text-on-surface-variant">
                        <span className="font-medium text-on-surface">Purpose:</span> {booking.purpose}
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
                      className="w-full border border-cell-border bg-surface-container-lowest px-3 py-1.5 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none sm:w-56"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(booking.id)}
                        disabled={actionLoading === booking.id}
                        className="inline-flex items-center gap-1.5 bg-success px-4 py-1.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                      >
                        <Icon name="check" size={16} className="text-white" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(booking.id)}
                        disabled={actionLoading === booking.id}
                        className="inline-flex items-center gap-1.5 bg-error px-4 py-1.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                      >
                        <Icon name="close" size={16} className="text-white" />
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
        <div className="border border-cell-border bg-surface p-8 text-center">
          <Icon name="group" size={48} className="mx-auto text-outline" />
          <h3 className="mt-3 font-display text-lg font-medium text-on-surface">User Management</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            User management coming soon. This feature is under development.
          </p>
        </div>
      )}
    </div>
  );
}
