import { useState, useEffect, useCallback } from 'react';
import facilityService from '../../services/facilityService';
import toast from 'react-hot-toast';
import {
  HiOutlineBuildingOffice2,
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineMapPin,
  HiOutlineUsers,
  HiOutlineXMark,
} from 'react-icons/hi2';

const FACILITY_TYPES = [
  'LECTURE_HALL',
  'LABORATORY',
  'MEETING_ROOM',
  'AUDITORIUM',
  'EQUIPMENT',
  'SPORTS_FACILITY',
  'OTHER',
];

const FACILITY_STATUSES = ['ACTIVE', 'OUT_OF_SERVICE', 'UNDER_MAINTENANCE'];

const TYPE_COLORS = {
  LECTURE_HALL: 'bg-blue-100 text-blue-700',
  LABORATORY: 'bg-purple-100 text-purple-700',
  MEETING_ROOM: 'bg-teal-100 text-teal-700',
  AUDITORIUM: 'bg-pink-100 text-pink-700',
  EQUIPMENT: 'bg-orange-100 text-orange-700',
  SPORTS_FACILITY: 'bg-emerald-100 text-emerald-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-700',
  OUT_OF_SERVICE: 'bg-red-100 text-red-700',
  UNDER_MAINTENANCE: 'bg-yellow-100 text-yellow-700',
};

const STATUS_LABELS = {
  ACTIVE: 'Active',
  OUT_OF_SERVICE: 'Out of Service',
  UNDER_MAINTENANCE: 'Under Maintenance',
};

const TYPE_LABELS = {
  LECTURE_HALL: 'Lecture Hall',
  LABORATORY: 'Laboratory',
  MEETING_ROOM: 'Meeting Room',
  AUDITORIUM: 'Auditorium',
  EQUIPMENT: 'Equipment',
  SPORTS_FACILITY: 'Sports Facility',
  OTHER: 'Other',
};

const EMPTY_FORM = {
  name: '',
  type: 'LECTURE_HALL',
  description: '',
  location: '',
  capacity: 1,
  status: 'ACTIVE',
  imageUrl: '',
};

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const fetchFacilities = useCallback(async () => {
    try {
      setLoading(true);
      const res = await facilityService.getAll();
      setFacilities(res.data);
    } catch {
      toast.error('Failed to load facilities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  const filtered = facilities.filter((f) => {
    const matchesSearch =
      !searchQuery ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !filterType || f.type === filterType;
    const matchesStatus = !filterStatus || f.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (facility) => {
    setEditingId(facility.id);
    setForm({
      name: facility.name,
      type: facility.type,
      description: facility.description || '',
      location: facility.location,
      capacity: facility.capacity,
      status: facility.status,
      imageUrl: facility.imageUrl || '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.location.trim()) {
      toast.error('Name and Location are required');
      return;
    }
    try {
      setSubmitting(true);
      const payload = { ...form, capacity: Number(form.capacity) };
      if (editingId) {
        const res = await facilityService.update(editingId, payload);
        setFacilities((prev) =>
          prev.map((f) => (f.id === editingId ? res.data : f))
        );
        toast.success('Facility updated');
      } else {
        const res = await facilityService.create(payload);
        setFacilities((prev) => [res.data, ...prev]);
        toast.success('Facility created');
      }
      closeForm();
    } catch {
      toast.error(editingId ? 'Failed to update facility' : 'Failed to create facility');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await facilityService.delete(id);
      setFacilities((prev) => prev.filter((f) => f.id !== id));
      setDeleteConfirmId(null);
      toast.success('Facility deleted');
    } catch {
      toast.error('Failed to delete facility');
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Facilities & Assets</h1>
          <p className="text-sm text-gray-500 mt-1">
            {facilities.length} {facilities.length === 1 ? 'facility' : 'facilities'} registered
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Add Facility
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <HiOutlineFunnel className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            {FACILITY_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            {FACILITY_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Facility' : 'Add Facility'}
              </h2>
              <button onClick={closeForm} className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {FACILITY_TYPES.map((t) => (
                      <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {FACILITY_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Facility</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete this facility? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Facility Cards Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <HiOutlineBuildingOffice2 className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500 text-lg">No facilities found</p>
          <p className="text-gray-400 text-sm mt-1">
            {searchQuery || filterType || filterStatus
              ? 'Try adjusting your search or filters'
              : 'Add your first facility to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((facility) => (
            <div
              key={facility.id}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900 leading-tight">
                  {facility.name}
                </h3>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <button
                    onClick={() => openEditForm(facility)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="Edit"
                  >
                    <HiOutlinePencilSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(facility.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[facility.type] || TYPE_COLORS.OTHER}`}>
                  {TYPE_LABELS[facility.type] || facility.type}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[facility.status] || STATUS_COLORS.ACTIVE}`}>
                  {STATUS_LABELS[facility.status] || facility.status}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-1.5 text-sm text-gray-500 mb-3">
                <div className="flex items-center gap-1.5">
                  <HiOutlineMapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{facility.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <HiOutlineUsers className="w-4 h-4 flex-shrink-0" />
                  <span>Capacity: {facility.capacity}</span>
                </div>
              </div>

              {/* Description */}
              {facility.description && (
                <p className="text-sm text-gray-400 line-clamp-2">
                  {facility.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
