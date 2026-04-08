import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import {
  HiOutlineTicket,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowPath,
  HiOutlineUserCircle,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlinePlayCircle,
  HiOutlineLockClosed,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineChartBarSquare,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import ticketService from '../../services/ticketService';
import { getApiErrorMessage } from '../../utils/apiError';
import {
  categoryLabel,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from '../../constants/tickets';
import StatusBadge from '../../components/tickets/StatusBadge';
import PriorityBadge from '../../components/tickets/PriorityBadge';

const PRIORITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div className={`rounded-xl border ${color} bg-white p-5 shadow-sm flex items-center gap-4`}>
      <div className={`rounded-full p-3 ${color.replace('border-', 'bg-').replace('-200', '-100')}`}>
        <Icon className={`h-5 w-5 ${color.replace('border-', 'text-').replace('-200', '-600')}`} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// ── Status patch modal ──────────────────────────────────────────────
function StatusModal({ ticket, onClose, onDone }) {
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const TRANSITIONS = {
    OPEN: ['IN_PROGRESS', 'REJECTED'],
    IN_PROGRESS: ['RESOLVED'],
    RESOLVED: ['CLOSED'],
  };
  const available = TRANSITIONS[ticket.status] ?? [];

  const submit = async () => {
    if (!status) { toast.error('Select a status'); return; }
    if (status === 'REJECTED' && !reason.trim()) { toast.error('Rejection reason is required'); return; }
    if (status === 'RESOLVED' && !notes.trim()) { toast.error('Resolution notes are required'); return; }
    setBusy(true);
    try {
      const { data } = await ticketService.updateStatus(ticket.id, {
        status,
        rejectionReason: status === 'REJECTED' ? reason.trim() : undefined,
        resolutionNotes: status === 'RESOLVED' ? notes.trim() : undefined,
      });
      toast.success('Status updated');
      onDone(data);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (available.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
          <p className="text-gray-600 mb-4">No status transitions available for <strong>{ticket.status}</strong>.</p>
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Change status — #{ticket.id}</h3>
        <p className="text-sm text-gray-500">Current: <StatusBadge status={ticket.status} /></p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New status</label>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="">— Select —</option>
            {available.map(s => (
              <option key={s} value={s}>{TICKET_STATUSES.find(x => x.value === s)?.label ?? s}</option>
            ))}
          </select>
        </div>
        {status === 'REJECTED' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rejection reason <span className="text-red-500">*</span></label>
            <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
              placeholder="Explain why the ticket is being rejected…" autoFocus />
          </div>
        )}
        {status === 'RESOLVED' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resolution notes <span className="text-red-500">*</span></label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              placeholder="Describe what was done to resolve the issue…" autoFocus />
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={submit} disabled={busy || !status}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {busy ? 'Saving…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Assign modal ────────────────────────────────────────────────────
function AssignModal({ ticket, technicians, onClose, onDone }) {
  const [techId, setTechId] = useState(ticket.assignedTo?.id ? String(ticket.assignedTo.id) : '');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!techId) { toast.error('Select a technician'); return; }
    setBusy(true);
    try {
      const { data } = await ticketService.assign(ticket.id, Number(techId));
      toast.success('Technician assigned');
      onDone(data);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Assign technician — #{ticket.id}</h3>
        <select value={techId} onChange={e => setTechId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">— Select technician —</option>
          {technicians.map(t => (
            <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
          ))}
        </select>
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={submit} disabled={busy || !techId}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {busy ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Admin Page ─────────────────────────────────────────────────
export default function AdminPage() {
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [statusModal, setStatusModal] = useState(null);
  const [assignModal, setAssignModal] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [tRes, techRes] = await Promise.all([
        ticketService.getAll(),
        ticketService.getTechnicians(),
      ]);
      setTickets(tRes.data);
      setTechnicians(techRes.data);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const s = { TOTAL: tickets.length, OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0, REJECTED: 0, CRITICAL: 0 };
    tickets.forEach(t => {
      if (s[t.status] !== undefined) s[t.status]++;
      if (t.priority === 'CRITICAL') s.CRITICAL++;
    });
    return s;
  }, [tickets]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tickets
      .filter(t => {
        if (q && !t.title.toLowerCase().includes(q) && !String(t.id).includes(q) && !t.createdBy?.name?.toLowerCase().includes(q)) return false;
        if (filterStatus && t.status !== filterStatus) return false;
        if (filterPriority && t.priority !== filterPriority) return false;
        if (filterCategory && t.category !== filterCategory) return false;
        return true;
      })
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9) || new Date(b.updatedAt ?? 0) - new Date(a.updatedAt ?? 0));
  }, [tickets, search, filterStatus, filterPriority, filterCategory]);

  const handleDelete = async (t) => {
    if (!window.confirm(`Delete ticket #${t.id} "${t.title}"?`)) return;
    try {
      await ticketService.delete(t.id);
      setTickets(prev => prev.filter(x => x.id !== t.id));
      toast.success('Ticket deleted');
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const updateTicketInList = (updated) => {
    setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
    setStatusModal(null);
    setAssignModal(null);
  };

  const clearFilters = () => { setSearch(''); setFilterStatus(''); setFilterPriority(''); setFilterCategory(''); };
  const hasFilter = search || filterStatus || filterPriority || filterCategory;

  const terminalStatuses = ['CLOSED', 'REJECTED'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Manage all incident tickets across the campus.</p>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <StatCard label="Total" value={stats.TOTAL} color="border-gray-200" icon={HiOutlineChartBarSquare} />
          <StatCard label="Open" value={stats.OPEN} color="border-blue-200" icon={HiOutlineTicket} />
          <StatCard label="In Progress" value={stats.IN_PROGRESS} color="border-amber-200" icon={HiOutlinePlayCircle} />
          <StatCard label="Resolved" value={stats.RESOLVED} color="border-emerald-200" icon={HiOutlineCheckCircle} />
          <StatCard label="Closed" value={stats.CLOSED} color="border-slate-200" icon={HiOutlineLockClosed} />
          <StatCard label="Rejected" value={stats.REJECTED} color="border-rose-200" icon={HiOutlineXCircle} />
          <StatCard label="Critical" value={stats.CRITICAL} color="border-red-200" icon={HiOutlineExclamationTriangle} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, ID, or reporter…"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { value: filterStatus, set: setFilterStatus, options: TICKET_STATUSES, placeholder: 'All statuses' },
            { value: filterPriority, set: setFilterPriority, options: TICKET_PRIORITIES, placeholder: 'All priorities' },
            { value: filterCategory, set: setFilterCategory, options: TICKET_CATEGORIES, placeholder: 'All categories' },
          ].map(({ value, set, options, placeholder }, i) => (
            <select key={i} value={value} onChange={e => set(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">{placeholder}</option>
              {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ))}
          {hasFilter && (
            <button onClick={clearFilters} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
              Clear
            </button>
          )}
          <button onClick={load} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <HiOutlineArrowPath className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <HiOutlineTicket className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">{hasFilter ? 'No tickets match your filters.' : 'No tickets yet.'}</p>
            {hasFilter && <button onClick={clearFilters} className="mt-2 text-sm text-blue-600 hover:underline">Clear filters</button>}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['#', 'Title', 'Category', 'Priority', 'Status', 'Reporter', 'Assigned to', 'Updated', 'Actions'].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filtered.map(t => {
                    const terminal = terminalStatuses.includes(t.status);
                    return (
                      <tr key={t.id} className={`hover:bg-blue-50/30 transition-colors ${t.priority === 'CRITICAL' ? 'border-l-4 border-l-red-500' : ''}`}>
                        <td className="px-3 py-3 font-mono text-xs text-gray-400">#{t.id}</td>
                        <td className="px-3 py-3 max-w-[200px]">
                          <Link to={`/tickets/${t.id}`} className="font-semibold text-blue-700 hover:underline line-clamp-1">
                            {t.title}
                          </Link>
                          <p className="text-xs text-gray-400 line-clamp-1">{t.description}</p>
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{categoryLabel(t.category)}</td>
                        <td className="px-3 py-3"><PriorityBadge priority={t.priority} /></td>
                        <td className="px-3 py-3"><StatusBadge status={t.status} /></td>
                        <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{t.createdBy?.name ?? '—'}</td>
                        <td className="px-3 py-3 text-xs whitespace-nowrap">
                          {t.assignedTo
                            ? <span className="text-gray-700">{t.assignedTo.name}</span>
                            : <span className="text-gray-400 italic">Unassigned</span>}
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {t.updatedAt ? dayjs(t.updatedAt).format('MMM D, YYYY') : '—'}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1 flex-nowrap">
                            {/* View */}
                            <Link to={`/tickets/${t.id}`}
                              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
                              <HiOutlineEye className="h-3.5 w-3.5" /> View
                            </Link>
                            {/* Change status */}
                            {!terminal && (
                              <button onClick={() => setStatusModal(t)}
                                className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white px-2 py-1 text-xs text-blue-700 hover:bg-blue-50">
                                <HiOutlineArrowPath className="h-3.5 w-3.5" /> Status
                              </button>
                            )}
                            {/* Assign */}
                            {!terminal && technicians.length > 0 && (
                              <button onClick={() => setAssignModal(t)}
                                className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-white px-2 py-1 text-xs text-violet-700 hover:bg-violet-50">
                                <HiOutlineUserCircle className="h-3.5 w-3.5" /> Assign
                              </button>
                            )}
                            {/* Delete */}
                            <button onClick={() => handleDelete(t)}
                              className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs text-red-600 hover:bg-red-50">
                              <HiOutlineTrash className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
              Showing {filtered.length} of {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}{hasFilter ? ' (filtered)' : ''}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {statusModal && (
        <StatusModal
          ticket={statusModal}
          onClose={() => setStatusModal(null)}
          onDone={updateTicketInList}
        />
      )}
      {assignModal && (
        <AssignModal
          ticket={assignModal}
          technicians={technicians}
          onClose={() => setAssignModal(null)}
          onDone={updateTicketInList}
        />
      )}
    </div>
  );
}
