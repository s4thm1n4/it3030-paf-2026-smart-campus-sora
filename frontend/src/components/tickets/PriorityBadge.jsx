import { priorityLabel } from '../../constants/tickets';

const styles = {
  LOW: 'bg-slate-100 text-slate-700',
  MEDIUM: 'bg-sky-100 text-sky-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

export default function PriorityBadge({ priority }) {
  const cls = styles[priority] ?? 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {priorityLabel(priority)}
    </span>
  );
}
