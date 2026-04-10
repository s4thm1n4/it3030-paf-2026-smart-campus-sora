import { useState, useEffect, useCallback } from 'react';
import facilityService from '../../services/facilityService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import Icon from '../../components/common/Icon';
import ViewToggle from '../../components/common/ViewToggle';
import FacilityCard from '../../components/facilities/FacilityCard';
import FacilityListItem from '../../components/facilities/FacilityListItem';
import FacilityForm from '../../components/facilities/FacilityForm';

const FACILITY_TYPES = ['ROOM', 'LAB', 'EQUIPMENT'];
const FACILITY_STATUSES = ['ACTIVE', 'OUT_OF_SERVICE'];

const STATUS_LABELS = { ACTIVE: 'Active', OUT_OF_SERVICE: 'Out of Service' };
const TYPE_LABELS = { ROOM: 'Room', LAB: 'Lab', EQUIPMENT: 'Equipment' };

const EMPTY_FORM = {
  name: '',
  type: 'ROOM',
  location: '',
  capacity: '',
  availableFrom: '',
  availableTo: '',
  status: 'ACTIVE',
};

const normalizeTimeInput = (time) => (time ? String(time).slice(0, 5) : '');

const validateFacilityForm = (form) => {
  const name = form.name.trim();
  const location = form.location.trim();

  if (!name) return 'Name is required';
  if (name.length < 3) return 'Name must be at least 3 characters';
  if (!location) return 'Location is required';

  if ((form.type === 'ROOM' || form.type === 'LAB') && !form.capacity) {
    return 'Capacity is required for Rooms and Labs';
  }

  if (form.capacity !== '') {
    const capacity = Number(form.capacity);
    if (!Number.isFinite(capacity) || capacity <= 0) return 'Capacity must be a positive number';
  }

  if (form.availableFrom && form.availableTo && form.availableFrom >= form.availableTo) {
    return 'Available From must be before Available To';
  }

  return null;
};

export default function FacilitiesPage() {
  const { isAdmin } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCapacity, setFilterCapacity] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const fetchFacilities = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterType) params.type = filterType;
      if (filterCapacity !== '') params.capacity = Number(filterCapacity);
      if (filterLocation.trim()) params.location = filterLocation.trim();
      const res = await facilityService.getAll(params);
      setFacilities(res.data);
    } catch {
      toast.error('Failed to load facilities');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterCapacity, filterLocation]);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  const filtered = facilities.filter((f) => {
    const matchesSearch =
      !searchQuery ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.location || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || f.status === filterStatus;
    return matchesSearch && matchesStatus;
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
      location: facility.location || '',
      capacity: facility.capacity ?? '',
      availableFrom: normalizeTimeInput(facility.availableFrom),
      availableTo: normalizeTimeInput(facility.availableTo),
      status: facility.status,
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
    const validationError = validateFacilityForm(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        ...form,
        name: form.name.trim(),
        location: form.location.trim(),
        capacity: form.capacity === '' ? null : Number(form.capacity),
        availableFrom: form.availableFrom || null,
        availableTo: form.availableTo || null,
      };
      if (editingId) {
        const res = await facilityService.update(editingId, payload);
        setFacilities((prev) => prev.map((f) => (f.id === editingId ? res.data : f)));
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
        <div className="flex items-center gap-3">
          <ViewToggle view={viewMode} onChange={setViewMode} views={['grid', 'list']} />
          {isAdmin() && (
            <button
              onClick={openCreateForm}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary text-sm font-medium font-display rounded-none hover:bg-primary/90 transition-colors"
            >
              <Icon name="add" size={18} />
              Add Facility
            </button>
          )}
        </div>
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
        <div className="flex items-center gap-2 flex-wrap">
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
          <input
            type="number"
            min="0"
            placeholder="Capacity"
            value={filterCapacity}
            onChange={(e) => setFilterCapacity(e.target.value)}
            className="w-28 px-3 py-2 border border-outline-variant rounded-none bg-surface-container-lowest text-on-surface text-sm font-sans focus:outline-none focus:border-primary transition-colors"
          />
          <input
            type="text"
            placeholder="Location"
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="w-40 px-3 py-2 border border-outline-variant rounded-none bg-surface-container-lowest text-on-surface text-sm font-sans focus:outline-none focus:border-primary transition-colors"
          />
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
          <button
            type="button"
            onClick={() => {
              setFilterType('');
              setFilterCapacity('');
              setFilterLocation('');
              setFilterStatus('');
              setSearchQuery('');
            }}
            className="px-3 py-2 border border-outline-variant text-xs font-medium hover:bg-surface-container transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <FacilityForm
          editingId={editingId}
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          onClose={closeForm}
          submitting={submitting}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-surface border border-cell-border rounded-none shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold font-display text-on-surface mb-2 uppercase label-caps">
              Delete Facility
            </h3>
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

      {/* Empty state */}
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
        <>
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((facility) => (
                <FacilityCard
                  key={facility.id}
                  facility={facility}
                  isAdmin={isAdmin()}
                  onEdit={openEditForm}
                  onDelete={setDeleteConfirmId}
                />
              ))}
            </div>
          )}

          {viewMode === 'list' && (
            <div className="border border-cell-border bg-surface-container-lowest">
              <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-5 py-2.5 border-b border-cell-border bg-surface-container">
                <span className="col-span-3 label-caps text-[10px] text-outline">NAME</span>
                <span className="col-span-2 label-caps text-[10px] text-outline">TYPE</span>
                <span className="col-span-2 label-caps text-[10px] text-outline">STATUS</span>
                <span className="col-span-2 label-caps text-[10px] text-outline">LOCATION</span>
                <span className="col-span-1 label-caps text-[10px] text-outline">CAPACITY</span>
                {isAdmin() && (
                  <span className="col-span-2 label-caps text-[10px] text-outline text-right">ACTIONS</span>
                )}
              </div>
              {filtered.map((facility) => (
                <FacilityListItem
                  key={facility.id}
                  facility={facility}
                  isAdmin={isAdmin()}
                  onEdit={openEditForm}
                  onDelete={setDeleteConfirmId}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}