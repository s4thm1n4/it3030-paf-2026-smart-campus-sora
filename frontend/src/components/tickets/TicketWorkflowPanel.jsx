import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ticketService from '../../services/ticketService';
import { getApiErrorMessage } from '../../utils/apiError';

function buildActions(ticket, user) {
  if (!user || !ticket) return [];
  const role = user.role;
  const s = ticket.status;
  const uid = user.id;
  const creatorId = ticket.createdBy?.id;
  const assigneeId = ticket.assignedTo?.id;
  const staff = ['ADMIN', 'TECHNICIAN', 'MANAGER'].includes(role);

  const out = [];
  if (s === 'OPEN' && staff) {
    out.push({ key: 'IN_PROGRESS', label: 'Start work', next: 'IN_PROGRESS' });
  }
  if (s === 'OPEN' && role === 'ADMIN') {
    out.push({ key: 'REJECTED', label: 'Reject', next: 'REJECTED', needsRejectionReason: true });
  }
  if (s === 'IN_PROGRESS') {
    const canResolve = staff || (assigneeId != null && assigneeId === uid);
    if (canResolve) {
      out.push({
        key: 'RESOLVED',
        label: 'Mark resolved',
        next: 'RESOLVED',
        needsResolutionNotes: true,
      });
    }
  }
  if (s === 'RESOLVED') {
    const canClose =
      creatorId === uid ||
      (assigneeId != null && assigneeId === uid) ||
      role === 'ADMIN' ||
      role === 'MANAGER';
    if (canClose) {
      out.push({ key: 'CLOSED', label: 'Close ticket', next: 'CLOSED' });
    }
  }
  return out;
}

export default function TicketWorkflowPanel({ ticket, user, onUpdated }) {
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null);
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [assignId, setAssignId] = useState('');

  const actions = buildActions(ticket, user);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      ticketService
        .getTechnicians()
        .then(({ data }) => setTechnicians(data))
        .catch(() => {});
    }
  }, [user?.role]);

  useEffect(() => {
    if (ticket?.assignedTo?.id) {
      setAssignId(String(ticket.assignedTo.id));
    } else {
      setAssignId('');
    }
  }, [ticket?.assignedTo?.id]);

  const patchStatus = async (next, extra = {}) => {
    setBusy(true);
    try {
      const payload = { status: next, ...extra };
      const { data } = await ticketService.updateStatus(ticket.id, payload);
      toast.success('Status updated');
      onUpdated(data);
      setModal(null);
      setNotes('');
      setReason('');
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const onActionClick = (action) => {
    if (action.needsRejectionReason) {
      setModal({ type: 'reject', action });
      setReason('');
      return;
    }
    if (action.needsResolutionNotes) {
      setModal({ type: 'resolve', action });
      setNotes('');
      return;
    }
    patchStatus(action.next);
  };

  const confirmReject = () => {
    if (!reason.trim()) {
      toast.error('A rejection reason is required');
      return;
    }
    patchStatus('REJECTED', { rejectionReason: reason.trim() });
  };

  const confirmResolve = () => {
    if (!notes.trim()) {
      toast.error('Resolution notes are required');
      return;
    }
    patchStatus('RESOLVED', { resolutionNotes: notes.trim() });
  };

  const handleAssign = async () => {
    if (!assignId) {
      toast.error('Select a technician');
      return;
    }
    setBusy(true);
    try {
      const { data } = await ticketService.assign(ticket.id, Number(assignId));
      toast.success('Assignee updated');
      onUpdated(data);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const canAssign = user?.role === 'ADMIN' && ticket?.status !== 'CLOSED' && ticket?.status !== 'REJECTED';

  if (actions.length === 0 && !canAssign) {
    return null;
  }

  return (
    <section className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Workflow</h2>

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {actions.map((a) => (
            <button
              key={a.key}
              type="button"
              disabled={busy}
              onClick={() => onActionClick(a)}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      {canAssign && (
        <div className="border-t border-blue-100 pt-4 mt-2">
          <p className="text-sm font-medium text-gray-800 mb-2">Assign technician</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={assignId}
              onChange={(e) => setAssignId(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">— Select —</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={busy || !assignId}
              onClick={handleAssign}
              className="rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
            >
              Assign
            </button>
          </div>
        </div>
      )}

      {modal?.type === 'reject' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reject ticket</h3>
            <p className="text-sm text-gray-600 mb-3">Provide a reason visible to the reporter.</p>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-4"
              placeholder="Reason for rejection…"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={confirmReject}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Reject ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {modal?.type === 'resolve' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Mark as resolved</h3>
            <p className="text-sm text-gray-600 mb-3">Describe what was done to fix the issue.</p>
            <textarea
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-4"
              placeholder="Resolution notes…"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={confirmResolve}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Save & resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
