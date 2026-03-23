/** Mirrors backend enums: TicketCategory, TicketPriority, TicketStatus */

export const TICKET_CATEGORIES = [
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'HVAC', label: 'HVAC' },
  { value: 'IT_NETWORK', label: 'IT / Network' },
  { value: 'FURNITURE', label: 'Furniture' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'OTHER', label: 'Other' },
];

export const TICKET_PRIORITIES = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

export const TICKET_STATUSES = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'REJECTED', label: 'Rejected' },
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
