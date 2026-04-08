import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import {
  HiOutlineArrowLeft,
  HiOutlineTag,
  HiOutlineMapPin,
  HiOutlineUser,
  HiOutlineWrenchScrewdriver,
  HiOutlineBuildingOffice2,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineExclamationTriangle,
  HiOutlineCheckBadge,
} from 'react-icons/hi2';
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

// Timeline dot colour per status
const historyDotCls = {
  OPEN: 'bg-blue-500',
  IN_PROGRESS: 'bg-amber-500',
  RESOLVED: 'bg-emerald-500',
  CLOSED: 'bg-slate-500',
  REJECTED: 'bg-rose-500',
};

function DetailRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <Icon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 break-words">{value}</p>
      </div>
    </div>
  );
}

function ImageGallery({ urls }) {
  const [active, setActive] = useState(null);
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {urls.map((url) => (
          <button
            key={url}
            type="button"
            onClick={() => setActive(url)}
            className="block overflow-hidden rounded-lg border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <img
              src={url}
              alt=""
              className="h-36 w-full object-cover hover:opacity-90 transition-opacity"
            />
          </button>
        ))}
      </div>
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActive(null)}
        >
          <img
            src={active}
            alt=""
            className="max-h-[90vh] max-w-full rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setActive(null)}
            className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

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

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    facilityService.getAll().then(({ data }) => setFacilities(data)).catch(() => setFacilities([]));
  }, []);

  const isAdmin = user?.role === 'ADMIN';
  const isOwner = ticket && user?.id === ticket.createdBy?.id;

  // Only admins can edit
  const canEdit =
    ticket &&
    isAdmin &&
    (ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS');

  // Users cancel their own OPEN tickets; admins can delete any
  const canCancel = ticket && isOwner && ticket.status === 'OPEN';
  const canAdminDelete = ticket && isAdmin;

  const handleDelete = async () => {
    const msg = isAdmin
      ? 'Permanently delete this ticket?'
      : 'Cancel this ticket? This cannot be undone.';
    if (!window.confirm(msg)) return;
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
      {/* Breadcrumb + header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            to="/tickets"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-900 mb-2"
          >
            <HiOutlineArrowLeft className="h-4 w-4" />
            Back to service desk
          </Link>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="font-mono text-sm text-gray-400">#{ticket.id}</span>
            <h1 className="text-xl font-bold text-gray-900 break-words">{ticket.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <span className="text-xs text-gray-400">
              Reported {ticket.createdAt ? dayjs(ticket.createdAt).format('MMM D, YYYY · h:mm A') : '—'}
              {ticket.createdBy?.name && ` by ${ticket.createdBy.name}`}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {canEdit && (
            <button
              type="button"
              onClick={() => setShowEdit(true)}
              className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50"
            >
              Edit
            </button>
          )}
          {canCancel && (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50"
            >
              Cancel ticket
            </button>
          )}
          {!canCancel && canAdminDelete && (
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
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
              Description
            </h2>
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
          </section>

          {/* Rejection / Resolution */}
          {(ticket.rejectionReason || ticket.resolutionNotes) && (
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
              {ticket.rejectionReason && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <HiOutlineExclamationTriangle className="h-4 w-4 text-rose-600" />
                    <h3 className="text-sm font-semibold text-rose-700">Rejection reason</h3>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{ticket.rejectionReason}</p>
                </div>
              )}
              {ticket.resolutionNotes && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <HiOutlineCheckBadge className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-sm font-semibold text-emerald-700">Resolution</h3>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{ticket.resolutionNotes}</p>
                </div>
              )}
            </section>
          )}

          {/* Attachments */}
          {ticket.imageUrls && ticket.imageUrls.length > 0 && (
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">
                Photo evidence ({ticket.imageUrls.length})
              </h2>
              <ImageGallery urls={ticket.imageUrls} />
            </section>
          )}

          {/* Status history */}
          {history.length > 0 && (
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">
                Status history
              </h2>
              <ol className="relative border-l border-gray-200 ml-2 space-y-5">
                {history.map((h) => {
                  const dotCls = historyDotCls[h.toStatus] ?? 'bg-gray-400';
                  return (
                    <li key={h.id} className="relative pl-6">
                      <span
                        className={`absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white ${dotCls}`}
                      />
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <p className="text-sm font-semibold text-gray-900">
                          {h.fromStatus != null ? statusLabel(h.fromStatus) : 'Created'}
                          {h.fromStatus != null && (
                            <span className="font-normal text-gray-400"> → {statusLabel(h.toStatus)}</span>
                          )}
                        </p>
                        <span className="text-xs text-gray-400">
                          {h.changedBy?.name ?? 'System'} ·{' '}
                          {h.createdAt ? dayjs(h.createdAt).format('MMM D, YYYY h:mm A') : ''}
                        </span>
                      </div>
                      {h.note && (
                        <p className="mt-1 text-sm text-gray-600 italic whitespace-pre-wrap">
                          "{h.note}"
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {/* Comments */}
          <TicketCommentThread ticketId={ticket.id} user={user} canView />
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Details */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
              Details
            </h2>
            <div>
              <DetailRow icon={HiOutlineTag} label="Category" value={categoryLabel(ticket.category)} />
              <DetailRow icon={HiOutlineTag} label="Priority" value={priorityLabel(ticket.priority)} />
              <DetailRow icon={HiOutlineUser} label="Reporter" value={ticket.createdBy?.name} />
              <DetailRow
                icon={HiOutlineWrenchScrewdriver}
                label="Assigned to"
                value={ticket.assignedTo?.name ?? 'Unassigned'}
              />
              <DetailRow icon={HiOutlineMapPin} label="Location" value={ticket.location} />
              <DetailRow
                icon={HiOutlineBuildingOffice2}
                label="Facility"
                value={
                  ticket.facility
                    ? `${ticket.facility.name} (${ticket.facility.location})`
                    : null
                }
              />
            </div>
          </section>

          {/* Contact */}
          {(ticket.contactName || ticket.contactEmail || ticket.contactPhone) && (
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                Contact preferences
              </h2>
              <div>
                <DetailRow icon={HiOutlineUser} label="Name" value={ticket.contactName} />
                <DetailRow icon={HiOutlineEnvelope} label="Email" value={ticket.contactEmail} />
                <DetailRow icon={HiOutlinePhone} label="Phone" value={ticket.contactPhone} />
              </div>
            </section>
          )}

          {/* Workflow */}
          <TicketWorkflowPanel ticket={ticket} user={user} onUpdated={(t) => setTicket(t)} />
        </div>
      </div>

      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Edit ticket</h2>
                <p className="text-sm text-gray-500">Update ticket details below.</p>
              </div>
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
              onSuccess={(updated) => { setTicket(updated); setShowEdit(false); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}