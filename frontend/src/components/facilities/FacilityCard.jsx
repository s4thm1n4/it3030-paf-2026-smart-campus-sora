import { Link } from 'react-router-dom';
import Icon from '../common/Icon';
import StatusBadge from '../common/StatusBadge';

const TYPE_COLORS = {
  ROOM: 'bg-primary-container text-primary',
  LAB: 'bg-accent-container text-accent',
  EQUIPMENT: 'bg-accent-container text-accent-dim',
};

const TYPE_LABELS = {
  ROOM: 'Room',
  LAB: 'Lab',
  EQUIPMENT: 'Equipment',
};

const normalizeTime = (time) => (time ? String(time).slice(0, 5) : '');

export default function FacilityCard({ facility, isAdmin, onEdit, onDelete }) {
  return (
    <div className="bg-surface-container-lowest border border-cell-border p-5 hover:border-primary/40 transition-colors flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <Link
          to={`/facilities/${facility.id}`}
          className="text-base font-semibold font-display text-on-surface leading-tight hover:text-primary transition-colors"
        >
          {facility.name}
        </Link>
        {isAdmin && (
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <button
              onClick={() => onEdit(facility)}
              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
              title="Edit"
            >
              <Icon name="edit" size={18} />
            </button>
            <button
              onClick={() => onDelete(facility.id)}
              className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
              title="Delete"
            >
              <Icon name="delete" size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-mono ${TYPE_COLORS[facility.type] || 'bg-surface-container text-outline'}`}>
          {TYPE_LABELS[facility.type] || facility.type}
        </span>
        <StatusBadge status={facility.status} type="facility" />
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-sm text-on-surface-variant">
        <div className="flex items-center gap-1.5">
          <Icon name="location_on" size={16} className="flex-shrink-0" />
          <span>{facility.location || '—'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Icon name="group" size={16} className="flex-shrink-0" />
          <span className="font-mono">Capacity: {facility.capacity ?? '—'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Icon name="schedule" size={16} className="flex-shrink-0" />
          <span className="text-xs text-outline">
            {facility.availableFrom && facility.availableTo
              ? `${normalizeTime(facility.availableFrom)} – ${normalizeTime(facility.availableTo)}`
              : 'Availability not set'}
          </span>
        </div>
      </div>
    </div>
  );
}