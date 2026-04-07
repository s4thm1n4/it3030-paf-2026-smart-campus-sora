/**
 * Reusable status badge with consistent color mapping.
 * Usage: <StatusBadge status="APPROVED" type="booking" />
 */

const BOOKING_COLORS = {
  PENDING:   'bg-warning-container text-on-warning',
  APPROVED:  'bg-success-container text-success',
  REJECTED:  'bg-error-container text-error',
  CANCELLED: 'bg-surface-container text-outline',
};

const TICKET_STATUS_COLORS = {
  OPEN:        'bg-primary-container text-primary',
  IN_PROGRESS: 'bg-warning-container text-on-warning',
  RESOLVED:    'bg-success-container text-success',
  CLOSED:      'bg-surface-container text-outline',
  REJECTED:    'bg-error-container text-error',
};

const PRIORITY_COLORS = {
  LOW:      'bg-surface-container text-outline',
  MEDIUM:   'bg-primary-container text-primary',
  HIGH:     'bg-accent-container text-accent',
  CRITICAL: 'bg-error-container text-error',
};

const FACILITY_STATUS_COLORS = {
  ACTIVE:            'bg-success-container text-success',
  OUT_OF_SERVICE:    'bg-error-container text-error',
  UNDER_MAINTENANCE: 'bg-warning-container text-on-warning',
};

const COLOR_MAPS = {
  booking:  BOOKING_COLORS,
  ticket:   TICKET_STATUS_COLORS,
  priority: PRIORITY_COLORS,
  facility: FACILITY_STATUS_COLORS,
};

export default function StatusBadge({ status, type = 'booking', className = '' }) {
  const colorMap = COLOR_MAPS[type] || BOOKING_COLORS;
  const colors = colorMap[status] || 'bg-surface-container text-outline';

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] font-bold tracking-wider ${colors} ${className}`}
    >
      {status?.replace(/_/g, ' ')}
    </span>
  );
}
