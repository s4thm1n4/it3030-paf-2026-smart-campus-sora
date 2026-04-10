/* ── Client-side stat computation for dashboard charts ── */

export const STATUS_COLORS = {
  PENDING:     '#e8a817',
  APPROVED:    '#1a7a3a',
  REJECTED:    '#9e3f4e',
  CANCELLED:   '#717c82',
  OPEN:        '#004dea',
  IN_PROGRESS: '#e8a817',
  RESOLVED:    '#1a7a3a',
  CLOSED:      '#717c82',
};

export const PRIORITY_COLORS = {
  LOW:      '#717c82',
  MEDIUM:   '#004dea',
  HIGH:     '#e8650a',
  CRITICAL: '#9e3f4e',
};

export const ROLE_COLORS = {
  USER:       '#004dea',
  ADMIN:      '#9e3f4e',
  TECHNICIAN: '#e8650a',
  MANAGER:    '#1a7a3a',
};

function countByField(items, field) {
  return items.reduce((acc, item) => {
    const key = item[field] ?? 'UNKNOWN';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function toChartData(counts, colorMap) {
  return Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value, fill: colorMap[name] || '#717c82' }));
}

export function computeBookingStats(bookings) {
  const counts = countByField(bookings, 'status');
  return toChartData(counts, STATUS_COLORS);
}

export function computeTicketStats(tickets) {
  const counts = countByField(tickets, 'status');
  return toChartData(counts, STATUS_COLORS);
}

export function computePriorityStats(tickets) {
  const counts = countByField(tickets, 'priority');
  return toChartData(counts, PRIORITY_COLORS);
}

export function computeCategoryStats(tickets) {
  const counts = countByField(tickets, 'category');
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value, fill: '#004dea' }));
}

export function computeFacilityTypeStats(facilities) {
  const typeColors = { LECTURE_HALL: '#004dea', LAB: '#e8650a', MEETING_ROOM: '#1a7a3a', EQUIPMENT: '#9e3f4e' };
  const counts = countByField(facilities, 'type');
  return toChartData(counts, typeColors);
}

export function computeRoleStats(users) {
  const counts = countByField(users, 'role');
  return toChartData(counts, ROLE_COLORS);
}
