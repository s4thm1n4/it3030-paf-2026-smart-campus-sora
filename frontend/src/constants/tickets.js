/** Mirrors backend enums: TicketCategory, TicketPriority, TicketStatus */

export const TICKET_CATEGORIES = [
  { value: 'IT_NETWORK',         label: 'IT / Network' },
  { value: 'ELECTRICAL',         label: 'Electrical' },
  { value: 'LECTURE_FACILITIES', label: 'Lecture Hall / Classroom' },
  { value: 'LAB_EQUIPMENT',      label: 'Lab Equipment' },
  { value: 'LIBRARY',            label: 'Library Services' },
  { value: 'SECURITY',           label: 'Security' },
  { value: 'STUDENT_SERVICES',   label: 'Student Services' },
  { value: 'CAFETERIA',          label: 'Cafeteria / Canteen' },
  { value: 'TRANSPORT',          label: 'Transport & Parking' },
  { value: 'CLEANING',           label: 'Cleaning & Sanitation' },
  { value: 'ACADEMIC_COMPLAINT', label: 'Academic Complaint' },
  { value: 'ADMINISTRATION',     label: 'Administration' },
  { value: 'OTHER',              label: 'Other' },
];

export const TICKET_PRIORITIES = [
  { value: 'LOW',      label: 'Low' },
  { value: 'MEDIUM',   label: 'Medium' },
  { value: 'HIGH',     label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

export const TICKET_STATUSES = [
  { value: 'OPEN',        label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'RESOLVED',    label: 'Resolved' },
  { value: 'CLOSED',      label: 'Closed' },
  { value: 'REJECTED',    label: 'Rejected' },
];

export function categoryLabel(value) {
  return TICKET_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function priorityLabel(value) {
  return TICKET_PRIORITIES.find((p) => p.value === value)?.label ?? value;
}

export function statusLabel(value) {
  return TICKET_STATUSES.find((s) => s.value === value)?.label ?? value;
}