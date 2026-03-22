import { useState, useEffect, useCallback } from 'react';
import bookingService from '../../services/bookingService';
import facilityService from '../../services/facilityService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import Icon from '../../components/common/Icon';
import StatusPipeline from '../../components/common/StatusPipeline';

const STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   bg: 'bg-yellow-500/15', text: 'text-yellow-600' },
  APPROVED:  { label: 'Approved',  bg: 'bg-success/15',    text: 'text-success' },
  REJECTED:  { label: 'Rejected',  bg: 'bg-error/15',      text: 'text-error' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-on-surface/10', text: 'text-on-surface-variant' },
};

const STATUS_FILTERS = ['All', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

export default function BookingsPage() {
  const { user } = useAuth();

  // Data state
  const [bookings, setBookings] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [tab, setTab] = useState('my');           // 'my' | 'all'
  const [statusFilter, setStatusFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [form, setForm] = useState({
    facilityId: '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    purpose: '',
    attendeeCount: 1,
  });
  const [submitting, setSubmitting] = useState(false);

  // Admin remark state
  const [remarkBookingId, setRemarkBookingId] = useState(null);
  const [remarkAction, setRemarkAction] = useState(null); // 'approve' | 'reject'
  const [remarkText, setRemarkText] = useState('');

  // Fetch bookings based on active tab
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const res = tab === 'my'
        ? await bookingService.getMyBookings()
        : await bookingService.getAll();
      setBookings(res.data);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  // Fetch facilities for form dropdown
  const fetchFacilities = useCallback(async () => {
    try {
      const res = await facilityService.getAll();
      setFacilities(res.data);
    } catch {
      // silently fail — facilities dropdown will be empty
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  // Filtered bookings
  const filtered = bookings.filter((b) => {
    if (statusFilter === 'All') return true;
    return b.status === statusFilter;
  });

  // Form handlers
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await bookingService.create({
        facilityId: Number(form.facilityId),
        bookingDate: form.bookingDate,
        startTime: form.startTime,
        endTime: form.endTime,
        purpose: form.purpose,
        attendeeCount: Number(form.attendeeCount),
      });
      toast.success('Booking request submitted');
      setShowForm(false);
      setForm({ facilityId: '', bookingDate: '', startTime: '', endTime: '', purpose: '', attendeeCount: 1 });
      fetchBookings();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to create booking';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await bookingService.cancel(id);
      toast.success('Booking cancelled');
      fetchBookings();
    } catch {
      toast.error('Failed to cancel booking');
    }
  };

  const openRemarkModal = (id, action) => {
    setRemarkBookingId(id);
    setRemarkAction(action);
    setRemarkText('');
  };

  const handleAdminAction = async () => {
    try {
      if (remarkAction === 'approve') {
        await bookingService.approve(remarkBookingId, remarkText);
        toast.success('Booking approved');
      } else {
        await bookingService.reject(remarkBookingId, remarkText);
        toast.success('Booking rejected');
      }
      setRemarkBookingId(null);
      setRemarkAction(null);
      setRemarkText('');
      fetchBookings();
    } catch {
      toast.error(`Failed to ${remarkAction} booking`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-on-surface tracking-tight">
            Booking Management
          </h1>
          <p className="text-sm text-on-surface-variant font-mono mt-1">
            {filtered.length} booking{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary text-sm font-semibold rounded-none hover:bg-primary/90 transition-colors"
        >
          <Icon name="add" size={18} />
          New Booking
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-6 mb-4 border-b border-cell-border">
        {[
          { key: 'my', label: 'My Bookings' },
          { key: 'all', label: 'All Bookings' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`pb-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Status Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Icon name="filter_list" size={18} className="text-outline flex-shrink-0" />
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors ${
              statusFilter === status
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-lowest text-on-surface-variant border border-cell-border hover:bg-surface'
            }`}
          >
            {status === 'All' ? 'All' : STATUS_CONFIG[status]?.label || status}
          </button>
        ))}
      </div>

      {/* Booking List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-cell-border bg-surface-container-lowest">
          <Icon name="calendar_month" size={48} className="text-outline mx-auto" />
          <p className="mt-4 text-on-surface text-lg font-display">No bookings found</p>
          <p className="text-on-surface-variant text-sm mt-1">
            {statusFilter !== 'All'
              ? 'Try a different filter'
              : 'Create a new booking to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => {
            const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
            const isOwn = booking.requestedBy?.id === user?.id;

            return (
              <div
                key={booking.id}
                className="bg-surface-container-lowest border border-cell-border rounded-none p-5 hover:border-primary/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  {/* Left: booking details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="apartment" size={20} className="text-primary flex-shrink-0" />
                      <h3 className="text-base font-semibold font-display text-on-surface truncate">
                        {booking.facility?.name || 'Unknown Facility'}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-on-surface-variant">
                      <div className="flex items-center gap-1.5">
                        <Icon name="calendar_month" size={16} className="text-outline" />
                        <span className="font-mono text-xs">
                          {dayjs(booking.bookingDate).format('MMM D, YYYY')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Icon name="schedule" size={16} className="text-outline" />
                        <span className="font-mono text-xs">
                          {booking.startTime?.slice(0, 5)} - {booking.endTime?.slice(0, 5)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Icon name="group" size={16} className="text-outline" />
                        <span className="font-mono text-xs">
                          {booking.attendeeCount} attendee{booking.attendeeCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {booking.facility?.location && (
                        <div className="flex items-center gap-1.5">
                          <Icon name="location_on" size={16} className="text-outline" />
                          <span className="font-mono text-xs">{booking.facility.location}</span>
                        </div>
                      )}
                    </div>

                    {booking.purpose && (
                      <p className="mt-2 text-sm text-on-surface-variant">
                        <span className="font-semibold text-on-surface label-caps text-xs tracking-wider uppercase">Purpose:</span>{' '}
                        {booking.purpose}
                      </p>
                    )}

                    {booking.adminRemarks && (
                      <div className="mt-2 flex items-start gap-1.5 text-sm">
                        <Icon name="comment" size={16} className="text-outline mt-0.5 flex-shrink-0" />
                        <p className="text-on-surface-variant">
                          <span className="font-semibold text-on-surface label-caps text-xs tracking-wider uppercase">Admin remarks:</span>{' '}
                          {booking.adminRemarks}
                        </p>
                      </div>
                    )}

                    {booking.requestedBy && tab === 'all' && (
                      <p className="mt-1 text-xs text-outline font-mono">
                        Requested by {booking.requestedBy.name || booking.requestedBy.email}
                      </p>
                    )}

                    {/* Booking workflow pipeline */}
                    <div className="mt-3 pt-3 border-t border-cell-border">
                      <StatusPipeline
                        steps={['PENDING', 'APPROVED']}
                        current={booking.status === 'REJECTED' ? 'PENDING' : booking.status === 'CANCELLED' ? 'PENDING' : booking.status}
                      />
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    {/* Cancel — own PENDING bookings only */}
                    {isOwn && booking.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-on-surface-variant bg-surface border border-cell-border rounded-none hover:bg-surface-container-lowest transition-colors"
                      >
                        <Icon name="close" size={16} />
                        Cancel
                      </button>
                    )}

                    {/* Approve / Reject — PENDING bookings */}
                    {booking.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => openRemarkModal(booking.id, 'approve')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-white bg-success rounded-none hover:bg-success/90 transition-colors"
                        >
                          <Icon name="check_circle" size={16} />
                          Approve
                        </button>
                        <button
                          onClick={() => openRemarkModal(booking.id, 'reject')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-white bg-error rounded-none hover:bg-error/90 transition-colors"
                        >
                          <Icon name="cancel" size={16} />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Booking Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-surface-container-lowest border border-cell-border rounded-none shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold font-display text-on-surface">New Booking</h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Facility */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Facility
                </label>
                <select
                  name="facilityId"
                  value={form.facilityId}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-none border border-cell-border bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">Select a facility</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} — {f.location} (capacity: {f.capacity})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="bookingDate"
                  value={form.bookingDate}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-none border border-cell-border bg-surface px-3 py-2 text-sm text-on-surface font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={form.startTime}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-none border border-cell-border bg-surface px-3 py-2 text-sm text-on-surface font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={form.endTime}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-none border border-cell-border bg-surface px-3 py-2 text-sm text-on-surface font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Purpose
                </label>
                <textarea
                  name="purpose"
                  value={form.purpose}
                  onChange={handleFormChange}
                  required
                  rows={3}
                  placeholder="Describe the purpose of your booking..."
                  className="w-full rounded-none border border-cell-border bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                />
              </div>

              {/* Attendee Count */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Number of Attendees
                </label>
                <input
                  type="number"
                  name="attendeeCount"
                  value={form.attendeeCount}
                  onChange={handleFormChange}
                  min={1}
                  required
                  className="w-full rounded-none border border-cell-border bg-surface px-3 py-2 text-sm text-on-surface font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-semibold text-on-surface-variant bg-surface border border-cell-border rounded-none hover:bg-surface-container-lowest transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold text-on-primary bg-primary rounded-none hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Remarks Modal */}
      {remarkBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-surface-container-lowest border border-cell-border rounded-none shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold font-display text-on-surface mb-4">
              {remarkAction === 'approve' ? 'Approve Booking' : 'Reject Booking'}
            </h2>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                Remarks (optional)
              </label>
              <textarea
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                rows={3}
                placeholder="Add any remarks..."
                className="w-full rounded-none border border-cell-border bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setRemarkBookingId(null);
                  setRemarkAction(null);
                  setRemarkText('');
                }}
                className="px-4 py-2 text-sm font-semibold text-on-surface-variant bg-surface border border-cell-border rounded-none hover:bg-surface-container-lowest transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdminAction}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-none transition-colors ${
                  remarkAction === 'approve'
                    ? 'bg-success hover:bg-success/90'
                    : 'bg-error hover:bg-error/90'
                }`}
              >
                {remarkAction === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
