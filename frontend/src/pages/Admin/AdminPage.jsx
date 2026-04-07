import { useState, useEffect } from 'react';
import Icon from '../../components/common/Icon';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import facilityService from '../../services/facilityService';
import bookingService from '../../services/bookingService';
import ticketService from '../../services/ticketService';
import adminService from '../../services/adminService';

const ROLES = ['USER', 'ADMIN', 'TECHNICIAN', 'MANAGER'];

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
  const [users, setUsers] = useState([]);
  const [roleLoading, setRoleLoading] = useState(null);
  const [userSearch, setUserSearch] = useState('');

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

      const usersRes = await adminService.getUsers();
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
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

  const handleRoleChange = async (userId, newRole) => {
    setRoleLoading(userId);
    try {
      await adminService.updateRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success('Role updated');
    } catch (err) {
      console.error('Role update failed:', err);
      toast.error('Failed to update role');
    } finally {
      setRoleLoading(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

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
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="label-caps text-on-surface-variant">
              All Users ({filteredUsers.length})
            </p>
            <div className="relative w-full sm:w-64">
              <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full border border-cell-border bg-surface-container-lowest py-2 pl-9 pr-3 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <p className="border border-cell-border bg-surface-container-lowest p-8 text-center text-on-surface-variant">
              No users found.
            </p>
          ) : (
            <div className="overflow-x-auto border border-cell-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest">User</th>
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest">Email</th>
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest">Role</th>
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest">Joined</th>
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cell-border">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="bg-surface hover:bg-surface-container-low transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {u.profilePictureUrl ? (
                            <img
                              src={u.profilePictureUrl}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container font-display text-sm font-bold text-primary">
                              {u.name?.charAt(0) ?? '?'}
                            </div>
                          )}
                          <span className="font-medium text-on-surface">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-on-surface-variant">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider ${
                          u.role === 'ADMIN'
                            ? 'bg-primary-container text-primary'
                            : u.role === 'TECHNICIAN'
                              ? 'bg-accent-container text-accent'
                              : u.role === 'MANAGER'
                                ? 'bg-warning-container text-on-warning'
                                : 'bg-surface-container text-outline'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-outline">
                        {u.createdAt ? dayjs(u.createdAt).format('MMM D, YYYY') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={roleLoading === u.id}
                          className="border border-cell-border bg-surface-container-lowest px-2 py-1 text-xs text-on-surface focus:border-primary focus:outline-none disabled:opacity-50"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
