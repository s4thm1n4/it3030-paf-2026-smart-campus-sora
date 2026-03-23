import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { HiOutlineArrowLeft } from 'react-icons/hi2';
import ticketService from '../../services/ticketService';
import facilityService from '../../services/facilityService';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../utils/apiError';
import { categoryLabel, priorityLabel, statusLabel } from '../../constants/tickets';
import StatusBadge from '../../components/tickets/StatusBadge';
import PriorityBadge from '../../components/tickets/PriorityBadge';
import TicketForm from '../../components/tickets/TicketForm';
import TicketWorkflowPanel from '../../components/tickets/TicketWorkflowPanel';
import TicketCommentThread from '../../components/tickets/TicketCommentThread';

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [facilities, setFacilities] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await ticketService.getById(id);
      setTicket(data);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    facilityService
      .getAll()
      .then(({ data }) => setFacilities(data))
      .catch(() => setFacilities([]));
  }, []);

  const canEdit =
    ticket &&
    (ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') &&
    (user?.id === ticket.createdBy?.id || user?.role === 'ADMIN');

  const canDelete =
    ticket &&
    (user?.role === 'ADMIN' || (user?.id === ticket.createdBy?.id && ticket.status === 'OPEN'));

  const handleDelete = async () => {
    if (!window.confirm('Delete this ticket permanently?')) return;
    try {
      await ticketService.delete(ticket.id);
      toast.success('Ticket deleted');
      navigate('/tickets');
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600 mb-4">Ticket could not be loaded.</p>
        <Link to="/tickets" className="text-blue-600 font-medium hover:underline">
          Back to tickets
        </Link>
      </div>
    );
  }

  const history = ticket.statusHistory ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            to="/tickets"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-900 mb-2"
          >
            <HiOutlineArrowLeft className="h-4 w-4" />
            Back to list
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            #{ticket.id} · Reported{' '}
            {ticket.createdAt ? dayjs(ticket.createdAt).format('MMM D, YYYY h:mm A') : '—'}
            {ticket.createdBy?.name && ` · ${ticket.createdBy.name}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <button
              type="button"
              onClick={() => setShowEdit(true)}
              className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50"
            >
              Edit
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">
              Description
            </h2>
            <p className="text-gray-800 whitespace-pre-wrap">{ticket.description}</p>
          </section>

          {(ticket.rejectionReason || ticket.resolutionNotes) && (
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              {ticket.rejectionReason && (
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-rose-700 mb-1">Rejection reason</h2>
                  <p className="text-gray-800 whitespace-pre-wrap">{ticket.rejectionReason}</p>
                </div>
              )}
              {ticket.resolutionNotes && (
                <div>
                  <h2 className="text-sm font-semibold text-emerald-700 mb-1">Resolution</h2>
                  <p className="text-gray-800 whitespace-pre-wrap">{ticket.resolutionNotes}</p>
                </div>
              )}
            </section>
          )}

          {ticket.imageUrls && ticket.imageUrls.length > 0 && (
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {ticket.imageUrls.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-lg border border-gray-100 bg-gray-50"
                  >
                    <img src={url} alt="" className="h-40 w-full object-cover hover:opacity-90" />
                  </a>
                ))}
              </div>
            </section>
          )}

          {history.length > 0 && (
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Status history</h2>
              <ol className="relative border-l border-gray-200 ml-3 space-y-6">
                {history.map((h) => (
                  <li key={h.id} className="relative pl-6">
                    <span className="absolute left-[-6px] top-1.5 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-white" />
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">
                        {h.fromStatus != null ? statusLabel(h.fromStatus) : '—'}
                      </span>
                      {' → '}
                      <span className="font-medium">{statusLabel(h.toStatus)}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {h.changedBy?.name ?? 'System'} ·{' '}
                      {h.createdAt ? dayjs(h.createdAt).format('MMM D, YYYY h:mm A') : ''}
                    </p>
                    {h.note && (
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{h.note}</p>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          <TicketCommentThread ticketId={ticket.id} user={user} canView />
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Details
            </h2>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-gray-500">Category</dt>
                <dd className="font-medium text-gray-900">{categoryLabel(ticket.category)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Priority</dt>
                <dd className="font-medium text-gray-900">{priorityLabel(ticket.priority)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Reporter</dt>
                <dd className="font-medium text-gray-900">{ticket.createdBy?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Assigned to</dt>
                <dd className="font-medium text-gray-900">{ticket.assignedTo?.name ?? 'Unassigned'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Location</dt>
                <dd className="font-medium text-gray-900">{ticket.location ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Facility</dt>
                <dd className="font-medium text-gray-900">
                  {ticket.facility
                    ? `${ticket.facility.name} (${ticket.facility.location})`
                    : '—'}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Contact preferences
            </h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Name</dt>
                <dd className="text-gray-900">{ticket.contactName ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="text-gray-900">{ticket.contactEmail ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="text-gray-900">{ticket.contactPhone ?? '—'}</dd>
              </div>
            </dl>
          </section>

          <TicketWorkflowPanel ticket={ticket} user={user} onUpdated={(t) => setTicket(t)} />
        </div>
      </div>

      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Edit ticket</h2>
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <TicketForm
              mode="edit"
              ticket={ticket}
              facilities={facilities}
              onCancel={() => setShowEdit(false)}
              onSuccess={(updated) => {
                setTicket(updated);
                setShowEdit(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
