import { useState, useEffect, useCallback } from 'react';
import bookingService from '../../services/bookingService';
import facilityService from '../../services/facilityService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import {
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineUserGroup,
  HiOutlineMapPin,
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineFunnel,
  HiOutlineBuildingOffice2,
  HiOutlineChatBubbleBottomCenterText,
} from 'react-icons/hi2';

const STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   bg: 'bg-yellow-100', text: 'text-yellow-800' },
  APPROVED:  { label: 'Approved',  bg: 'bg-green-100',  text: 'text-green-800' },
  REJECTED:  { label: 'Rejected',  bg: 'bg-red-100',    text: 'text-red-800' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-gray-100',   text: 'text-gray-800' },
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} booking{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <HiOutlinePlus className="w-4 h-4" />
          New Booking
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { key: 'my', label: 'My Bookings' },
          { key: 'all', label: 'All Bookings' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Status Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <HiOutlineFunnel className="w-4 h-4 text-gray-400 flex-shrink-0" />
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === status
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status === 'All' ? 'All' : STATUS_CONFIG[status]?.label || status}
          </button>
        ))}
      </div>

      {/* Booking List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <HiOutlineCalendarDays className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500 text-lg">No bookings found</p>
          <p className="text-gray-400 text-sm mt-1">
            {statusFilter !== 'All'
              ? 'Try a different filter'
              : 'Create a new booking to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => {
            const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
            const isOwn = booking.requestedBy?.id === user?.id;

            return (
              <div
                key={booking.id}
                className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  {/* Left: booking details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <HiOutlineBuildingOffice2 className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {booking.facility?.name || 'Unknown Facility'}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <HiOutlineCalendarDays className="w-4 h-4 text-gray-400" />
                        {dayjs(booking.bookingDate).format('MMM D, YYYY')}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <HiOutlineClock className="w-4 h-4 text-gray-400" />
                        {booking.startTime?.slice(0, 5)} - {booking.endTime?.slice(0, 5)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <HiOutlineUserGroup className="w-4 h-4 text-gray-400" />
                        {booking.attendeeCount} attendee{booking.attendeeCount !== 1 ? 's' : ''}
                      </div>
                      {booking.facility?.location && (
                        <div className="flex items-center gap-1.5">
                          <HiOutlineMapPin className="w-4 h-4 text-gray-400" />
                          {booking.facility.location}
                        </div>
                      )}
                    </div>

                    {booking.purpose && (
                      <p className="mt-2 text-sm text-gray-500">
                        <span className="font-medium text-gray-700">Purpose:</span> {booking.purpose}
                      </p>
                    )}

                    {booking.adminRemarks && (
                      <div className="mt-2 flex items-start gap-1.5 text-sm">
                        <HiOutlineChatBubbleBottomCenterText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-500">
                          <span className="font-medium text-gray-700">Admin remarks:</span>{' '}
                          {booking.adminRemarks}
                        </p>
                      </div>
                    )}

                    {booking.requestedBy && tab === 'all' && (
                      <p className="mt-1 text-xs text-gray-400">
                        Requested by {booking.requestedBy.name || booking.requestedBy.email}
                      </p>
                    )}
                  </div>

                  {/* Right: actions */}
                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    {/* Cancel — own PENDING bookings only */}
                    {isOwn && booking.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <HiOutlineXMark className="w-4 h-4" />
                        Cancel
                      </button>
                    )}

                    {/* Approve / Reject — PENDING bookings */}
                    {booking.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => openRemarkModal(booking.id, 'approve')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          <HiOutlineCheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => openRemarkModal(booking.id, 'reject')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <HiOutlineXCircle className="w-4 h-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">New Booking</h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Facility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facility</label>
                <select
                  name="facilityId"
                  value={form.facilityId}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="bookingDate"
                  value={form.bookingDate}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    name="startTime"
                    value={form.startTime}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    name="endTime"
                    value={form.endTime}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                <textarea
                  name="purpose"
                  value={form.purpose}
                  onChange={handleFormChange}
                  required
                  rows={3}
                  placeholder="Describe the purpose of your booking..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Attendee Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Attendees</label>
                <input
                  type="number"
                  name="attendeeCount"
                  value={form.attendeeCount}
                  onChange={handleFormChange}
                  min={1}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {remarkAction === 'approve' ? 'Approve Booking' : 'Reject Booking'}
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks (optional)
              </label>
              <textarea
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                rows={3}
                placeholder="Add any remarks..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setRemarkBookingId(null);
                  setRemarkAction(null);
                  setRemarkText('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdminAction}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  remarkAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
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
