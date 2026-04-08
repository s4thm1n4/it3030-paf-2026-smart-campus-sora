import { statusLabel } from '../../constants/tickets';

const styles = {
  OPEN: 'bg-blue-100 text-blue-800 ring-blue-600/20',
  IN_PROGRESS: 'bg-amber-100 text-amber-800 ring-amber-600/20',
  RESOLVED: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
  CLOSED: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  REJECTED: 'bg-rose-100 text-rose-800 ring-rose-600/20',
};

export default function StatusBadge({ status }) {
  const cls = styles[status] ?? 'bg-gray-100 text-gray-700';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {statusLabel(status)}
    </span>
  );
}
