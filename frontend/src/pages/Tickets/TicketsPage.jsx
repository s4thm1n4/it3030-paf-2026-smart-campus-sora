import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { HiOutlinePlusCircle } from 'react-icons/hi2';
import ticketService from '../../services/ticketService';
import facilityService from '../../services/facilityService';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../utils/apiError';
import { categoryLabel } from '../../constants/tickets';
import StatusBadge from '../../components/tickets/StatusBadge';
import PriorityBadge from '../../components/tickets/PriorityBadge';
import TicketForm from '../../components/tickets/TicketForm';

export default function TicketsPage() {
  const { isStaff, isTechnician } = useAuth();
  const [tab, setTab] = useState('my');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [facilities, setFacilities] = useState([]);

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
        if (tab === 'my') {
          res = await ticketService.getMyTickets();
        } else if (tab === 'queue') {
          res = await ticketService.getAll();
        } else {
          res = await ticketService.getAssigned();
        }
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
    return () => {
      cancelled = true;
    };
  }, [tab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Service desk</h1>
          <p className="mt-1 text-sm text-gray-600">
            Report campus incidents, track maintenance work, and collaborate with operations staff.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <HiOutlinePlusCircle className="h-5 w-5" />
          New ticket
        </button>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap gap-4" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setTab('my')}
            className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium ${
              tab === 'my'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            My tickets
          </button>
          {isStaff() && (
            <button
              type="button"
              onClick={() => setTab('queue')}
              className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium ${
                tab === 'queue'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              All tickets
            </button>
          )}
          {isTechnician() && (
            <button
              type="button"
              onClick={() => setTab('assigned')}
              className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium ${
                tab === 'assigned'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Assigned to me
            </button>
          )}
        </nav>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-gray-500">
            No tickets in this view yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Ticket
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Status
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3">
                      <Link
                        to={`/tickets/${t.id}`}
                        className="font-medium text-blue-700 hover:text-blue-900 hover:underline"
                      >
                        {t.title}
                      </Link>
                      <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">{t.description}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{categoryLabel(t.category)}</td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-500">
                      {t.updatedAt ? dayjs(t.updatedAt).format('MMM D, YYYY') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">New incident ticket</h2>
                <p className="text-sm text-gray-600">
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
