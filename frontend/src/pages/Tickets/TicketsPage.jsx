import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import {
  HiOutlinePlusCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineTicket,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from 'react-icons/hi2';
import ticketService from '../../services/ticketService';
import facilityService from '../../services/facilityService';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../utils/apiError';
import {
  categoryLabel,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from '../../constants/tickets';
import StatusBadge from '../../components/tickets/StatusBadge';
import PriorityBadge from '../../components/tickets/PriorityBadge';
import TicketForm from '../../components/tickets/TicketForm';

const PRIORITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function StatCard({ label, value, color }) {
  return (
    <div className={`rounded-xl border ${color} bg-white px-5 py-4 shadow-sm`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export default function TicketsPage() {
  const { isStaff, isTechnician, user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('my');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTicket, setEditTicket] = useState(null);
  const [facilities, setFacilities] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    facilityService
      .getAll()
      .then(({ data }) => setFacilities(data))
      .catch(() => setFacilities([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        let res;
        if (tab === 'my') res = await ticketService.getMyTickets();
        else if (tab === 'queue') res = await ticketService.getAll();
        else res = await ticketService.getAssigned();
        if (!cancelled) setTickets(res.data);
      } catch (e) {
        if (!cancelled) {
          toast.error(getApiErrorMessage(e));
          setTickets([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [tab]);

  // Client-side filter + sort
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tickets
      .filter((t) => {
        if (q && !t.title.toLowerCase().includes(q) && !t.description?.toLowerCase().includes(q)) return false;
        if (filterStatus && t.status !== filterStatus) return false;
        if (filterPriority && t.priority !== filterPriority) return false;
        if (filterCategory && t.category !== filterCategory) return false;
        return true;
      })
      .sort((a, b) => {
        const pd = (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
        if (pd !== 0) return pd;
        return new Date(b.updatedAt ?? 0) - new Date(a.updatedAt ?? 0);
      });
  }, [tickets, search, filterStatus, filterPriority, filterCategory]);

  // Stats
  const stats = useMemo(() => {
    const counts = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0, REJECTED: 0 };
    tickets.forEach((t) => { if (counts[t.status] !== undefined) counts[t.status]++; });
    return counts;
  }, [tickets]);

  const reload = async () => {
    try {
      let res;
      if (tab === 'my') res = await ticketService.getMyTickets();
      else if (tab === 'queue') res = await ticketService.getAll();
      else res = await ticketService.getAssigned();
      setTickets(res.data);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const handleDelete = async (t) => {
    const isAdmin = user?.role === 'ADMIN';
    const msg = isAdmin
      ? `Delete ticket #${t.id} "${t.title}"?`
      : `Cancel ticket #${t.id} "${t.title}"? This cannot be undone.`;
    if (!window.confirm(msg)) return;
    try {
      await ticketService.delete(t.id);
      toast.success('Ticket deleted');
      setTickets((prev) => prev.filter((x) => x.id !== t.id));
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const clearFilters = () => {
    setSearch('');
    setFilterStatus('');
    setFilterPriority('');
    setFilterCategory('');
  };

  const hasActiveFilter = search || filterStatus || filterPriority || filterCategory;

  const switchTab = (next) => {
    setTab(next);
    clearFilters();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Service Desk</h1>
          <p className="mt-1 text-sm text-gray-500">
            Report campus incidents, track maintenance work, and collaborate with operations staff.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <HiOutlinePlusCircle className="h-5 w-5" />
          New ticket
        </button>
      </div>

      {/* Stats row */}
      {!loading && tickets.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatCard label="Open" value={stats.OPEN} color="border-blue-200" />
          <StatCard label="In progress" value={stats.IN_PROGRESS} color="border-amber-200" />
          <StatCard label="Resolved" value={stats.RESOLVED} color="border-emerald-200" />
          <StatCard label="Closed" value={stats.CLOSED} color="border-slate-200" />
          <StatCard label="Rejected" value={stats.REJECTED} color="border-rose-200" />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap gap-4" aria-label="Tabs">
          {[
            { key: 'my', label: 'My tickets', show: true },
            { key: 'queue', label: 'All tickets', show: isStaff() },
            { key: 'assigned', label: 'Assigned to me', show: isTechnician() },
          ]
            .filter((t) => t.show)
            .map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => switchTab(t.key)}
                className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium ${
                  tab === t.key
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {t.label}
                {tab === t.key && tickets.length > 0 && (
                  <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    {tickets.length}
                  </span>
                )}
              </button>
            ))}
        </nav>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets…"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            {TICKET_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All priorities</option>
            {TICKET_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All categories</option>
            {TICKET_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Clear
            </button>
          )}
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
            <div className="mb-3 rounded-full bg-gray-100 p-4">
              <HiOutlineTicket className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              {hasActiveFilter ? 'No tickets match your filters.' : 'No tickets in this view yet.'}
            </p>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Ticket
                  </th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Updated
                  </th>
                  {isStaff() && tab === 'queue' && (
                    <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Reporter
                    </th>
                  )}
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filtered.map((t) => {
                  const isAdmin = user?.role === 'ADMIN';
                  const isOwner = user?.id === t.createdBy?.id;
                  // Only admins can edit tickets
                  const canEdit =
                    isAdmin &&
                    (t.status === 'OPEN' || t.status === 'IN_PROGRESS');
                  // Users can cancel (delete) their own OPEN tickets; admins can delete any
                  const canCancel = isOwner && t.status === 'OPEN';
                  const canAdminDelete = isAdmin;
                  return (
                  <tr
                    key={t.id}
                    className={`hover:bg-blue-50/40 transition-colors ${
                      t.priority === 'CRITICAL' ? 'border-l-4 border-l-red-500' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">#{t.id}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/tickets/${t.id}`}
                        className="font-semibold text-blue-700 hover:text-blue-900 hover:underline"
                      >
                        {t.title}
                      </Link>
                      <div className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                        {t.description}
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-sm text-gray-600">
                      {categoryLabel(t.category)}
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-500">
                      {t.updatedAt ? dayjs(t.updatedAt).format('MMM D, YYYY') : '—'}
                    </td>
                    {isStaff() && tab === 'queue' && (
                      <td className="hidden lg:table-cell px-4 py-3 text-sm text-gray-600">
                        {t.createdBy?.name ?? '—'}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => setEditTicket(t)}
                            className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                          >
                            <HiOutlinePencilSquare className="h-3.5 w-3.5" />
                            Edit
                          </button>
                        )}
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => handleDelete(t)}
                            className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-white px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50"
                          >
                            <HiOutlineTrash className="h-3.5 w-3.5" />
                            Cancel ticket
                          </button>
                        )}
                        {!canCancel && canAdminDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(t)}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            <HiOutlineTrash className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        )}
                        {!canEdit && !canCancel && !canAdminDelete && (
                          <Link
                            to={`/tickets/${t.id}`}
                            className="text-xs text-gray-400 hover:text-blue-600"
                          >
                            View →
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
              Showing {filtered.length} of {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
              {hasActiveFilter && ' (filtered)'}
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Edit ticket #{editTicket.id}</h2>
                <p className="text-sm text-gray-500">Update the ticket details below.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditTicket(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <TicketForm
              mode="edit"
              ticket={editTicket}
              facilities={facilities}
              onCancel={() => setEditTicket(null)}
              onSuccess={async (updated) => {
                setEditTicket(null);
                setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
                toast.success('Ticket updated');
              }}
            />
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">New incident ticket</h2>
                <p className="text-sm text-gray-500">
                  Describe the issue and attach up to three photos if helpful.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <TicketForm
              mode="create"
              facilities={facilities}
              onCancel={() => setShowCreate(false)}
              onSuccess={async () => {
                setShowCreate(false);
                setTab('my');
                try {
                  const { data } = await ticketService.getMyTickets();
                  setTickets(data);
                } catch (e) {
                  toast.error(getApiErrorMessage(e));
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
