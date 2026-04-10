import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import facilityService from '../../services/facilityService';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/common/Icon';
import StatusBadge from '../../components/common/StatusBadge';
import FacilityForm from '../../components/facilities/FacilityForm';

const TYPE_LABELS = { ROOM: 'Room', LAB: 'Lab', EQUIPMENT: 'Equipment' };
const TYPE_ICONS = { ROOM: 'meeting_room', LAB: 'science', EQUIPMENT: 'construction' };

const TYPE_COLORS = {
  ROOM: 'bg-primary-container text-primary',
  LAB: 'bg-accent-container text-accent',
  EQUIPMENT: 'bg-accent-container text-accent-dim',
};

const normalizeTime = (time) => (time ? String(time).slice(0, 5) : null);

const EMPTY_FORM = {
  name: '',
  type: 'ROOM',
  location: '',
  capacity: '',
  availableFrom: '',
  availableTo: '',
  status: 'ACTIVE',
};

function DetailRow({ iconName, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-cell-border last:border-0">
      <span className="text-outline mt-0.5 flex-shrink-0">
        <Icon name={iconName} size={18} />
      </span>
      <div>
        <p className="text-[10px] font-mono uppercase text-outline mb-0.5">{label}</p>
        <p className="text-sm text-on-surface font-sans">{value}</p>
      </div>
    </div>
  );
}

export default function FacilityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    facilityService
      .getById(id)
      .then((res) => setFacility(res.data))
      .catch(() => {
        toast.error('Facility not found');
        navigate('/facilities');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const openEditForm = () => {
    setForm({
      name: facility.name,
      type: facility.type,
      location: facility.location || '',
      capacity: facility.capacity ?? '',
      availableFrom: normalizeTime(facility.availableFrom) || '',
      availableTo: normalizeTime(facility.availableTo) || '',
      status: facility.status,
    });
    setShowEditForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
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
      const res = await facilityService.update(id, payload);
      setFacility(res.data);
      setShowEditForm(false);
      toast.success('Facility updated');
    } catch {
      toast.error('Failed to update facility');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await facilityService.delete(id);
      toast.success('Facility deleted');
      navigate('/facilities');
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

  if (!facility) return null;

  const availFrom = normalizeTime(facility.availableFrom);
  const availTo = normalizeTime(facility.availableTo);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        to="/facilities"
        className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors mb-6"
      >
        <Icon name="arrow_back" size={18} />
        Back to Facilities
      </Link>

      {/* Header card */}
      <div className="bg-surface-container-lowest border border-cell-border p-6 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-none ${TYPE_COLORS[facility.type] || 'bg-surface-container text-outline'}`}>
              <Icon name={TYPE_ICONS[facility.type] || 'apartment'} size={28} />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display text-on-surface">{facility.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-mono ${TYPE_COLORS[facility.type] || 'bg-surface-container text-outline'}`}>
                  {TYPE_LABELS[facility.type] || facility.type}
                </span>
                <StatusBadge status={facility.status} type="facility" />
              </div>
            </div>
          </div>

          {isAdmin() && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={openEditForm}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant text-sm font-medium font-display text-on-surface hover:bg-surface-container transition-colors"
              >
                <Icon name="edit" size={16} />
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-error/40 text-sm font-medium font-display text-error hover:bg-error/10 transition-colors"
              >
                <Icon name="delete" size={16} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Details card */}
      <div className="bg-surface-container-lowest border border-cell-border p-6">
        <h2 className="text-xs font-mono uppercase text-outline mb-4 tracking-widest">Details</h2>
        <DetailRow iconName="location_on" label="Location" value={facility.location} />
        <DetailRow iconName="group" label="Capacity" value={facility.capacity ? String(facility.capacity) + ' people' : null} />
        <DetailRow
          iconName="schedule"
          label="Availability"
          value={availFrom && availTo ? `${availFrom} – ${availTo}` : null}
        />

        {!facility.location && !facility.capacity && !availFrom && (
          <p className="text-sm text-outline py-4 text-center">No additional details recorded.</p>
        )}
      </div>

      {/* Edit modal */}
      {showEditForm && (
        <FacilityForm
          editingId={facility.id}
          form={form}
          setForm={setForm}
          onSubmit={handleUpdate}
          onClose={() => setShowEditForm(false)}
          submitting={submitting}
        />
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-surface border border-cell-border rounded-none shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold font-display text-on-surface mb-2 uppercase label-caps">
              Delete Facility
            </h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Are you sure you want to delete <strong>{facility.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium font-display text-on-surface bg-surface-container-high rounded-none hover:bg-surface-container-high/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium font-display text-on-primary bg-error rounded-none hover:bg-error/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}