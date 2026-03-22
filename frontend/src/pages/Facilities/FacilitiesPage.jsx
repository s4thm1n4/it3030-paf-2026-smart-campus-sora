import { useState, useEffect, useCallback } from 'react';
import facilityService from '../../services/facilityService';
import toast from 'react-hot-toast';
import Icon from '../../components/common/Icon';

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
        <div className="animate-spin h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-on-surface">Facilities & Assets</h1>
          <p className="text-sm text-on-surface-variant font-mono mt-1">
            {facilities.length} {facilities.length === 1 ? 'facility' : 'facilities'} registered
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary text-sm font-medium font-display rounded-none hover:bg-primary/90 transition-colors"
        >
          <Icon name="add" size={18} />
          Add Facility
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">
            <Icon name="search" size={18} />
          </span>
          <input
            type="text"
            placeholder="Search by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-none bg-surface-container-lowest text-on-surface text-sm font-sans focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-outline">
            <Icon name="filter_list" size={18} />
          </span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-outline-variant rounded-none bg-surface-container-lowest text-on-surface text-sm font-sans focus:outline-none focus:border-primary transition-colors"
          >
            <option value="">All Types</option>
            {FACILITY_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-outline-variant rounded-none bg-surface-container-lowest text-on-surface text-sm font-sans focus:outline-none focus:border-primary transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-surface border border-cell-border rounded-none shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-cell-border">
              <h2 className="text-lg font-semibold font-display text-on-surface uppercase label-caps">
                {editingId ? 'Edit Facility' : 'Add Facility'}
              </h2>
              <button onClick={closeForm} className="p-1 text-on-surface-variant hover:text-on-surface transition-colors">
                <Icon name="close" size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium font-display text-on-surface-variant mb-1 uppercase label-caps">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded-none bg-surface-container-lowest text-on-surface text-sm font-sans focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium font-display text-on-surface-variant mb-1 uppercase label-caps">Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 border border-outline-variant rounded-none bg-surface-container-lowest text-on-surface text-sm font-sans focus:outline-none focus:border-primary transition-colors"
                  >
                    {FACILITY_TYPES.map((t) => (
                      <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium font-display text-on-surface-variant mb-1 uppercase label-caps">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 border border-outline-variant rounded-none bg-surface-container-lowest text-on-surface text-sm font-sans focus:outline-none focus:border-primary transition-colors"
                  >
                    {FACILITY_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium font-display text-on-surface-variant mb-1 uppercase label-caps">Location *</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded-none bg-surface-container-lowest text-on-surface text-sm font-sans focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium font-display text-on-surface-variant mb-1 uppercase label-caps">Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded-none bg-surface-container-lowest text-on-surface text-sm font-sans focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium font-display text-on-surface-variant mb-1 uppercase label-caps">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded-none bg-surface-container-lowest text-on-surface text-sm font-sans focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium font-display text-on-surface-variant mb-1 uppercase label-caps">Image URL</label>
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-outline-variant rounded-none bg-surface-container-lowest text-on-surface text-sm font-sans focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-sm font-medium font-display text-on-surface bg-surface-container-high rounded-none hover:bg-surface-container-high/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium font-display text-on-primary bg-primary rounded-none hover:bg-primary/90 transition-colors disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-surface border border-cell-border rounded-none shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold font-display text-on-surface mb-2 uppercase label-caps">Delete Facility</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Are you sure you want to delete this facility? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-medium font-display text-on-surface bg-surface-container-high rounded-none hover:bg-surface-container-high/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-sm font-medium font-display text-on-primary bg-error rounded-none hover:bg-error/90 transition-colors"
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
          <span className="text-outline">
            <Icon name="apartment" size={48} />
          </span>
          <p className="mt-4 text-on-surface text-lg font-display">No facilities found</p>
          <p className="text-on-surface-variant text-sm mt-1">
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
              className="bg-surface-container-lowest border border-cell-border rounded-none p-5 hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-semibold font-display text-on-surface leading-tight">
                  {facility.name}
                </h3>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <button
                    onClick={() => openEditForm(facility)}
                    className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-none transition-colors"
                    title="Edit"
                  >
                    <Icon name="edit" size={18} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(facility.id)}
                    className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-none transition-colors"
                    title="Delete"
                  >
                    <Icon name="delete" size={18} />
                  </button>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-mono ${TYPE_COLORS[facility.type] || TYPE_COLORS.OTHER}`}>
                  {TYPE_LABELS[facility.type] || facility.type}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-mono ${STATUS_COLORS[facility.status] || STATUS_COLORS.ACTIVE}`}>
                  {STATUS_LABELS[facility.status] || facility.status}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-1.5 text-sm text-on-surface-variant mb-3">
                <div className="flex items-center gap-1.5">
                  <Icon name="location_on" size={16} className="flex-shrink-0" />
                  <span>{facility.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon name="group" size={16} className="flex-shrink-0" />
                  <span className="font-mono">Capacity: {facility.capacity}</span>
                </div>
              </div>

              {/* Description */}
              {facility.description && (
                <p className="text-sm text-outline line-clamp-2">
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
