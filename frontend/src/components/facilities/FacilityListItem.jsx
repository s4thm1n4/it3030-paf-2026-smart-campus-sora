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

export default function FacilityListItem({ facility, isAdmin, onEdit, onDelete }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center px-5 py-3 border-b border-cell-border last:border-b-0 hover:bg-surface-container-low transition-colors">
      <div className="col-span-3">
        <Link
          to={`/facilities/${facility.id}`}
          className="text-sm font-semibold font-display text-on-surface hover:text-primary transition-colors"
        >
          {facility.name}
        </Link>
        <p className="text-xs text-outline truncate mt-0.5">
          {facility.availableFrom && facility.availableTo
            ? `${normalizeTime(facility.availableFrom)} – ${normalizeTime(facility.availableTo)}`
            : 'Availability not set'}
        </p>
      </div>
      <div className="col-span-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium font-mono ${TYPE_COLORS[facility.type] || 'bg-surface-container text-outline'}`}>
          {TYPE_LABELS[facility.type] || facility.type}
        </span>
      </div>
      <div className="col-span-2">
        <StatusBadge status={facility.status} type="facility" />
      </div>
      <div className="col-span-2 flex items-center gap-1 text-sm text-on-surface-variant">
        <Icon name="location_on" size={14} />
        <span className="truncate">{facility.location || '—'}</span>
      </div>
      <div className="col-span-1 font-mono text-sm text-on-surface-variant">
        {facility.capacity ?? '—'}
      </div>
      {isAdmin && (
        <div className="col-span-2 flex items-center justify-end gap-1">
          <button
            onClick={() => onEdit(facility)}
            className="p-1.5 text-outline hover:text-primary hover:bg-primary/10 transition-colors"
            title="Edit"
          >
            <Icon name="edit" size={16} />
          </button>
          <button
            onClick={() => onDelete(facility.id)}
            className="p-1.5 text-outline hover:text-error hover:bg-error/10 transition-colors"
            title="Delete"
          >
            <Icon name="delete" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}